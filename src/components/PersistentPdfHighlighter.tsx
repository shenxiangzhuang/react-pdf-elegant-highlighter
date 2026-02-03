import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HighlightStore } from "../persistence";
import type {
  Comment,
  Content,
  IHighlight,
  NewHighlight,
  ScaledPosition,
} from "../types";
import { PdfHighlighter, type PdfHighlighterProps } from "./PdfHighlighter";

export interface HighlightHelpers<T_HT extends IHighlight> {
  addHighlight: (highlight: NewHighlight) => T_HT;
  updateHighlight: (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>,
  ) => void;
  updateHighlightComment: (
    highlightId: string,
    comment: Partial<Comment>,
  ) => void;
  removeHighlight: (highlightId: string) => void;
  setHighlights: React.Dispatch<React.SetStateAction<Array<T_HT>>>;
}

export interface PersistentPdfHighlighterProps<T_HT extends IHighlight>
  extends Omit<
    PdfHighlighterProps<T_HT>,
    "highlights" | "onSelectionFinished"
  > {
  persistence: HighlightStore<T_HT>;
  initialHighlights?: Array<T_HT>;
  onSelectionFinished: (
    position: ScaledPosition,
    content: Content,
    hideTipAndSelection: () => void,
    transformSelection: () => void,
    setSelectionColor: (color: string) => void,
    helpers: HighlightHelpers<T_HT>,
  ) => React.ReactElement | null;
  generateId?: () => string;
  createHighlight?: (highlight: NewHighlight, id: string) => T_HT;
  onHighlightsChange?: (highlights: Array<T_HT>) => void;
  onPersistenceError?: (error: Error) => void;
  apiRef?: React.MutableRefObject<HighlightHelpers<T_HT> | null>;
}

const defaultGenerateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function PersistentPdfHighlighter<T_HT extends IHighlight>({
  persistence,
  initialHighlights,
  onSelectionFinished,
  generateId = defaultGenerateId,
  createHighlight = (highlight, id) => ({ ...highlight, id }) as T_HT,
  onHighlightsChange,
  onPersistenceError,
  apiRef,
  ...pdfProps
}: PersistentPdfHighlighterProps<T_HT>) {
  const [highlights, setHighlights] = useState<Array<T_HT>>(
    () => initialHighlights ?? [],
  );
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    hydratedRef.current = false;
    setHighlights(initialHighlights ?? []);
    const hydrate = async () => {
      try {
        if (persistence.hasData) {
          const hasData = await persistence.hasData();
          if (!hasData) {
            if (!isCancelled) {
              setHighlights(initialHighlights ?? []);
            }
            return;
          }
        }
        const loaded = await persistence.load();
        if (!isCancelled && Array.isArray(loaded)) {
          setHighlights(loaded);
        }
      } catch (error) {
        if (!isCancelled && onPersistenceError) {
          onPersistenceError(error as Error);
        }
      } finally {
        if (!isCancelled) {
          hydratedRef.current = true;
        }
      }
    };

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, [initialHighlights, persistence, onPersistenceError]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    const debounceMs = persistence.debounceMs ?? 150;
    saveTimeoutRef.current = window.setTimeout(() => {
      Promise.resolve(persistence.save(highlights)).catch((error) => {
        if (onPersistenceError) {
          onPersistenceError(error as Error);
        }
      });
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [highlights, persistence, onPersistenceError]);

  useEffect(() => {
    if (onHighlightsChange) {
      onHighlightsChange(highlights);
    }
  }, [highlights, onHighlightsChange]);

  const addHighlight = useCallback(
    (highlight: NewHighlight) => {
      const id = generateId();
      const fullHighlight = createHighlight(highlight, id);
      setHighlights((prev) => [fullHighlight, ...prev]);
      return fullHighlight;
    },
    [createHighlight, generateId],
  );

  const updateHighlight = useCallback(
    (
      highlightId: string,
      position: Partial<ScaledPosition>,
      content: Partial<Content>,
    ) => {
      setHighlights((prev) =>
        prev.map((highlight) =>
          highlight.id === highlightId
            ? {
                ...highlight,
                position: { ...highlight.position, ...position },
                content: { ...highlight.content, ...content },
              }
            : highlight,
        ),
      );
    },
    [],
  );

  const removeHighlight = useCallback((highlightId: string) => {
    setHighlights((prev) =>
      prev.filter((highlight) => highlight.id !== highlightId),
    );
  }, []);

  const updateHighlightComment = useCallback(
    (highlightId: string, comment: Partial<Comment>) => {
      setHighlights((prev) =>
        prev.map((highlight) =>
          highlight.id === highlightId
            ? {
                ...highlight,
                comment: { ...highlight.comment, ...comment },
              }
            : highlight,
        ),
      );
    },
    [],
  );

  const helpers: HighlightHelpers<T_HT> = useMemo(
    () => ({
      addHighlight,
      updateHighlight,
      updateHighlightComment,
      removeHighlight,
      setHighlights,
    }),
    [addHighlight, updateHighlight, updateHighlightComment, removeHighlight],
  );

  useEffect(() => {
    if (apiRef) {
      apiRef.current = helpers;
    }
    return () => {
      if (apiRef) {
        apiRef.current = null;
      }
    };
  }, [apiRef, helpers]);

  return (
    <PdfHighlighter
      {...pdfProps}
      highlights={highlights}
      onSelectionFinished={(
        position,
        content,
        hideTipAndSelection,
        transformSelection,
        setSelectionColor,
      ) =>
        onSelectionFinished(
          position,
          content,
          hideTipAndSelection,
          transformSelection,
          setSelectionColor,
          helpers,
        )
      }
    />
  );
}
