/** A project resolved for the current locale (serialisable, passed from the server wrapper). */
export type WorkItem = {
  id: string;
  title: string;
  client: string;
  category: string;
  year: string;
  platform: "mobile" | "web";
  poster: string;
  video: string;
  stills: string[];
  summary: string;
  features: string[];
  stack: string[];
  accent: string;
  /** decorative address shown in the browser frame of web projects */
  url: string;
};
