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
  
  // 모바일 환경에서 폰트 선택기 초기화
  const isMobile = window.innerWidth <= 768;

  // 새로운 모달 폰트 선택기 요소
  const modalFontSelector = document.getElementById('modalFontSelector');
  const modalFontDisplay = document.getElementById('modalFontDisplay');
  const hiddenModalFontFamily = document.getElementById('modalFontFamily');

  // 폰트 패밀리 선택기
  const fontSelectors = [
    { 
      selector: document.getElementById('fontFamily'),
      display: null, // 메인 폰트 선택기는 기존 select 요소 그대로 사용
      type: 'main'
    },
    {
      selector: hiddenModalFontFamily,
      display: modalFontDisplay, // 모달의 폰트 선택기는 커스텀 디스플레이 사용
      type: 'modal'
    }
  ];

  // 모바일 환경에서 메인 폰트 선택기 이벤트 설정
  if (isMobile) {
    const mainFontSelector = document.getElementById('fontFamily');
    mainFontSelector.addEventListener('click', function(e) {
      e.preventDefault();
      openFontPicker(fontSelectors[0]);
      return false;
    });
    
    // 모바일에서는 포커스와 터치 이벤트도 차단
    mainFontSelector.addEventListener('focus', function(e) {
      e.preventDefault();
      this.blur();
    });
    
    mainFontSelector.addEventListener('touchstart', function(e) {
      e.preventDefault();
      openFontPicker(fontSelectors[0]);
    }, { passive: false });
  }

  // 모달 폰트 선택기 이벤트 설정 (모든 환경에서)
  modalFontSelector.addEventListener('click', function() {
    openFontPicker(fontSelectors[1]);
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

  // 폰트 옵션 클릭 이벤트
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

  // 초기 모달 폰트 디스플레이 설정
  updateFontDisplay();
}

// 폰트 선택기 열기
function openFontPicker(selectorObj) {
  currentFontSelector = selectorObj;
  const fontPickerModal = document.getElementById('fontPickerModal');
  const fontPickerWheel = document.getElementById('fontPickerWheel');
  
  // 기존 옵션 제거
  fontPickerWheel.innerHTML = '';
  
  const selector = selectorObj.selector;
  
  // 폰트 옵션 가져오기 (메인 폰트 선택기에서 옵션 가져옴)
  const mainSelector = document.getElementById('fontFamily');
  fontOptions = Array.from(mainSelector.options).map(option => {
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
  
  const selector = currentFontSelector.selector;
  const display = currentFontSelector.display;
  const type = currentFontSelector.type;
  
  // 선택기 값 변경
  selector.value = fontOptions[selectedFontIndex].value;
  
  // 모달의 경우 표시 요소도 업데이트
  if (display) {
    display.textContent = fontOptions[selectedFontIndex].text;
    display.style.fontFamily = fontOptions[selectedFontIndex].value;
  }

  // 선택된 텍스트가 있으면 폰트 변경 적용
  if (state.selectedText) {
    state.selectedText.font = fontOptions[selectedFontIndex].value;
    
    // 두 폰트 선택기 동기화
    if (type === 'modal') {
      document.getElementById('fontFamily').value = fontOptions[selectedFontIndex].value;
    } else {
      document.getElementById('modalFontFamily').value = fontOptions[selectedFontIndex].value;
      document.getElementById('modalFontDisplay').textContent = fontOptions[selectedFontIndex].text;
      document.getElementById('modalFontDisplay').style.fontFamily = fontOptions[selectedFontIndex].value;
    }
    
    // 캔버스 다시 그리기
    renderCanvas();
    updateModalControls(state.selectedText);
  }

  updateFontDisplay();
}

// 모달 폰트 디스플레이 업데이트
function updateFontDisplay() {
  const modalFontFamily = document.getElementById('modalFontFamily');
  const modalFontDisplay = document.getElementById('modalFontDisplay');

  if (modalFontFamily && modalFontDisplay) {
    const fontValue = modalFontFamily.value;
    const mainSelector = document.getElementById('fontFamily');
    const option = Array.from(mainSelector.options).find(opt => opt.value === fontValue);
    
    if (option) {
      modalFontDisplay.textContent = option.textContent;
      modalFontDisplay.style.fontFamily = option.value;
    } else {
      modalFontDisplay.textContent = '기본 글꼴';
      modalFontDisplay.style.fontFamily = 'sans-serif';
    }
  }
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
