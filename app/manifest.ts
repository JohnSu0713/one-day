import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "One Day — Financial freedom, made visible",
    short_name: "One Day",
    description: "Plan financial independence around the life and place you want.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#18382b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

