import { Component } from "react";
import styles from "../style/Tip.module.css";

interface State {
  compact: boolean;
  text: string;
  emoji: string;
  color: string;
}

interface Props {
  onConfirm: (comment: { text: string; emoji: string; color?: string }) => void;
  onOpen: () => void;
  onUpdate?: () => void;
  onColorChange?: (color: string) => void;
  openOnSelection?: boolean;
}

export class Tip extends Component<Props, State> {
  state: State = {
    compact: true,
    text: "",
    emoji: "",
    color: "#f6d365",
  };

  componentDidMount() {
    if (this.props.openOnSelection) {
      this.openEditor();
    }
  }

  // for TipContainer
  componentDidUpdate(prevProps: Props, nextState: State) {
    const { onUpdate, openOnSelection } = this.props;

    if (onUpdate && this.state.compact !== nextState.compact) {
      onUpdate();
    }

    if (!prevProps.openOnSelection && openOnSelection) {
      this.openEditor();
    }
  }

  openEditor() {
    const { onOpen, onColorChange } = this.props;
    const { color, compact } = this.state;

    if (!compact) {
      return;
    }

    onOpen();
    if (onColorChange) {
      onColorChange(color);
    }
    this.setState({ compact: false });
  }

  render() {
    const { onConfirm, onOpen, onColorChange } = this.props;
    const { compact, text, emoji, color } = this.state;
    const colors = [
      "#f27b72",
      "#f6c177",
      "#f6d365",
      "#a6f3a6",
      "#6b7cff",
      "#8f73d6",
      "#b06cf7",
      "#22c1c3",
    ];

    return (
      <div>
        {compact ? (
          <button
            type="button"
            className={styles.compact}
            onClick={() => {
              onOpen();
              if (onColorChange) {
                onColorChange(color);
              }
              this.setState({ compact: false });
            }}
          >
            Highlight
          </button>
        ) : (
          <form
            className={styles.card}
            onSubmit={(event) => {
              event.preventDefault();
              onConfirm({ text, emoji, color });
            }}
          >
            <div className={styles.content}>
              <textarea
                placeholder="Add text here..."
                // biome-ignore lint/a11y/noAutofocus: This is an example app
                autoFocus
                value={text}
                onChange={(event) =>
                  this.setState({ text: event.target.value })
                }
                ref={(node) => {
                  if (node) {
                    node.focus();
                  }
                }}
              />
            </div>
            <div className={styles.actions}>
              <div className={styles.palette}>
                {colors.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className={styles.swatch}
                    aria-label={`Select color ${swatch}`}
                    onClick={() => {
                      this.setState({ color: swatch });
                      if (onColorChange) {
                        onColorChange(swatch);
                      }
                    }}
                    data-selected={swatch === color}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <button className={styles.confirm} type="submit">
                Highlight
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }
}
