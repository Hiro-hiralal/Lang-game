import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Story Sprouts",
    short_name: "Sprouts",
    description: "A little reading adventure with Pip.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F1E3",
    theme_color: "#315D48",
    orientation: "any",
    icons: [
      {
        src: "/art/pip-fox.webp",
        sizes: "900x900",
        type: "image/webp",
      },
    ],
  };
}
