/* Dev-only real browser test. npm install; npx playwright install chromium; npm run test:browser.
   Optional CHROMIUM_PATH and CHROMIUM_ARGS_MODULE support a packaged headless browser. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { chromium } = require("playwright");
(async () => {
  const root = path.resolve(__dirname, "..");
  const server = http.createServer((req, res) => {
    try {
      let url = new URL(req.url, "http://localhost").pathname;
      if (url === "/favicon.ico") {
        res.writeHead(204);
        return res.end();
      }
      url = url.replace(/^\/aircraft-mass-game/, "");
      let p = path.join(root, url);
      if (p.endsWith("/")) p += "index.html";
      if (!p.startsWith(root + path.sep)) throw Error("Path");
      const mime = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".md": "text/plain",
      };
      res.setHeader(
        "Content-Type",
        mime[path.extname(p)] || "application/octet-stream",
      );
      res.end(fs.readFileSync(p));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const local = `http://127.0.0.1:${server.address().port}/aircraft-mass-game/`;
  const base = process.env.GAME_URL || local;
  const entry = process.env.CACHE_BUST ? base + '?verify=' + encodeURIComponent(process.env.CACHE_BUST) : base;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: process.env.BROWSER_PROXY ? {server: process.env.BROWSER_PROXY} : undefined,
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: process.env.CHROMIUM_ARGS_MODULE
        ? require(process.env.CHROMIUM_ARGS_MODULE).args.filter(
            (a) => !["--single-process", "--disable-web-security"].includes(a),
          )
        : ["--no-sandbox"],
    });
    const createContext = (options = {}) => browser.newContext({...options, ignoreHTTPSErrors: process.env.QA_PROXY_TLS === '1'});
    const errors = [],
      badAssets = [];
    const context = await createContext({
      viewport: { width: 1440, height: 1000 },
    });
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400) badAssets.push(r.url() + ": " + r.status());
    });
    await p.goto(entry);
    assert.match(await p.title(), /2.0/);
    const state = () => p.evaluate(() => FlightLab.getState());
    const set = async (k, n) => {
      await p.locator("#load-" + k).fill(String(n));
      await p.locator("#load-" + k).press("Tab");
    };
    await p.locator("#quick-board").click();
    assert.equal((await state()).load.front, 1);
    assert.equal((await state()).load.bagsFront, 1);
    assert.match(await p.locator("#tom").textContent(), /5,100/);
    await p.reload();
    assert.equal((await state()).load.front, 1);
    await p.locator("#restart").click();
    assert.equal((await state()).load.front, 0);
    for (let i = 0; i < 10; i++) {
      await p.locator("#mission").selectOption(String(i));
      if (i === 0) {
        await p.locator("#quick-board").click();
        await p.locator("#quick-board").click();
      }
      if (i === 1) await p.locator("#defer-late").click();
      if (i === 2) {
        await set("fuel", 800);
        await set("cargoFront", 100);
        await set("cargoRear", 100);
      }
      if (i === 3) {
        await p.locator("#transfer-bags").click();
      }
      if (i === 4 || i === 9) await p.locator("#runway").click();
      if (i === 5)
        for (const [k, n] of Object.entries({
          front: 4,
          rear: 4,
          bagsFront: 4,
          bagsRear: 4,
          cargoFront: 0,
          cargoRear: 0,
        }))
          await set(k, n);
      if (i === 8) {
        await p.locator("#verify").click();
        await set("cargoRear", 0);
      }
      for (let n = 0; n < 20 && !(await state()).outcome; n++) {
        const st = await state();
        if (st.phase === "cruise" && i === 9 && st.route !== "diversion")
          await p.locator("#divert").click();
        if (["cruise", "descent", "landing"].includes(st.phase)) {
          let need = await p.evaluate(
            () => MassV2.arrival(FlightLab.getState()).mass > RF01.limits.lm,
          );
          let guard = 0;
          while (need && guard++ < 12) {
            await p.locator("#hold").click();
            need = await p.evaluate(
              () => MassV2.arrival(FlightLab.getState()).mass > RF01.limits.lm,
            );
          }
        }
        await p.locator("#primary").click();
      }
      const done = await state();
      assert(
        ["success", "safe-diversion"].includes(done.outcome?.type),
        "Mission " + (i + 1),
      );
      assert.equal(await p.locator("#debrief").isVisible(), true);
      await p.locator('[data-what="runway"]').click();
      assert.match(await p.locator("#what-result").textContent(), /revised:/);
      console.log("PASS browser campaign mission " + (i + 1));
    }
    await p.locator("#restart").click();
    await p.locator("#mission").selectOption("3");
    await p.locator("#cancel").click();
    assert.equal((await state()).outcome.type, "safe-cancellation");
    await p.locator("#retry").click();
    assert.equal((await state()).phase, "loading");
    await p.locator('[data-mode="learn"]').click();
    assert(await p.locator("#learn").isVisible());
    for (const name of ["source-diagram.png", "source-definitions.png"]) {
      const response = await context.request.get(base + "assets/" + name);
      assert.equal(response.status(), 200);
      assert((await response.body()).length > 50000);
    }
    await p.locator('[data-mode="lab"]').click();
    await p.locator("#add-fuel").click();
    assert.equal((await state()).load.fuel, 800);
    await p.locator("#trip").fill("450");
    await p.locator("#trip").press("Tab");
    assert.equal((await state()).trip, 450);
    await p.locator('[data-mode="play"]').click();
    await p.locator("#mission").selectOption("0");
    await p.locator('[data-station="front"]').focus();
    await p.keyboard.press("Enter");
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      "load-front",
    );
    await p.locator("#load-front").fill("-1");
    await p.keyboard.press("Tab");
    assert.equal((await state()).load.front, 0);
    for (const size of [
      { width: 1440, height: 1000 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await p.setViewportSize(size);
      await p.evaluate(() => window.scrollTo(0, 0));
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        JSON.stringify(size) + " horizontal overflow",
      );
      await p.locator("#load-fuel").scrollIntoViewIfNeeded();
      const status = await p.locator(".status").boundingBox();
      assert(status.y >= -1 && status.y < 5, JSON.stringify(size) + " sticky");
      if (size.width > 900) {
        const plane = await p.locator(".aircraft-card").boundingBox();
        assert(plane.y >= 70 && plane.y < 130, "desktop aircraft sticky");
      }
      console.log("PASS viewport " + size.width + " × " + size.height);
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    assert(
      await p.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    );
    await p.locator("#quick-board").click();
    assert.equal((await state()).load.front, 1);
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.screenshot({
        path: path.join(process.env.SCREENSHOT_DIR, "mobile.png"),
        fullPage: true,
      });
      await p.setViewportSize({ width: 1440, height: 1000 });
      await p.screenshot({
        path: path.join(process.env.SCREENSHOT_DIR, "desktop.png"),
        fullPage: true,
      });
    }
    const blocked = await createContext();
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw Error("disabled");
        },
      }),
    );
    const bp = await blocked.newPage();
    await bp.goto(entry);
    await bp.locator("#quick-board").click();
    assert.match(await bp.locator("#save-status").textContent(), /unavailable/);
    assert.match(await bp.locator("#tom").textContent(), /5,100/);
    await blocked.close();
    const corrupt = await createContext();
    await corrupt.addInitScript(() =>
      localStorage.setItem("flightlab-mass-v2", "{bad json"),
    );
    const cp = await corrupt.newPage();
    await cp.goto(entry);
    await cp.locator("#quick-board").click();
    assert.match(await cp.locator("#tom").textContent(), /5,100/);
    await corrupt.close();
    const touch = await createContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const tp = await touch.newPage();
    await tp.goto(entry);
    await tp.locator("#quick-board").tap();
    assert.equal(await tp.evaluate(() => FlightLab.getState().load.front), 1);
    await touch.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(badAssets, []);
    console.log(
      "PASS navigation, sources, what-if, keyboard, input validation, local persistence, blocked storage, reduced motion, touch; no console or HTTP errors.",
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
