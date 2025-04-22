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

  // 방향 선택 이벤트 리스너 추가
  document.getElementById('modalTextDirection').addEventListener('change', e => {
    if (!state.selectedText) return;
    state.selectedText.direction = e.target.value;
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

  // 모달 방향 버튼 이벤트 처리
  document.getElementById('modalHorizontalBtn').addEventListener('click', () => {
    setModalDirection('horizontal');
  });
  
  document.getElementById('modalVerticalBtn').addEventListener('click', () => {
    setModalDirection('vertical');
  });
  
  function setModalDirection(direction) {
    if (!state.selectedText) return;
    
    // 모달 버튼 상태 업데이트
    document.getElementById('modalHorizontalBtn').classList.toggle('active-dir', direction === 'horizontal');
    document.getElementById('modalVerticalBtn').classList.toggle('active-dir', direction === 'vertical');
    
    // 메인 버튼도 동기화
    document.getElementById('horizontalBtn').classList.toggle('active-dir', direction === 'horizontal');
    document.getElementById('verticalBtn').classList.toggle('active-dir', direction === 'vertical');
    
    // 텍스트 방향 설정
    state.selectedText.direction = direction;
    renderCanvas();
  }
}