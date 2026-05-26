// types/index.ts

export type NoteColor =
  | "#1A1A2E"
  | "#16213E"
  | "#0F3460"
  | "#1B262C"
  | "#2D132C"
  | "#1C3144"
  | "#2C2C54"
  | "#1A1A1A";

export type NoteTag = {
  id: string;
  label: string;
  color: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: NoteTag[];
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ViewMode = "grid" | "list";

export type SortOption = "updatedAt" | "createdAt" | "title" | "pinned";

export const NOTE_COLORS: NoteColor[] = [
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#1B262C",
  "#2D132C",
  "#1C3144",
  "#2C2C54",
  "#1A1A1A",
];

export const ACCENT_COLORS: Record<NoteColor, string> = {
  "#1A1A2E": "#7C83FD",
  "#16213E": "#00B4D8",
  "#0F3460": "#E94560",
  "#1B262C": "#06D6A0",
  "#2D132C": "#EE4540",
  "#1C3144": "#F7B731",
  "#2C2C54": "#A29BFE",
  "#1A1A1A": "#FFFFFF",
};

export const PREDEFINED_TAGS: NoteTag[] = [
  { id: "work", label: "Trabajo", color: "#7C83FD" },
  { id: "personal", label: "Personal", color: "#06D6A0" },
  { id: "ideas", label: "Ideas", color: "#F7B731" },
  { id: "important", label: "Importante", color: "#EE4540" },
  { id: "study", label: "Estudio", color: "#00B4D8" },
  { id: "shopping", label: "Compras", color: "#A29BFE" },
];