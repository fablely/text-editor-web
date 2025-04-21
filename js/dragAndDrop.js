// js/dragAndDrop.js
import { state } from './state.js';
import { getEventPos } from './utils.js';
import { renderCanvas, positionModalNearText, updateModalControls, findTextAtPosition } from './canvasRenderer.js';

export function initDragAndDrop() {
  const canvas = state.canvas;

  function handleStart(e) {
    const { x, y } = getEventPos(e);
    const hit = findTextAtPosition(x, y);
    if (hit) {
      state.selectedText = hit;
      state.isDragging = true;
      state.dragOffset.x = x - hit.x;
      state.dragOffset.y = y - hit.y;
      updateModalControls(hit);
      const modal = document.getElementById('textControlModal');
      if (modal.classList.contains('hidden')) {
        positionModalNearText(hit);
      }
      modal.classList.remove('hidden');
      renderCanvas();
      e.preventDefault();
    } else {
      state.selectedText = null;
      document.getElementById('textControlModal').classList.add('hidden');
      renderCanvas();
    }
  }

  function handleMove(e) {
    if (!state.isDragging || !state.selectedText) return;
    const { x, y } = getEventPos(e);
    state.selectedText.x = x - state.dragOffset.x;
    state.selectedText.y = y - state.dragOffset.y;
    positionModalNearText(state.selectedText);
    renderCanvas();
    e.preventDefault();
  }

  function handleEnd() {
    state.isDragging = false;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd);
}
