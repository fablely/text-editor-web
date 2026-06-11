// js/history.js
// 스냅샷 기반 실행취소/다시실행 + 선택 요소 삭제(Delete 키)
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';

const undoStack = [];
const redoStack = [];
const LIMIT = 60;

// 현재 상태를 얕은 복제로 스냅샷 (스티커 image 참조는 유지)
function snapshot() {
  return {
    textObjects: state.textObjects.map(t => ({ ...t })),
    stickers: state.stickers.map(s => ({ ...s }))
  };
}

function clone(snap) {
  return {
    textObjects: snap.textObjects.map(t => ({ ...t })),
    stickers: snap.stickers.map(s => ({ ...s }))
  };
}

function closeModals() {
  document.getElementById('textControlModal')?.classList.add('hidden');
  document.getElementById('stickerEditPopup')?.classList.add('hidden');
}

function applyState(snap) {
  const c = clone(snap);
  state.textObjects = c.textObjects;
  state.stickers = c.stickers;
  state.selectedText = null;
  state.selectedElement = null;
  state.selectedElementType = null;
  closeModals();
  renderCanvas();
}

function updateButtons() {
  const u = document.getElementById('undoBtn');
  const r = document.getElementById('redoBtn');
  if (u) u.disabled = undoStack.length <= 1;
  if (r) r.disabled = redoStack.length === 0;
}

// 변경 후 호출: 현재 상태를 히스토리에 적재
export function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > LIMIT) undoStack.shift();
  redoStack.length = 0;
  updateButtons();
}

// 새 이미지 업로드 등으로 히스토리를 비우고 현재 상태로 시드
export function resetHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
  undoStack.push(snapshot());
  updateButtons();
}

export function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  applyState(undoStack[undoStack.length - 1]);
  updateButtons();
}

export function redo() {
  if (redoStack.length === 0) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  applyState(snap);
  updateButtons();
}

// 선택된 텍스트/스티커 삭제
export function deleteSelected() {
  if (!state.selectedElement) return;
  if (state.selectedElementType === 'text') {
    state.textObjects = state.textObjects.filter(t => t !== state.selectedElement);
  } else if (state.selectedElementType === 'sticker') {
    state.stickers = state.stickers.filter(s => s !== state.selectedElement);
  }
  state.selectedText = null;
  state.selectedElement = null;
  state.selectedElementType = null;
  closeModals();
  renderCanvas();
  pushHistory();
}

export function initHistory() {
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);

  document.addEventListener('keydown', (e) => {
    const tag = ((e.target && e.target.tagName) || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
    if (typing) return; // 입력 중에는 에디터 단축키 비활성(네이티브 동작 유지)

    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if (mod && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedElement) {
        e.preventDefault();
        deleteSelected();
      }
    }
  });

  resetHistory(); // 초기 빈 상태 시드
}
