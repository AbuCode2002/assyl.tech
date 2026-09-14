import type { Locale } from "@/i18n/routing";

type L = Record<Locale, string>;

export type Project = {
  id: string;
  /** big display title */
  title: L;
  client: L;
  category: L;
  year: string;
  platform: "mobile" | "web";
  /** poster + looping preview (public/media) */
  poster: string;
  video: string;
  /** extra stills for the case modal */
  stills?: string[];
  summary: L;
  /** what the product does — bullet list */
  features: Record<Locale, string[]>;
  stack: string[];
  accent: string;
};

/** Portfolio. Add new works here — order = order on the site. */
export const projects: Project[] = [
  {
    id: "storeplan",
    title: { ru: "Store Plan", kz: "Store Plan", en: "Store Plan" },
    client: { ru: "Ритейл", kz: "Ритейл", en: "Retail" },
    category: { ru: "Мобильное приложение · 3D", kz: "Мобильді қосымша · 3D", en: "Mobile app · 3D" },
    year: "2026",
    platform: "mobile",
    poster: "/media/storeplan.jpg",
    video: "/media/storeplan.mp4",
    summary: {
      ru: "Планировщик торгового зала: обмер помещения по стенам, расстановка стеллажей и оборудования, мгновенная 3D-модель магазина и коммерческое предложение.",
      kz: "Сауда залын жоспарлау: бөлмені қабырғалар бойынша өлшеу, сөрелер мен жабдықты орналастыру, дүкеннің лезде 3D-моделі және коммерциялық ұсыныс.",
      en: "Store floor planner: measure the room wall by wall, lay out shelving and equipment, get an instant 3D model of the store and a commercial proposal.",
    },
    features: {
      ru: ["Обмерный ход с проверкой замыкания контура", "Двери, витрины, колонны и розетки на плане", "Автораскладка стеллажей по категориям товаров", "3D-сцена и экспорт в .glb"],
      kz: ["Контурдың тұйықталуын тексеретін өлшеу жүрісі", "Жоспардағы есіктер, витриналар, бағандар мен розеткалар", "Тауар санаттары бойынша сөрелерді автоматты орналастыру", "3D-сахна және .glb экспорты"],
      en: ["Wall-by-wall survey with loop-closure check", "Doors, windows, columns and sockets on the plan", "Auto-layout of shelving by product category", "3D scene and .glb export"],
    },
    stack: ["React Native", "Three.js", "TypeScript", "Node.js"],
    accent: "#3b7bff",
  },
  {
    id: "krovla",
    title: { ru: "Krovla", kz: "Krovla", en: "Krovla" },
    client: { ru: "Кровельная компания", kz: "Шатыр компаниясы", en: "Roofing company" },
    category: { ru: "Мобильное приложение · Расчёты", kz: "Мобильді қосымша · Есептеулер", en: "Mobile app · Estimating" },
    year: "2026",
    platform: "mobile",
    poster: "/media/krovla.jpg",
    video: "/media/krovla.mp4",
    summary: {
      ru: "Приложение для замерщика: план дома, форма и уклон кровли, подбор материала с 3D-визуализацией и готовое КП в PDF прямо на объекте.",
      kz: "Өлшеушіге арналған қосымша: үй жоспары, шатырдың пішіні мен еңісі, 3D-визуализациямен материал таңдау және нысанда дайын PDF ұсыныс.",
      en: "An estimator's app: house plan, roof shape and pitch, material selection with 3D visualisation and a ready PDF proposal right on site.",
    },
    features: {
      ru: ["План дома по периметру стен", "Автоматический расчёт площади, коньков и ендов", "Каталог материалов с ценами", "3D-модель крыши и КП в PDF"],
      kz: ["Қабырға периметрі бойынша үй жоспары", "Аудан, жота және ендовтарды автоматты есептеу", "Бағалары бар материалдар каталогы", "Шатырдың 3D-моделі және PDF ұсыныс"],
      en: ["House plan from wall perimeter", "Automatic area, ridge and valley calculation", "Materials catalogue with prices", "3D roof model and PDF proposal"],
    },
    stack: ["React Native", "Three.js", "PDF engine", "PostgreSQL"],
    accent: "#ff7a3d",
  },
  {
    id: "ai-analytics",
    title: { ru: "AI-аналитика", kz: "AI-аналитика", en: "AI Analytics" },
    client: { ru: "Университет", kz: "Университет", en: "University" },
    category: { ru: "Веб-платформа · Аналитика", kz: "Веб-платформа · Аналитика", en: "Web platform · Analytics" },
    year: "2026",
    platform: "web",
    poster: "/media/svodka.jpg",
    video: "/media/svodka.mp4",
    stills: ["/media/svodka-bars.jpg", "/media/svodka-3d.jpg"],
    summary: {
      ru: "Аналитическая сводка крупного университета в реальном времени: десятки тысяч студентов, факультеты, наука, география и 3D-загруженность аудиторий.",
      kz: "Ірі университеттің нақты уақыттағы аналитикалық жиынтығы: он мыңдаған студент, факультеттер, ғылым, география және аудиториялардың 3D-жүктемесі.",
      en: "Real-time analytics hub for a major university: tens of thousands of students, faculties, research, geography and 3D classroom occupancy.",
    },
    features: {
      ru: ["Интерактивная «галактика» факультетов", "Карта Казахстана: откуда студенты", "Сеть научного сотрудничества", "3D-модели корпусов с загрузкой аудиторий"],
      kz: ["Факультеттердің интерактивті «галактикасы»", "Қазақстан картасы: студенттер қайдан", "Ғылыми ынтымақтастық желісі", "Аудитория жүктемесі бар ғимараттардың 3D-модельдері"],
      en: ["Interactive faculty “galaxy”", "Map of Kazakhstan: where students come from", "Research collaboration network", "3D campus models with room occupancy"],
    },
    stack: ["Next.js", "WebGL", "D3", "Python", "PostgreSQL"],
    accent: "#56e1ff",
  },
  {
    id: "ai-assistant",
    title: { ru: "AI-ассистент", kz: "AI-ассистент", en: "AI Assistant" },
    client: { ru: "Университет", kz: "Университет", en: "University" },
    category: { ru: "AI-ассистент · LLM", kz: "AI-ассистент · LLM", en: "AI assistant · LLM" },
    year: "2026",
    platform: "web",
    poster: "/media/chatbot.jpg",
    video: "/media/chatbot.mp4",
    summary: {
      ru: "Чат-бот на базе LLM, который отвечает на вопросы руководства по живым данным университета — на естественном языке, за секунды.",
      kz: "Университеттің нақты деректері бойынша басшылық сұрақтарына табиғи тілде, бірнеше секундта жауап беретін LLM негізіндегі чат-бот.",
      en: "An LLM-powered assistant that answers management questions over live university data — in natural language, in seconds.",
    },
    features: {
      ru: ["Ответы по данным из внутренних систем", "Русский и казахский языки", "Подсказки частых запросов", "Разграничение доступа к данным"],
      kz: ["Ішкі жүйелер деректері бойынша жауаптар", "Орыс және қазақ тілдері", "Жиі сұраулар бойынша кеңестер", "Деректерге қолжетімділікті шектеу"],
      en: ["Answers grounded in internal systems", "Russian and Kazakh languages", "Suggested frequent questions", "Role-based data access"],
    },
    stack: ["LLM", "RAG", "Python", "Next.js"],
    accent: "#9b6bff",
  },
];
