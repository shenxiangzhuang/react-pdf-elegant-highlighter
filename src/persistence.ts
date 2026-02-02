import type { IHighlight } from "./types";

export interface HighlightSerializer<T_HT extends IHighlight> {
  version: number;
  serialize: (highlights: Array<T_HT>) => string;
  deserialize: (raw: string) => Array<T_HT>;
}

export interface HighlightStore<T_HT extends IHighlight> {
  load: () => Promise<Array<T_HT>> | Array<T_HT>;
  save: (highlights: Array<T_HT>) => Promise<void> | void;
  clear?: () => Promise<void> | void;
  hasData?: () => Promise<boolean> | boolean;
  debounceMs?: number;
}

interface SerializedPayload<T_HT extends IHighlight> {
  version: number;
  highlights: Array<T_HT>;
}

export function createJsonHighlightSerializer<T_HT extends IHighlight>(
  version = 1,
): HighlightSerializer<T_HT> {
  return {
    version,
    serialize: (highlights) =>
      JSON.stringify({
        version,
        highlights,
      } satisfies SerializedPayload<T_HT>),
    deserialize: (raw) => {
      const parsed = JSON.parse(raw) as SerializedPayload<T_HT> | Array<T_HT>;
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.highlights)) {
        return parsed.highlights;
      }
      return [];
    },
  };
}

export function createStorageStore<T_HT extends IHighlight>(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  key: string,
  serializer: HighlightSerializer<T_HT> = createJsonHighlightSerializer<T_HT>(),
): HighlightStore<T_HT> {
  return {
    load: () => {
      const raw = storage.getItem(key);
      if (!raw) {
        return [];
      }
      try {
        return serializer.deserialize(raw);
      } catch {
        return [];
      }
    },
    save: (highlights) => {
      const serialized = serializer.serialize(highlights);
      storage.setItem(key, serialized);
    },
    clear: () => {
      storage.removeItem(key);
    },
    hasData: () => {
      return storage.getItem(key) != null;
    },
  };
}

export function createLocalStorageStore<T_HT extends IHighlight>(
  key: string,
  serializer?: HighlightSerializer<T_HT>,
): HighlightStore<T_HT> {
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      load: () => [],
      save: () => {},
      clear: () => {},
    };
  }

  return createStorageStore(window.localStorage, key, serializer);
}
