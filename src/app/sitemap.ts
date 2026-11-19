import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ru: `${site.url}/`, kk: `${site.url}/kz`, en: `${site.url}/en`, ar: `${site.url}/ar` };
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority,
    alternates: { languages },
  });
  return [page("/", 1), page("/kz", 0.8), page("/en", 0.8), page("/ar", 0.8)];
}
