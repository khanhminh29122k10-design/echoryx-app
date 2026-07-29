import rabbit from "@/assets/char-rabbit.png";
import cat from "@/assets/char-cat.png";
import bear from "@/assets/char-bear.png";
import panda from "@/assets/char-panda.png";
import tiger from "@/assets/tiger-mascot.png";

export const characters = [
  { id: "tiger", name: "Tiger", nick: "Ti Ni", img: tiger, color: "oklch(0.72 0.19 55)" },
  { id: "rabbit", name: "Rabbit", nick: "Lily", img: rabbit, color: "oklch(0.85 0.05 20)" },
  { id: "cat", name: "Cat", nick: "Mimi", img: cat, color: "oklch(0.7 0.02 260)" },
  { id: "bear", name: "Bear", nick: "Bobby", img: bear, color: "oklch(0.55 0.12 55)" },
  { id: "panda", name: "Panda", nick: "Panda", img: panda, color: "oklch(0.95 0 0)" },
] as const;
export type Character = (typeof characters)[number];

export { tiger };