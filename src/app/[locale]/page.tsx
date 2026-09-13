import { setRequestLocale } from "next-intl/server";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Marquee } from "@/components/sections/marquee";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Showcase } from "@/components/sections/showcase";
import { Works } from "@/components/sections/works";
import { Cursor } from "@/components/site/cursor";
import { Nav } from "@/components/site/nav";
import { Preloader } from "@/components/site/preloader";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Showcase />
        <Works />
        <Services />
        <Process />
        <Contact />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
