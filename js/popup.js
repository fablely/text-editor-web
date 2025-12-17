// js/popup.js
export function initPopup() {
  const popup = document.getElementById('welcomePopup');
  const confirmBtn = document.getElementById('confirmBtn');
  const editorContainer = document.querySelector('.editor-container');
  
  // 페이지 로드 시 에디터 숨기기 (스타일 변경을 한 번만 수행)
  if (editorContainer.style.display !== 'none') {
    editorContainer.style.display = 'none';
  }
  
  // 이벤트 리스너가 여러 번 등록되는 것을 방지
  confirmBtn.addEventListener('click', handleConfirmClick, { once: true });
  
  function handleConfirmClick() {
    // DOM 조작 최소화
    popup.classList.add('hidden');
    editorContainer.style.display = 'block';
  }
}