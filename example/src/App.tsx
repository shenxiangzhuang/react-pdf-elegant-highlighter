import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import {
  AreaHighlight,
  Highlight,
  PersistentPdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
  createLocalStorageStore,
} from "./react-pdf-elegant-highlighter";
import type {
  Content,
  HighlightHelpers,
  IHighlight,
  ScaledPosition,
} from "./react-pdf-elegant-highlighter";

import { Sidebar } from "./Sidebar";
import { Spinner } from "./Spinner";
import { testHighlights as _testHighlights } from "./test-highlights";

import "./style/App.css";
import "../../dist/style.css";

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

function HighlightPopup({
  comment,
  onEdit,
  onDelete,
}: {
  comment: { text: string; emoji: string };
  onEdit: (nextText: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);

  useEffect(() => {
    setDraft(comment.text);
  }, [comment.text]);

  return (
    <div className="Highlight__popup">
      <div className="Highlight__popupHeader">
        <span className="Highlight__popupTitle">Note</span>
        <div className="Highlight__popupActions">
          <button
            type="button"
            className="Highlight__popupButton"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <button
            type="button"
            className="Highlight__popupButton Highlight__popupButton--danger"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="Highlight__popupEditor">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Edit note..."
          />
          <div className="Highlight__popupEditorActions">
            <button
              type="button"
              className="Highlight__popupButton Highlight__popupButton--primary"
              onClick={() => {
                onEdit(draft);
                setIsEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="Highlight__popupBody">
          <span className="Highlight__popupEmoji">{comment.emoji}</span>
          <span>{comment.text || "No note yet."}</span>
        </div>
      )}
    </div>
  );
}

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480";

export function App() {
  const searchParams = new URLSearchParams(document.location.search);
  const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

  const [url, setUrl] = useState(initialUrl);
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const helpersRef = useRef<HighlightHelpers<IHighlight> | null>(null);

  const highlightStore = useMemo(
    () => createLocalStorageStore<IHighlight>(`pdf-highlights:${url}`),
    [url],
  );

  const initialHighlights = useMemo(
    () => (testHighlights[url] ? [...testHighlights[url]] : []),
    [url],
  );

  const resetHighlights = () => {
    highlightStore.clear?.();
    helpersRef.current?.setHighlights([]);
  };

  const toggleDocument = () => {
    const newUrl =
      url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;
    setUrl(newUrl);
    setHighlights([]);
  };

  const scrollViewerTo = useRef((highlight: IHighlight) => {});

  const getHighlightById = useCallback(
    (id: string) => {
      return highlights.find((highlight) => highlight.id === id);
    },
    [highlights],
  );

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, [getHighlightById]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false,
      );
    };
  }, [scrollToHighlightFromHash]);

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>,
  ) => {
    helpersRef.current?.updateHighlight(highlightId, position, content);
  };

  const updateHighlightComment = (highlightId: string, text: string) => {
    helpersRef.current?.updateHighlightComment(highlightId, { text });
  };

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative",
        }}
      >
        <PdfLoader url={url} beforeLoad={<Spinner />}>
          {(pdfDocument) => (
            <PersistentPdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={resetHash}
              apiRef={helpersRef}
              persistence={highlightStore}
              initialHighlights={initialHighlights}
              onHighlightsChange={setHighlights}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
                scrollToHighlightFromHash();
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection,
                setSelectionColor,
                helpers,
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onColorChange={setSelectionColor}
                  onConfirm={(comment) => {
                    helpers.addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo,
              ) => {
                const isTextHighlight = !highlight.content?.image;

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) },
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={
                      <HighlightPopup
                        comment={highlight.comment}
                        onEdit={(nextText) => {
                          updateHighlightComment(highlight.id, nextText);
                          hideTip();
                        }}
                        onDelete={() => {
                          helpersRef.current?.removeHighlight(highlight.id);
                          hideTip();
                        }}
                      />
                    }
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}
