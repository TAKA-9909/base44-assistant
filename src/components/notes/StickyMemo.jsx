import React, { useRef, useState } from "react";
import { GripHorizontal, X } from "lucide-react";
import { startLongPressDrag } from "@/lib/longPressDrag";
import { cn } from "@/lib/utils";

// まとめの隙間に貼る付箋メモ。
// マウスは押したまま、指は長押ししたままドラッグで移動できる。
export default function StickyMemo({ memo, angle = 0, onSave, onMove, onDelete }) {
  const [text, setText] = useState(memo.text || "");
  const [editing, setEditing] = useState(!memo.text);
  const noteRef = useRef(null);
  const movedRef = useRef(false);
  // ドラッグ直後のクリックで編集モードに入らないようにする
  const ignoreClickUntilRef = useRef(0);

  const commit = () => {
    if (!text.trim()) {
      onDelete();
      return;
    }
    setEditing(false);
    if (text !== memo.text) onSave(text);
  };

  const handlePress = (event) => {
    const element = noteRef.current;
    if (!element || event.button > 0) return;
    // 書き込み中の文章では文字の選択を優先し、移動は上部のつまみから行う
    const isTextarea = event.target instanceof HTMLElement && event.target.tagName === "TEXTAREA";
    if (isTextarea && editing) return;
    // 長押しでブラウザの文字選択やメニューが出ないようにする
    event.preventDefault();

    const base = { x: memo.x || 0, y: memo.y || 0 };
    let position = base;
    movedRef.current = false;

    startLongPressDrag(event, {
      // マウスのときは待たずにそのまま動かせるようにする
      immediate: event.pointerType === "mouse",
      onActivate: () => {
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        element.style.zIndex = "30";
        element.style.cursor = "grabbing";
      },
      onDrag: (dx, dy) => {
        movedRef.current = true;
        position = { x: Math.round(base.x + dx), y: Math.round(base.y + dy) };
        element.style.transform =
          `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`;
      },
      onEnd: () => {
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";
        window.getSelection()?.removeAllRanges();
        element.style.zIndex = "";
        element.style.cursor = "";
        element.style.transform =
          `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`;
        if (movedRef.current) {
          ignoreClickUntilRef.current = Date.now() + 400;
          if (position.x !== base.x || position.y !== base.y) onMove(position);
        }
      }
    });
  };

  const startEditing = () => {
    if (Date.now() < ignoreClickUntilRef.current) return;
    setEditing(true);
  };

  return (
    <div
      ref={noteRef}
      onPointerDown={handlePress}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        transform: `translate(${memo.x || 0}px, ${memo.y || 0}px) rotate(${angle}deg)`
      }}
      className={cn(
        "relative w-44 shrink-0 cursor-grab touch-none rounded-sm bg-memo p-3 text-left shadow-md shadow-black/15",
        !editing && "select-none"
      )}
    >
      <button
        type="button"
        aria-label="このメモをはがす"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted-foreground shadow ring-1 ring-border"
      >
        <X className="h-3 w-3" />
      </button>

      <div
        aria-hidden
        className="mb-1 -mt-1 flex h-4 items-center justify-center text-sticky-foreground/30"
      >
        <GripHorizontal className="h-3.5 w-3.5" />
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          rows={3}
          placeholder="メモを書きこむ"
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
          className="w-full resize-none bg-transparent font-hand text-[13px] leading-6 text-sticky-foreground outline-none placeholder:text-sticky-foreground/40"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-full whitespace-pre-wrap text-left font-hand text-[13px] leading-6 text-sticky-foreground"
        >
          {text}
        </button>
      )}
    </div>
  );
}