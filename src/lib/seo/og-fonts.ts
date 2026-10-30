import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fontDirectory = join(process.cwd(), "assets/fonts");

export async function loadOgFonts() {
  const [fraunces, monoRegular, monoSemibold, sans] = await Promise.all([
    readFile(join(fontDirectory, "fraunces-semibold.ttf")),
    readFile(join(fontDirectory, "jetbrains-mono-regular.ttf")),
    readFile(join(fontDirectory, "jetbrains-mono-semibold.ttf")),
    readFile(join(fontDirectory, "schibsted-grotesk-medium.ttf")),
  ]);
  return [
    { name: "Fraunces", data: fraunces, weight: 600 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: monoRegular, weight: 400 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: monoSemibold, weight: 600 as const, style: "normal" as const },
    { name: "Schibsted Grotesk", data: sans, weight: 500 as const, style: "normal" as const },
  ];
}

export const ogColours = {
  papir: "#F3EEE3",
  papir2: "#E9E2D2",
  papir3: "#DDD4C0",
  linija: "#CFC6B2",
  tinta: "#1F2421",
  tinta2: "#5A5F57",
  crijep: "#B5482B",
  vranica: "#2F4A3A",
  vrbas: "#3E6E7A",
} as const;

export const ogSize = { width: 1200, height: 630 };
