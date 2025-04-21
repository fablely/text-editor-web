// js/modalControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText } from './canvasRenderer.js';

export function initModalControls() {
  document.getElementById('modalFontFamily').addEventListener('change', e => {
    if (!state.selectedText) return;
    state.selectedText.font = e.target.value;
    renderCanvas();
    console.log('Font changed to:', e.target.value); // 디버깅 로그 추가
  });

  document.getElementById('modalFontSize').addEventListener('input', e => {
    if (!state.selectedText) return;
    state.selectedText.size = parseInt(e.target.value, 10);
    renderCanvas();
    console.log('Size changed to:', e.target.value); // 디버깅 로그 추가
  });

  document.getElementById('modalFontColor').addEventListener('input', e => {
    if (!state.selectedText) return;
    state.selectedText.color = e.target.value;
    renderCanvas();
  });

  document.getElementById('modalOpacity').addEventListener('input', e => {
    if (!state.selectedText) return;
    state.selectedText.opacity = parseFloat(e.target.value);
    renderCanvas();
  });

  document.getElementById('modalLetterSpacing').addEventListener('input', e => {
    if (!state.selectedText) return;
    state.selectedText.letterSpacing = parseFloat(e.target.value);
    renderCanvas();
  });

  document.getElementById('modalRotation').addEventListener('input', e => {
    if (!state.selectedText) return;
    state.selectedText.rotation = parseFloat(e.target.value);
    renderCanvas();
  });

  document.getElementById('modalCenterBtn').addEventListener('click', () => {
    document.getElementById('centerTextBtn').click();
    if (state.selectedText) positionModalNearText(state.selectedText);
  });

  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteTextBtn').click();
    document.getElementById('textControlModal').classList.add('hidden');
  });

  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    document.getElementById('textControlModal').classList.add('hidden');
    state.selectedText = null; // 선택 해제 추가
    renderCanvas();
  });

  // 모달 외부 클릭 시 모달 닫기 처리 개선
  document.addEventListener('mousedown', e => {
    const modal = document.getElementById('textControlModal');
    const canvas = state.canvas;
    
    // 모달 밖이고, 캔버스도 아닐 때만 선택 해제
    if (!modal.contains(e.target) && e.target !== canvas) {
      modal.classList.add('hidden');
      state.selectedText = null; // 선택 해제 추가
      renderCanvas();
    }
  });
}