import { movedBlockPosition } from "@/lib/notebookCanvas";

// 長押しドラッグ中は React を経由せず、画面上の位置だけを直接動かして指に追従させる
export function createCanvasDrag(element, block, surfaceWidth) {
  if (!element) return null;

  const rotate = block.angle ? `rotate(${block.angle}deg)` : "";
  let offset = { dx: 0, dy: 0 };
  let position = { x: block.x, y: block.y };
  let frame = 0;
  let moved = false;

  const paint = () => {
    frame = 0;
    position = movedBlockPosition(block, offset.dx, offset.dy, surfaceWidth);
    element.style.transform =
      `translate3d(${position.x - block.x}px, ${position.y - block.y}px, 0)` +
      (rotate ? ` ${rotate}` : "");
  };

  return {
    update(dx, dy) {
      offset = { dx, dy };
      moved = true;
      if (!frame) frame = requestAnimationFrame(paint);
    },
    // 指を離した位置をそのまま保存する（表示は動かさないので飛ばない）
    commit() {
      if (!moved) return null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      paint();
      element.style.transform = rotate;
      return position;
    }
  };
}