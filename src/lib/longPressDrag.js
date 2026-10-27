const HOLD_MS = 350;
const MOVE_TOLERANCE = 8;

// 長押ししたままドラッグすると移動できる。長押し前に動いた場合はキャンセルする。
export function startLongPressDrag(event, { onActivate, onDrag, onEnd }) {
  const startX = event.clientX;
  const startY = event.clientY;
  let dragging = false;
  let timer = null;

  const finish = () => {
    window.clearTimeout(timer);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    if (dragging) onEnd?.();
  };

  const handleMove = (moveEvent) => {
    if (!dragging) {
      if (
        Math.abs(moveEvent.clientX - startX) > MOVE_TOLERANCE ||
        Math.abs(moveEvent.clientY - startY) > MOVE_TOLERANCE
      ) {
        finish();
      }
      return;
    }
    onDrag(moveEvent.clientX - startX, moveEvent.clientY - startY);
  };

  timer = window.setTimeout(() => {
    dragging = true;
    onActivate?.();
  }, HOLD_MS);

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
}