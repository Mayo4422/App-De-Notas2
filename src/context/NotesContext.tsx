// context/NotesContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Note, NoteColor, NoteImage, NoteTag, SortOption, ViewMode } from "../types";

const STORAGE_KEY = "@notes_app_data";
const SETTINGS_KEY = "@notes_app_settings";

type State = {
  notes: Note[];
  viewMode: ViewMode;
  sortBy: SortOption;
  searchQuery: string;
  activeTagFilter: string | null;
  isLoading: boolean;
};

type Action =
  | { type: "LOAD_NOTES"; payload: Note[] }
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "UPDATE_NOTE"; payload: Note }
  | { type: "DELETE_NOTE"; payload: string }
  | { type: "TOGGLE_PIN"; payload: string }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_SORT"; payload: SortOption }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_TAG_FILTER"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_NOTES":
      return { ...state, notes: action.payload, isLoading: false };
    case "ADD_NOTE":
      return { ...state, notes: [action.payload, ...state.notes] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    case "TOGGLE_PIN":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload ? { ...n, isPinned: !n.isPinned } : n
        ),
      };
    case "TOGGLE_FAVORITE":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload ? { ...n, isFavorite: !n.isFavorite } : n
        ),
      };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_SORT":
      return { ...state, sortBy: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_TAG_FILTER":
      return { ...state, activeTagFilter: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  notes: [],
  viewMode: "grid",
  sortBy: "updatedAt",
  searchQuery: "",
  activeTagFilter: null,
  isLoading: true,
};

type ContextType = State & {
  addNote: (
    title: string,
    content: string,
    color: NoteColor,
    tags: NoteTag[],
    images?: NoteImage[]
  ) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (q: string) => void;
  setTagFilter: (tag: string | null) => void;
  filteredNotes: Note[];
};

const NotesContext = createContext<ContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const [raw, settings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (raw) {
          const parsed: Note[] = JSON.parse(raw);
          // Migrar notas viejas sin campo images
          const migrated = parsed.map((n) => ({ images: [], ...n }));
          dispatch({ type: "LOAD_NOTES", payload: migrated });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
        if (settings) {
          const s = JSON.parse(settings);
          if (s.viewMode) dispatch({ type: "SET_VIEW_MODE", payload: s.viewMode });
          if (s.sortBy) dispatch({ type: "SET_SORT", payload: s.sortBy });
        }
      } catch {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
    }
  }, [state.notes, state.isLoading]);

  useEffect(() => {
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ viewMode: state.viewMode, sortBy: state.sortBy })
    );
  }, [state.viewMode, state.sortBy]);

  const addNote = useCallback(
    async (
      title: string,
      content: string,
      color: NoteColor,
      tags: NoteTag[],
      images: NoteImage[] = []
    ): Promise<Note> => {
      const now = new Date().toISOString();
      const note: Note = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        content,
        color,
        tags,
        images,
        isPinned: false,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: "ADD_NOTE", payload: note });
      return note;
    },
    []
  );

  const updateNote = useCallback(async (note: Note) => {
    dispatch({
      type: "UPDATE_NOTE",
      payload: { ...note, updatedAt: new Date().toISOString() },
    });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_NOTE", payload: id });
  }, []);

  const togglePin = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_PIN", payload: id });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_FAVORITE", payload: id });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    dispatch({ type: "SET_SORT", payload: sort });
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    dispatch({ type: "SET_SEARCH", payload: q });
  }, []);

  const setTagFilter = useCallback((tag: string | null) => {
    dispatch({ type: "SET_TAG_FILTER", payload: tag });
  }, []);

  const filteredNotes = React.useMemo(() => {
    let result = [...state.notes];
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.label.toLowerCase().includes(q))
      );
    }
    if (state.activeTagFilter) {
      result = result.filter((n) =>
        n.tags.some((t) => t.id === state.activeTagFilter)
      );
    }
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      switch (state.sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "createdAt": return b.createdAt.localeCompare(a.createdAt);
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return result;
  }, [state.notes, state.searchQuery, state.activeTagFilter, state.sortBy]);

  return (
    <NotesContext.Provider
      value={{
        ...state,
        addNote,
        updateNote,
        deleteNote,
        togglePin,
        toggleFavorite,
        setViewMode,
        setSortBy,
        setSearchQuery,
        setTagFilter,
        filteredNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}