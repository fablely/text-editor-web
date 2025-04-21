// js/popup.js
export function initPopup() {
  const popup = document.getElementById('welcomePopup');
  const confirmBtn = document.getElementById('confirmBtn');
  document.querySelector('.editor-container').style.display = 'none';
  confirmBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
    document.querySelector('.editor-container').style.display = 'block';
  });
}