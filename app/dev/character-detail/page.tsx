import type { Metadata } from "next";
import CharacterDetailPrototype from "./CharacterDetailPrototype";

export const metadata: Metadata = {
  title: "Character Detail Prototype | YunChinese",
  description: "Source-grounded learner-facing Character Detail visual and interaction prototype.",
};

export default function CharacterDetailPrototypePage() {
  return <CharacterDetailPrototype />;
}
