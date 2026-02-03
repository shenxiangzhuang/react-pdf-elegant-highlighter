import React, { useMemo, useState } from "react";
import { MouseMonitor } from "./MouseMonitor";

interface Props {
  onMouseOver: (content: React.ReactElement) => void;
  popupContent: React.ReactElement;
  onMouseOut: () => void;
  children: React.ReactElement;
}

type PopupContentProps = {
  onRequestLock?: () => void;
  onRequestUnlock?: () => void;
  isLocked?: boolean;
};

export function Popup({
  onMouseOver,
  popupContent,
  onMouseOut,
  children,
}: Props) {
  const [mouseIn, setMouseIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const popupWithControls = useMemo(() => {
    if (!React.isValidElement<PopupContentProps>(popupContent)) {
      return popupContent;
    }
    return React.cloneElement<PopupContentProps>(popupContent, {
      onRequestLock: () => setIsLocked(true),
      onRequestUnlock: () => setIsLocked(false),
      isLocked,
    });
  }, [popupContent, isLocked]);

  const contentWithLock = useMemo(() => {
    if (!popupWithControls) {
      return popupWithControls;
    }
    return (
      <MouseMonitor
        onMoveAway={() => {
          if (mouseIn || isLocked) {
            return;
          }
          onMouseOut();
        }}
        paddingX={60}
        paddingY={30}
      >
        {popupWithControls}
      </MouseMonitor>
    );
  }, [popupWithControls, mouseIn, isLocked, onMouseOut]);

  const handleShow = () => {
    if (isLocked) {
      onMouseOver(contentWithLock);
      return;
    }
    setMouseIn(true);
    onMouseOver(contentWithLock);
  };

  const handleHide = () => {
    if (isLocked) {
      return;
    }
    setMouseIn(false);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Wrapper manages hover/focus behavior for popup content.
    <div
      onMouseOver={handleShow}
      onMouseOut={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
