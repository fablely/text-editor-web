// js/fontPicker.js
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';
import { updateModalControls } from './canvasRenderer.js';

let currentFontSelector = null; // 현재 선택된 폰트 선택기
let selectedFontIndex = 0; // 선택된 폰트 인덱스
let fontOptions = []; // 폰트 옵션 목록

export function initFontPicker() {
  const fontPickerModal = document.getElementById('fontPickerModal');
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  const cancelFontPicker = document.getElementById('cancelFontPicker');
  const confirmFontPicker = document.getElementById('confirmFontPicker');
  
  // 모든 기기에서 커스텀 선택기 사용
  const isMobile = window.innerWidth <= 768;

  // 폰트 패밀리 선택기에 이벤트 추가 - 모바일에선 click, 데스크톱에선 mousedown
  const fontSelectors = [
    document.getElementById('fontFamily'),
    document.getElementById('modalFontFamily')
  ];

  fontSelectors.forEach(selector => {
    // 모바일과 데스크톱 모두에서 드롭다운 동작 방지
    selector.addEventListener('mousedown', function(e) {
      if (isMobile) {
        e.preventDefault();
        openFontPicker(this);
      }
    });
    
    selector.addEventListener('click', function(e) {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 버블링 중지
        openFontPicker(this);
        return false;
      }
    });
    
    // 추가: 터치 이벤트에서도 동작 방지
    selector.addEventListener('touchstart', function(e) {
      if (isMobile) {
        e.preventDefault();
        openFontPicker(this);
      }
    }, { passive: false });
  });

  // 취소 버튼 클릭 시 모달 닫기
  cancelFontPicker.addEventListener('click', () => {
    fontPickerModal.classList.add('hidden');
    fontPickerModal.classList.remove('visible');
  });

  // 확인 버튼 클릭 시 선택 적용 및 모달 닫기
  confirmFontPicker.addEventListener('click', () => {
    applyFontSelection();
    fontPickerModal.classList.add('hidden');
    fontPickerModal.classList.remove('visible');
  });

  // 폰트 옵션 클릭 이벤트 (직접 선택 가능하도록)
  fontPickerWheel.addEventListener('click', (e) => {
    if (e.target.classList.contains('font-option')) {
      // 모든 옵션에서 선택 클래스 제거
      const options = fontPickerWheel.querySelectorAll('.font-option');
      options.forEach(opt => opt.classList.remove('selected'));
      
      // 클릭한 옵션에 선택 클래스 추가
      e.target.classList.add('selected');
      selectedFontIndex = parseInt(e.target.dataset.index);
      
      // 선택 옵션으로 스크롤
      const optionHeight = 40;
      fontPickerWheel.scrollTop = selectedFontIndex * optionHeight;
    }
  });

  // 폰트 피커 휠 스크롤 이벤트
  fontPickerWheel.addEventListener('scroll', debounce(function() {
    updateSelectedFont();
  }, 50));
}

// 폰트 선택기 열기
function openFontPicker(selector) {
  currentFontSelector = selector;
  const fontPickerModal = document.getElementById('fontPickerModal');
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  
  // 기존 옵션 제거
  fontPickerWheel.innerHTML = '';
  
  // 폰트 옵션 가져오기
  fontOptions = Array.from(selector.options).map(option => {
    return {
      value: option.value,
      text: option.textContent
    };
  });

  // 현재 선택된 값 찾기
  selectedFontIndex = fontOptions.findIndex(option => option.value === selector.value);
  if (selectedFontIndex === -1) selectedFontIndex = 0;

  // 옵션 요소 추가
  fontOptions.forEach((option, index) => {
    const div = document.createElement('div');
    div.className = 'font-option';
    if (index === selectedFontIndex) div.classList.add('selected');
    div.textContent = option.text;
    div.style.fontFamily = option.value;
    div.dataset.index = index;
    fontPickerWheel.appendChild(div);
  });

  // 모달 표시
  fontPickerModal.classList.remove('hidden');
  
  // 약간의 지연 후 visible 클래스 추가 (트랜지션 효과를 위해)
  setTimeout(() => {
    fontPickerModal.classList.add('visible');
  }, 10);

  // 현재 선택된 폰트로 스크롤
  setTimeout(() => {
    const optionHeight = 40; // font-option의 높이
    fontPickerWheel.scrollTop = selectedFontIndex * optionHeight;
  }, 50);
}

// 스크롤 위치에 따라 선택된 폰트 업데이트
function updateSelectedFont() {
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  const options = fontPickerWheel.querySelectorAll('.font-option');
  const optionHeight = 40; // font-option의 높이
  const containerHeight = fontPickerWheel.clientHeight;
  const scrollTop = fontPickerWheel.scrollTop;
  
  // 스크롤 위치에 따라 중앙에 있는 옵션 찾기
  const centerIndex = Math.round((scrollTop + containerHeight / 2 - 80) / optionHeight);
  
  // 범위 검사
  if (centerIndex >= 0 && centerIndex < options.length) {
    // 이전 선택 항목 클래스 제거
    options.forEach(opt => opt.classList.remove('selected'));
    
    // 새 선택 항목에 클래스 추가
    options[centerIndex].classList.add('selected');
    selectedFontIndex = centerIndex;
  }
}

// 선택된 폰트 적용
function applyFontSelection() {
  if (!currentFontSelector || selectedFontIndex === -1) return;
  
  // 선택기 값 변경
  currentFontSelector.value = fontOptions[selectedFontIndex].value;
  
  // 커스텀 이벤트 생성 및 디스패치 (change 이벤트 트리거)
  const event = new Event('change', { bubbles: true });
  currentFontSelector.dispatchEvent(event);
  
  // 선택된 텍스트가 있으면 폰트 변경 적용
  if (state.selectedText) {
    state.selectedText.font = fontOptions[selectedFontIndex].value;
    
    // 모달 폰트 선택기를 사용한 경우, 메인 폰트 선택기도 업데이트
    if (currentFontSelector.id === 'modalFontFamily') {
      document.getElementById('fontFamily').value = fontOptions[selectedFontIndex].value;
    } 
    // 메인 폰트 선택기를 사용한 경우, 모달 폰트 선택기도 업데이트
    else if (currentFontSelector.id === 'fontFamily') {
      document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
    }
    
    // 캔버스 다시 그리기
    renderCanvas();
    updateModalControls(state.selectedText);
  }
  
  console.log(`폰트 변경: ${fontOptions[selectedFontIndex].text}`);
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
