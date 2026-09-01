import mouse from "@/assets/char-mouse.png";
import buffalo from "@/assets/char-buffalo.png";
import tiger from "@/assets/tiger-mascot.png";
import cat from "@/assets/char-cat.png";
import dragon from "@/assets/char-dragon.png";
import snake from "@/assets/char-snake.png";
import horse from "@/assets/char-horse.png";
import goat from "@/assets/char-goat.png";
import monkey from "@/assets/char-monkey.png";
import rooster from "@/assets/char-rooster.png";
import dog from "@/assets/char-dog.png";
import pig from "@/assets/char-pig.png";

export const characters = [
  { id: "mouse", name: "Mouse", nick: "Mouse", img: mouse, color: "#b8aba2" },
  { id: "buffalo", name: "Buffalo", nick: "Buffalo", img: buffalo, color: "#5e402f" },
  { id: "tiger", name: "Tiger", nick: "Ti Ni", img: tiger, color: "#fb7c00" },
  { id: "cat", name: "Cat", nick: "Mimi", img: cat, color: "#979fab" },
  { id: "dragon", name: "Dragon", nick: "Dragon", img: dragon, color: "#33b544" },
  { id: "snake", name: "Snake", nick: "Snake", img: snake, color: "#87c334" },
  { id: "horse", name: "Horse", nick: "Horse", img: horse, color: "#ae5528" },
  { id: "goat", name: "Goat", nick: "Goat", img: goat, color: "#e9dcc8" },
  { id: "monkey", name: "Monkey", nick: "Monkey", img: monkey, color: "#b06d47" },
  { id: "rooster", name: "Rooster", nick: "Rooster", img: rooster, color: "#e1a200" },
  { id: "dog", name: "Dog", nick: "Dog", img: dog, color: "#db9152" },
  { id: "pig", name: "Pig", nick: "Pig", img: pig, color: "#f9acb1" },
] as const;
export type Character = (typeof characters)[number];

export { tiger };