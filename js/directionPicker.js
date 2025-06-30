// 방향 선택기 모듈
export class DirectionPicker {
  constructor() {
    this.selectedDirection = 'horizontal';
    this.currentIndex = 0; // 휠 내비게이션용 인덱스
    this.isVisible = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDirectionOptions();
  }

  setupEventListeners() {
    // 방향 선택기 열기
    const directionSelector = document.getElementById('modalDirectionSelector');
    if (directionSelector) {
      directionSelector.addEventListener('click', () => {
        this.show();
      });
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelDirectionPicker');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 확인 버튼
    const confirmBtn = document.getElementById('confirmDirectionPicker');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.confirmSelection();
      });
    }

    // 모달 외부 클릭시 닫기
    const modal = document.getElementById('directionPickerModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hide();
        }
      });
    }
  }

  setupDirectionOptions() {
    const options = document.querySelectorAll('.direction-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        console.log('Direction option clicked:', option.dataset.value);
        
        // 기존 선택 제거
        options.forEach(opt => opt.classList.remove('selected'));
        // 새로운 선택 추가
        option.classList.add('selected');
        this.selectedDirection = option.dataset.value;
        
        console.log('Direction Picker - selectedDirection updated to:', this.selectedDirection);
      });
    });

    // 기본값 설정
    const defaultOption = document.querySelector('.direction-option[data-value="horizontal"]');
    if (defaultOption) {
      defaultOption.classList.add('selected');
    }
    
    // 휠 스크롤 지원 추가
    this.setupWheelNavigation();
  }
  
  setupWheelNavigation() {
    const wheel = document.getElementById('directionPickerWheel');
    if (!wheel) return;
    
    const options = ['horizontal', 'vertical'];
    
    // 휠 이벤트 리스너
    wheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (e.deltaY > 0) {
        // 아래로 스크롤 - 다음 옵션
        this.currentIndex = (this.currentIndex + 1) % options.length;
      } else {
        // 위로 스크롤 - 이전 옵션
        this.currentIndex = (this.currentIndex - 1 + options.length) % options.length;
      }
      
      const selectedValue = options[this.currentIndex];
      this.setSelectedDirection(selectedValue);
    });
    
    // 터치 스와이프 지원 (모바일)
    let startY = 0;
    wheel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    
    wheel.addEventListener('touchmove', (e) => {
      e.preventDefault();
    });
    
    wheel.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;
      
      if (Math.abs(diff) > 30) { // 최소 30px 이동
        if (diff > 0) {
          // 위로 스와이프 - 다음 옵션
          this.currentIndex = (this.currentIndex + 1) % options.length;
        } else {
          // 아래로 스와이프 - 이전 옵션
          this.currentIndex = (this.currentIndex - 1 + options.length) % options.length;
        }
        
        const selectedValue = options[this.currentIndex];
        this.setSelectedDirection(selectedValue);
      }
    });
  }

  show() {
    const modal = document.getElementById('directionPickerModal');
    if (modal) {
      modal.classList.remove('hidden');
      // 현재 선택된 방향으로 설정
      const currentDirection = document.getElementById('modalTextDirection').value;
      this.setSelectedDirection(currentDirection);
      
      // 애니메이션을 위한 짧은 지연
      setTimeout(() => {
        modal.classList.add('visible');
      }, 10);
      
      this.isVisible = true;
      // 바디 스크롤 방지
      document.body.classList.add('no-scroll');
    }
  }

  hide() {
    const modal = document.getElementById('directionPickerModal');
    if (modal) {
      modal.classList.remove('visible');
      // 애니메이션 완료 후 숨김
      setTimeout(() => {
        modal.classList.add('hidden');
        document.body.classList.remove('no-scroll');
      }, 400);
      
      this.isVisible = false;
    }
  }

  setSelectedDirection(direction) {
    console.log('Direction Picker - setSelectedDirection called with:', direction);
    
    this.selectedDirection = direction; // selectedDirection도 업데이트
    
    const options = document.querySelectorAll('.direction-option');
    options.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.value === direction) {
        option.classList.add('selected');
      }
    });
    
    // 휠 내비게이션을 위한 currentIndex 업데이트
    const optionValues = ['horizontal', 'vertical'];
    this.currentIndex = optionValues.indexOf(direction);
    
    console.log('Direction Picker - selectedDirection updated to:', this.selectedDirection);
  }

  confirmSelection() {
    // 선택된 방향을 hidden input에 설정
    const hiddenInput = document.getElementById('modalTextDirection');
    const displayElement = document.getElementById('modalDirectionDisplay');
    
    console.log('Direction Picker - Selected direction:', this.selectedDirection);
    
    if (hiddenInput && displayElement) {
      hiddenInput.value = this.selectedDirection;
      displayElement.textContent = this.selectedDirection === 'horizontal' ? '가로' : '세로';
      
      console.log('Direction Picker - Updated hidden input value to:', hiddenInput.value);
      console.log('Direction Picker - Updated display text to:', displayElement.textContent);
      
      // 직접 state 업데이트 (change 이벤트가 작동하지 않을 경우를 대비)
      if (window.state) {
        let targetText = window.state.selectedText;
        
        // selectedText가 없을 때 가장 최근 텍스트를 대상으로 설정
        if (!targetText && window.state.textObjects && window.state.textObjects.length > 0) {
          targetText = window.state.textObjects[window.state.textObjects.length - 1];
          window.state.selectedText = targetText;
          console.log('Direction Picker - Found and set selectedText:', targetText);
        }
        
        if (targetText) {
          console.log('Direction Picker - Directly updating selectedText.direction');
          targetText.direction = this.selectedDirection;
          
          // 캔버스 다시 렌더링
          if (window.renderCanvas) {
            window.renderCanvas();
          }
        } else {
          console.warn('Direction Picker - No text available to update direction');
        }
      }
      
      // 텍스트 방향 변경 이벤트 트리거
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);
      console.log('Direction Picker - Dispatched change event');
    }
    
    this.hide();
  }

  // 외부에서 방향 설정할 때 사용
  updateDirection(direction) {
    this.selectedDirection = direction;
    const displayElement = document.getElementById('modalDirectionDisplay');
    if (displayElement) {
      displayElement.textContent = direction === 'horizontal' ? '가로' : '세로';
    }
    
    const hiddenInput = document.getElementById('modalTextDirection');
    if (hiddenInput) {
      hiddenInput.value = direction;
    }
    
    this.setSelectedDirection(direction);
  }
}
