import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ru: `${site.url}/`, kk: `${site.url}/kz`, en: `${site.url}/en` };
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${site.url}/kz`, changeFrequency: "monthly", priority: 0.8, alternates: { languages } },
    { url: `${site.url}/en`, changeFrequency: "monthly", priority: 0.8, alternates: { languages } },
  ];
}
