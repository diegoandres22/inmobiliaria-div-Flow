"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "df_compare_ids";
export const MAX_COMPARE = 4;

interface CompareContextValue {
  ids: string[];
  isComparing: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

// Comparador — a diferencia de favoritos, no tiene sentido persistirlo en
// Supabase (es una selección efímera de "estoy mirando estas ahora"), así
// que vive 100% en el navegador. localStorage porque tiene que sobrevivir
// a navegar entre /propiedades y /comparar, sessionStorage se pierde en
// nueva pestaña y eso rompe el flujo de "abrí la ficha en otra pestaña".
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      // localStorage puede fallar en modo privado — degradamos a "sin persistencia".
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // idem
    }
  }, [ids, hydrated]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider
      value={{
        ids,
        isComparing: (id) => ids.includes(id),
        toggle,
        remove,
        clear,
        isFull: ids.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare debe usarse dentro de CompareProvider");
  return ctx;
}
