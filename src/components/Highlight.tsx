import styles from "../style/Highlight.module.css";
import type { Comment, LTWHP } from "../types.js";

interface Props {
  position: {
    boundingRect: LTWHP;
    rects: Array<LTWHP>;
  };
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  comment: Comment;
  isScrolledTo: boolean;
}

export function Highlight({
  position,
  onClick,
  onMouseOver,
  onMouseOut,
  comment,
  isScrolledTo,
}: Props) {
  const { rects, boundingRect } = position;
  const customColor = !isScrolledTo ? comment?.color : undefined;

  return (
    <div
      className={`Highlight ${styles.highlight} ${isScrolledTo ? styles.scrolledTo : ""}`}
    >
      {comment ? (
        <div
          className={`Highlight__emoji ${styles.emoji}`}
          style={{
            left: 20,
            top: boundingRect.top,
          }}
        >
          {comment.emoji}
        </div>
      ) : null}
      <div className={`Highlight__parts ${styles.parts}`}>
        {rects.map((rect, index) => (
          <button
            type="button"
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onClick}
            onKeyDown={(event) => {
              if (!onClick) {
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }}
            // biome-ignore lint/suspicious/noArrayIndexKey: We can use position hash at some point in future
            key={index}
            style={{ ...rect, backgroundColor: customColor || undefined }}
            className={`Highlight__part ${styles.part}`}
          />
        ))}
      </div>
    </div>
  );
}
