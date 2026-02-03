import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "../style/TipContainer.module.css";
import type { LTWHP } from "../types";

type TipChildProps = {
  onUpdate?: () => void;
  popup?: { position: "below" | "above" };
};

interface Props {
  children: React.ReactElement | null;
  style: { top: number; left: number; bottom: number };
  pageBoundingRect: LTWHP;
  pageOffsetTop: number;
}

function clamp(value: number, left: number, right: number) {
  return Math.min(Math.max(value, left), right);
}

export function TipContainer({
  children,
  style,
  pageBoundingRect,
  pageOffsetTop,
}: Props) {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    if (!nodeRef.current) {
      return;
    }
    const { offsetHeight, offsetWidth } = nodeRef.current;
    setHeight(offsetHeight);
    setWidth(offsetWidth);
  }, []);

  useLayoutEffect(() => {
    if (rafIdRef.current) {
      window.cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      updatePosition();
    });
    return () => {
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [children, updatePosition]);

  const isStyleCalculationInProgress = width === 0 && height === 0;

  const selectionTopInPage = style.top - pageOffsetTop;
  const selectionBottomInPage = style.bottom - pageOffsetTop;
  const availableBelow = pageBoundingRect.height - selectionBottomInPage;
  const availableAbove = selectionTopInPage;
  const gap = 6;
  const shouldPlaceBelow =
    availableBelow >= height + gap || availableBelow >= availableAbove;

  const top = shouldPlaceBelow ? style.bottom + gap : style.top - height - gap;

  const left = clamp(style.left - width / 2, 0, pageBoundingRect.width - width);

  const handleUpdate = useCallback(() => {
    setWidth(0);
    setHeight(0);
    if (rafIdRef.current) {
      window.cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      updatePosition();
    });
  }, [updatePosition]);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (!React.isValidElement<TipChildProps>(child)) {
      return child;
    }
    return React.cloneElement<TipChildProps>(child, {
      onUpdate: handleUpdate,
      popup: {
        position: shouldPlaceBelow ? "below" : "above",
      },
    });
  });

  return (
    <div
      id="PdfHighlighter__tip-container"
      className={styles.tipContainer}
      style={{
        visibility: isStyleCalculationInProgress ? "hidden" : "visible",
        top,
        left,
      }}
      ref={nodeRef}
    >
      {childrenWithProps}
    </div>
  );
}
