// 스티커 로더 모듈
import { state } from './state.js';
import { getNextZIndex } from './utils.js';
import { renderCanvas } from './canvasRenderer.js';

class StickerLoader {
  constructor() {
    this.stickerList = [];
    this.selectedSticker = null;
    this.stickerPickerModal = null;
    this.stickerGrid = null;
  }

  async init() {
    console.log('스티커 로더 초기화 시작...');
    this.stickerPickerModal = document.getElementById('stickerPickerModal');
    this.stickerGrid = document.getElementById('stickerGrid');
    
    if (!this.stickerPickerModal) {
      console.error('스티커 피커 모달을 찾을 수 없습니다.');
      return;
    }
    
    if (!this.stickerGrid) {
      console.error('스티커 그리드를 찾을 수 없습니다.');
      return;
    }
    
    // 스티커 파일 목록 로드
    await this.loadStickerList();
    this.bindEvents();
    console.log('스티커 로더 초기화 완료');
  }

  async loadStickerList() {
    // sticker1.png, sticker2.png ... sticker100.png 및 .svg 형태로 자동 인식
    const exts = ['png', 'svg'];
    const stickerPatterns = exts.flatMap(ext =>
      Array.from({length: 100}, (_, i) => `sticker${i + 1}.${ext}`)
    );

    this.stickerList = [];
    let loadedCount = 0;
    
    console.log('스티커 파일 검색 시작 (sticker1.png ~ sticker1000.png)...');
    
    // 병렬로 모든 패턴 시도 (더 빠름)
    const loadPromises = stickerPatterns.map(async (filename) => {
      return new Promise((resolve) => {
        const img = new Image();
        const imagePath = `Sticker/${filename}`;
        
        const timeoutId = setTimeout(() => {
          resolve(null); // 타임아웃 시 null 반환
        }, 1000); // 1초 타임아웃 (더 빠르게)
        
        img.onload = () => {
          clearTimeout(timeoutId);
          console.log(`✅ 스티커 발견: ${filename}`);
          resolve({
            name: filename,
            path: imagePath,
            image: img
          });
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          resolve(null); // 에러 시 null 반환
        };
        
        img.src = imagePath;
      });
    });
    
    // 모든 로딩 시도를 기다린 후 성공한 것들만 필터링
    const results = await Promise.all(loadPromises);
    this.stickerList = results.filter(result => result !== null);
    loadedCount = this.stickerList.length;

    console.log(`🎯 발견된 스티커 개수: ${loadedCount}`);
    
    if (loadedCount > 0) {
      console.log('발견된 스티커들:', this.stickerList.map(s => s.name));
    }

    console.log(`📊 총 스티커 개수: ${this.stickerList.length}`);
    this.createStickerGrid();
  }

  createStickerGrid() {
    if (!this.stickerGrid) return;
    
    this.stickerGrid.innerHTML = '';
    
    this.stickerList.forEach((sticker, index) => {
      const stickerItem = document.createElement('div');
      stickerItem.className = 'sticker-item';
      stickerItem.dataset.index = index;
      
      const img = document.createElement('img');
      img.src = sticker.path;
      img.alt = sticker.name;
      img.style.pointerEvents = 'none'; // 이미지 자체는 클릭 이벤트 방지
      
      // 이미지 로드 에러 처리
      img.onerror = () => {
        console.log(`스티커 이미지 로드 실패: ${sticker.path || sticker.name}`);
        // 에러 시 대체 이미지 표시
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0f0"/><text x="32" y="32" text-anchor="middle" dominant-baseline="middle" fill="%23999">❌</text></svg>';
      };
      
      stickerItem.appendChild(img);
      this.stickerGrid.appendChild(stickerItem);
      
      // 클릭 이벤트
      stickerItem.addEventListener('click', () => {
        this.selectSticker(index);
      });
    });
  }

