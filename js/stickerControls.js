// 스티커 컨트롤 모듈
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';

class StickerControls {
  constructor() {
    this.popup = null;
    this.sizeSlider = null;
    this.rotationSlider = null;
    this.opacitySlider = null;
    this.deleteBtn = null;
    this.closeBtn = null;
    this.currentSticker = null;
    this.isFollowingSticker = true; // 기본적으로 true, 슬라이더 조정 중에만 false
  }

  init() {
    this.popup = document.getElementById('stickerEditPopup');
    this.sizeSlider = document.getElementById('stickerSize');
    this.rotationSlider = document.getElementById('stickerRotation');
    this.opacitySlider = document.getElementById('stickerOpacity');
    this.deleteBtn = document.getElementById('deleteStickerBtn');
    this.closeBtn = document.getElementById('closeStickerEditBtn');
    this.colorPicker = document.getElementById('stickerColorPicker'); // 색상 피커 추가
    this.resetColorBtn = document.getElementById('resetStickerColorBtn'); // 색상 초기화 버튼 추가

    this.bindEvents();
    this.bindScrollEvents();
  }

  bindScrollEvents() {
    // 스크롤 시 팝업 위치 업데이트 (슬라이더 조정 중이 아니고 드래그/크기조정 중이 아닐 때만)
    this.scrollHandler = () => {
      if (this.currentSticker && this.isFollowingSticker && this.popup &&
        !this.popup.classList.contains('hidden') &&
        !state.isDragging && !state.isResizing) {
        this.positionModalNearSticker(this.currentSticker);
      }
    };

    // 스크롤 이벤트 등록 (throttle 적용)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(this.scrollHandler, 16); // ~60fps
    });

    // 윈도우 리사이즈 시에도 위치 업데이트
    window.addEventListener('resize', () => {
      if (this.currentSticker && this.popup && !this.popup.classList.contains('hidden') &&
        !state.isDragging && !state.isResizing) {
        this.positionModalNearSticker(this.currentSticker);
      }
    });
  }

  bindEvents() {
    if (!this.popup) return;

    // 크기 조정
    this.sizeSlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });

    this.sizeSlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });

    this.sizeSlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;

      // 슬라이더 값(1-100)을 실제 크기(10-1000px)로 변환
      const sliderValue = parseInt(e.target.value);
      const targetSize = sliderValue * 10; // 1-100을 10-1000으로 변환
      const originalWidth = this.currentSticker.image.width;
      const originalHeight = this.currentSticker.image.height;

      // 원본 이미지의 비율을 유지하면서 크기 조정
      const aspectRatio = originalWidth / originalHeight;
      if (aspectRatio >= 1) {
        // 가로가 더 긴 경우
        this.currentSticker.width = targetSize;
        this.currentSticker.height = targetSize / aspectRatio;
      } else {
        // 세로가 더 긴 경우
        this.currentSticker.height = targetSize;
        this.currentSticker.width = targetSize * aspectRatio;
      }

      // 수치 표시 업데이트 (슬라이더 값 그대로 표시)
      const stickerSizeValue = document.getElementById('stickerSizeValue');
      if (stickerSizeValue) {
        stickerSizeValue.textContent = sliderValue;
      }

      renderCanvas();
    });

    // 회전 조정
    this.rotationSlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });

    this.rotationSlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });

    this.rotationSlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;

      this.currentSticker.rotation = parseInt(e.target.value);

      // 수치 표시 업데이트
      const stickerRotationValue = document.getElementById('stickerRotationValue');
      if (stickerRotationValue) {
        stickerRotationValue.textContent = e.target.value + '°';
      }

      renderCanvas();
    });

    // 불투명도 조정
    this.opacitySlider.addEventListener('mousedown', () => {
      this.isFollowingSticker = false; // 조정 중에는 고정
    });

    this.opacitySlider.addEventListener('mouseup', () => {
      this.isFollowingSticker = true; // 조정 완료 후 다시 따라다니기
    });

    this.opacitySlider.addEventListener('input', (e) => {
      if (!this.currentSticker) return;

      this.currentSticker.opacity = parseInt(e.target.value) / 100;

      // 수치 표시 업데이트
      const stickerOpacityValue = document.getElementById('stickerOpacityValue');
      if (stickerOpacityValue) {
        stickerOpacityValue.textContent = e.target.value;
      }

      renderCanvas();
    });

    // 색상 변경
    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', (e) => {
        if (!this.currentSticker) return;
        this.currentSticker.color = e.target.value;
        renderCanvas();
      });
    }

    // 색상 초기화
    if (this.resetColorBtn) {
      this.resetColorBtn.addEventListener('click', () => {
        if (!this.currentSticker) return;
        delete this.currentSticker.color;
        // 색상 피커도 기본값(검정)으로 리셋하지만, 실제로는 적용 안됨 상태임
        if (this.colorPicker) this.colorPicker.value = '#000000';
        renderCanvas();
      });
    }

    // 터치 이벤트도 동일하게 처리 (모바일 지원)
    [this.sizeSlider, this.rotationSlider, this.opacitySlider].forEach(slider => {
      slider.addEventListener('touchstart', () => {
        this.isFollowingSticker = false;
      });

      slider.addEventListener('touchend', () => {
        this.isFollowingSticker = true;
      });
    });

    // 삭제 버튼
    this.deleteBtn.addEventListener('click', () => {
      this.deleteSticker();
    });

    // 완료 버튼
    this.closeBtn.addEventListener('click', () => {
      this.hidePopup();
    });

    // 팝업 외부 클릭시 닫기
    this.popup.addEventListener('click', (e) => {
      if (e.target === this.popup) {
        this.hidePopup();
      }
    });
  }

  showPopup(sticker) {
    if (!this.popup || !sticker) return;

    this.currentSticker = sticker;

    // 현재 스티커 값으로 슬라이더 초기화
    const currentPixelSize = Math.round(Math.max(sticker.width, sticker.height));
    const currentSize = Math.round(currentPixelSize / 10); // 픽셀 크기를 슬라이더 값(1-100)으로 변환
    const currentRotation = Math.round(sticker.rotation || 0);
    const currentOpacity = Math.round((sticker.opacity || 1) * 100);

    this.sizeSlider.value = currentSize;
    this.rotationSlider.value = currentRotation;
    this.opacitySlider.value = currentOpacity;

    // 색상 피커 초기화
    if (this.colorPicker) {
      this.colorPicker.value = sticker.color || '#000000';
    }

    // 수치 표시 초기화
    const stickerSizeValue = document.getElementById('stickerSizeValue');
    const stickerRotationValue = document.getElementById('stickerRotationValue');
    const stickerOpacityValue = document.getElementById('stickerOpacityValue');

    if (stickerSizeValue) stickerSizeValue.textContent = currentSize;
    if (stickerRotationValue) stickerRotationValue.textContent = currentRotation + '°';
    if (stickerOpacityValue) stickerOpacityValue.textContent = currentOpacity;

    // 팝업을 스티커 근처에 위치시키기
    this.positionModalNearSticker(sticker);

    // 팝업 표시
    this.popup.classList.remove('hidden');

    // 슬라이더 조정이 끝난 후 모달이 스티커를 따라다닐 수 있도록 플래그 설정
    this.isFollowingSticker = true;
  }

  positionModalNearSticker(sticker) {
    if (!this.popup || !sticker) return;

    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const modalWidth = 280;
    const modalHeight = 160;
    const padding = 10;

    // 캔버스의 실제 디스플레이 크기와 논리적 크기 비율 계산
    const displayWidth = canvasRect.width;
    const displayHeight = canvasRect.height;
    const logicalWidth = state.canvasWidth || (canvas.width / state.canvasScale);
    const logicalHeight = state.canvasHeight || (canvas.height / state.canvasScale);

    // 논리적 좌표를 화면 좌표로 변환하는 비율
    const scaleX = displayWidth / logicalWidth;
    const scaleY = displayHeight / logicalHeight;

    // 스티커의 화면상 위치 계산 (스크롤 위치 포함)
    let stickerScreenX = canvasRect.left + (sticker.x * scaleX);
    let stickerScreenY = canvasRect.top + (sticker.y * scaleY);

    // 스티커 크기를 화면 좌표로 변환
    const stickerScreenWidth = sticker.width * scaleX;
    const stickerScreenHeight = sticker.height * scaleY;

    // 모달을 스티커 하단 중앙에 배치 (현재 스크롤 위치 기준)
    let modalX = stickerScreenX - modalWidth / 2;
    let modalY = stickerScreenY + stickerScreenHeight / 2 + padding;

    // 현재 뷰포트 정보 (스크롤 고려)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    // 좌우 경계 체크
    if (modalX < padding) {
      modalX = padding;
    } else if (modalX + modalWidth > viewportWidth - padding) {
      modalX = viewportWidth - modalWidth - padding;
    }

    // 아래쪽에 공간이 없으면 위쪽에 배치 (뷰포트 기준)
    if (modalY > scrollY + viewportHeight - modalHeight - padding) {
      modalY = stickerScreenY - stickerScreenHeight / 2 - modalHeight - padding;
    }

    // 위쪽에도 공간이 없으면 스티커 옆에 배치
    if (modalY < scrollY + padding) {
      modalY = stickerScreenY - modalHeight / 2;

      // 오른쪽 우선 배치
      modalX = stickerScreenX + stickerScreenWidth / 2 + padding;

      // 오른쪽에 공간이 없으면 왼쪽에 배치
      if (modalX + modalWidth > viewportWidth - padding) {
        modalX = stickerScreenX - stickerScreenWidth / 2 - modalWidth - padding;
      }
    }

    // 최종 위치 적용 (절대 위치)
    this.popup.style.position = 'absolute';
    this.popup.style.left = `${Math.max(padding, modalX)}px`;
    this.popup.style.top = `${Math.max(scrollY + padding, modalY)}px`;
    this.popup.style.zIndex = '1000';
  }

  hidePopup() {
    if (!this.popup) return;

    this.popup.classList.add('hidden');
    this.currentSticker = null;
    this.isFollowingSticker = true; // 기본값으로 재설정

    // 선택 해제
    state.selectedElement = null;
    state.selectedElementType = null;
    renderCanvas();
  }

  deleteSticker() {
    if (!this.currentSticker) return;

    // state에서 스티커 제거
    if (state.stickers) {
      const index = state.stickers.findIndex(s => s.id === this.currentSticker.id);
      if (index !== -1) {
        state.stickers.splice(index, 1);
      }
    }

    // 선택 해제
    state.selectedElement = null;
    state.selectedElementType = null;

    // 팝업 닫기
    this.hidePopup();

    // 캔버스 다시 렌더링
    renderCanvas();
  }

  // 외부에서 스티커 선택 해제 시 호출할 수 있는 메서드
  clearSelection() {
    if (this.currentSticker) {
      this.hidePopup();
    }
  }
}

export const stickerControls = new StickerControls();
