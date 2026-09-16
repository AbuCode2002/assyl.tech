import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
for (const [path, name] of [["/", "hero-ru.jpg"], ["/kz", "hero-kz.jpg"]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 864, deviceScaleFactor: 1 });
  await page.goto("https://assyltech.kz" + path, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 8000));
  await page.screenshot({ path: name, type: "jpeg", quality: 80 });
  await page.close();
}
await browser.close();
console.log("готово");
