import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const sizes = [[1920, 1080], [1536, 864], [1366, 768], [1024, 768], [768, 1024], [390, 844]];
for (const path of ["/", "/kz", "/en"]) {
  for (const [w, h] of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto("https://assyltech.kz" + path, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 6000));
    const res = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const cs = getComputedStyle(h1);
      const c = document.createElement("canvas").getContext("2d");
      c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      c.letterSpacing = cs.letterSpacing;
      const lines = [...h1.querySelectorAll("[data-line]")];
      const box = h1.getBoundingClientRect().width;
      const widest = Math.max(...lines.map((l) => c.measureText(l.textContent).width));
      return { fontSize: Math.round(parseFloat(cs.fontSize)), box: Math.round(box), widest: Math.round(widest) };
    });
    const ok = res.widest <= res.box;
    console.log(`${path.padEnd(4)} ${String(w).padStart(4)}px  шрифт ${String(res.fontSize).padStart(3)}px  текст ${String(res.widest).padStart(4)} / колонка ${String(res.box).padStart(4)}  ${ok ? "OK" : "ОБРЕЗАЕТСЯ"}`);
    await page.close();
  }
}
await browser.close();