  selectSticker(index) {
    // 이전 선택 해제
    const prevSelected = this.stickerGrid.querySelector('.sticker-item.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    
    // 새로운 선택
    const stickerItem = this.stickerGrid.querySelector(`[data-index="${index}"]`);
    if (stickerItem) {
      stickerItem.classList.add('selected');
      this.selectedSticker = this.stickerList[index];
    }
  }

  showStickerPicker() {
    if (this.stickerPickerModal) {
      this.stickerPickerModal.classList.remove('hidden');
      this.selectedSticker = null;
      
      // 이전 선택 해제
      const prevSelected = this.stickerGrid.querySelector('.sticker-item.selected');
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
    }
  }

  hideStickerPicker() {
    if (this.stickerPickerModal) {
      this.stickerPickerModal.classList.add('hidden');
    }
  }

  addStickerToCanvas() {
    if (!this.selectedSticker || !state.isImageLoaded) {
      const imageRequiredPopup = document.getElementById('imageRequiredPopup');
      imageRequiredPopup.classList.remove('hidden');
      return;
    }

    // 논리적 캔버스 중앙 좌표 계산 (실제 디스플레이 크기 기준)
    const centerX = (state.canvasWidth || state.canvas.width / state.canvasScale) / 2;
    const centerY = (state.canvasHeight || state.canvas.height / state.canvasScale) / 2;
    
    // 스티커 크기를 캔버스 크기에 맞게 적절히 조정
    const img = this.selectedSticker.image;
    const aspectRatio = img.width / img.height;
    
    // 캔버스 크기 기준으로 적절한 기본 크기 계산 (캔버스의 15-20% 정도)
    const canvasWidth = state.canvasWidth || state.canvas.width / state.canvasScale;
    const canvasHeight = state.canvasHeight || state.canvas.height / state.canvasScale;
    const maxSize = Math.min(canvasWidth, canvasHeight) * 0.2; // 캔버스의 20%
    
    let width, height;
    if (aspectRatio >= 1) {
      // 가로가 더 긴 경우
      width = Math.min(maxSize, img.width * 0.5); // 원본 크기의 50% 또는 maxSize 중 작은 값
      height = width / aspectRatio;
    } else {
      // 세로가 더 긴 경우
      height = Math.min(maxSize, img.height * 0.5); // 원본 크기의 50% 또는 maxSize 중 작은 값
      width = height * aspectRatio;
    }
    
    const originalImage = this.selectedSticker.image.cloneNode(true);
    const stickerObject = {
      type: 'sticker',
      id: Date.now(),
      x: centerX,
      y: centerY,
      width: width,
      height: height,
      image: originalImage, // 현재 사용될 이미지
      originalImage: originalImage, // 색상 변경의 기준이 될 원본 이미지
      rotation: 0,
      opacity: 1,
      name: this.selectedSticker.name,
      zIndex: getNextZIndex() // 새로운 z-index 할당
    };

    // 스티커를 state에 추가
    if (!state.stickers) {
      state.stickers = [];
    }
    state.stickers.push(stickerObject);
    
    // 스티커를 선택된 상태로 설정
    state.selectedElement = stickerObject;
    state.selectedElementType = 'sticker';
    
    // 캔버스 다시 렌더링
    renderCanvas();
    
    // 모달 닫기
    this.hideStickerPicker();
    
    // 화면을 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 스티커 편집 팝업 표시 (약간의 지연 후)
    setTimeout(() => {
      import('./stickerControls.js').then(module => {
        module.stickerControls.showPopup(stickerObject);
      });
    }, 500);
    
    console.log('스티커가 추가되었습니다:', stickerObject);
  }

  bindEvents() {
    // 확인 버튼
    const confirmBtn = document.getElementById('confirmStickerBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.addStickerToCanvas();
      });
    }
    
    // 취소 버튼
    const cancelBtn = document.getElementById('cancelStickerBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideStickerPicker();
      });
    }
    
    // 모달 배경 클릭시 닫기
    if (this.stickerPickerModal) {
      this.stickerPickerModal.addEventListener('click', (e) => {
        if (e.target === this.stickerPickerModal) {
          this.hideStickerPicker();
        }
      });
    }
  }
}

export const stickerLoader = new StickerLoader();
