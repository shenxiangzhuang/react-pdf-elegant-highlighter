# react-pdf-elegant-highlighter

Set of React components for PDF annotation.

Features:

- Built on top of PDF.js
- Text and area highlights
- Popover text for highlights
- Scroll to highlights
- React 19 compatible

## Importing CSS

The bundled CSS include the CSS for pdfjs.

```tsx
import "react-pdf-elegant-highlighter/dist/style.css";
```

## Example

See demo https://shenxiangzhuang.github.io/react-pdf-elegant-highlighter/.

To run the example app locally:

```bash
pnpm install
pnpm start
```

## Install

```bash
pnpm add react-pdf-elegant-highlighter
```

## How to use

See [`./example/src/App.tsx`](https://github.com/shenxiangzhuang/react-pdf-elegant-highlighter/blob/main/example/src/App.tsx) for the React component API example.

## Persistence

Use `PersistentPdfHighlighter` with a store created by `createLocalStorageStore`.

```tsx
import {
  PersistentPdfHighlighter,
  createLocalStorageStore,
  Tip,
} from "react-pdf-elegant-highlighter";

const store = createLocalStorageStore("pdf-highlights:doc-1");

<PersistentPdfHighlighter
  pdfDocument={pdfDocument}
  persistence={store}
  onSelectionFinished={(
    position,
    content,
    hideTip,
    transform,
    setSelectionColor,
    helpers,
  ) => (
    <Tip
      onOpen={transform}
      openOnSelection
      onColorChange={setSelectionColor}
      onConfirm={(comment) => {
        helpers.addHighlight({ content, position, comment });
        hideTip();
      }}
    />
  )}
  highlightTransform={highlightTransform}
  onScrollChange={resetHash}
  scrollRef={scrollRef}
  enableAreaSelection={(event) => event.altKey}
/>;
```
