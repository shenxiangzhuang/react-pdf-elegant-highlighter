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

  return (
    <div
      onMouseOver={() => {
        if (isLocked) {
          onMouseOver(contentWithLock);
          return;
        }
        setMouseIn(true);
        onMouseOver(contentWithLock);
      }}
      onMouseOut={() => {
        if (isLocked) {
          return;
        }
        setMouseIn(false);
      }}
    >
      {children}
    </div>
  );
}
