const HOLD_MS = 300;
const MOVE_TOLERANCE = 16;

// 長押し（または即時）でドラッグを開始する。開始前に大きく動いた場合だけキャンセルする。
export function startLongPressDrag(
  event,
  { immediate = false, onActivate, onDrag, onEnd }
) {
  const pointerId = event.pointerId;
  const startX = event.clientX;
  const startY = event.clientY;
  let dragging = false;
  let finished = false;
  let timer = null;

  // 別の指（マルチタッチ）の動きには反応しない
  const isOtherPointer = (ev) =>
    ev && pointerId != null && ev.pointerId != null && ev.pointerId !== pointerId;

  const cleanup = () => {
    window.clearTimeout(timer);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleEnd);
    window.removeEventListener("pointercancel", handleEnd);
    window.removeEventListener("blur", handleEnd);
  };

  function handleEnd(ev) {
    if (isOtherPointer(ev) || finished) return;
    finished = true;
    cleanup();
    if (dragging) onEnd?.();
  }

  function handleMove(ev) {
    if (isOtherPointer(ev) || finished) return;
    if (!dragging) {
      const moved =
        Math.abs(ev.clientX - startX) > MOVE_TOLERANCE ||
        Math.abs(ev.clientY - startY) > MOVE_TOLERANCE;
      if (moved) {
        finished = true;
        cleanup();
      }
      return;
    }
    onDrag(ev.clientX - startX, ev.clientY - startY);
  }

  const activate = () => {
    if (finished) return;
    dragging = true;
    onActivate?.();
  };

  if (immediate) {
    activate();
  } else {
    timer = window.setTimeout(activate, HOLD_MS);
  }

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleEnd);
  window.addEventListener("pointercancel", handleEnd);
  window.addEventListener("blur", handleEnd);
}