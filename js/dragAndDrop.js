// js/dragAndDrop.js
import { state } from './state.js';
import { getEventPos } from './utils.js';
import { 
  renderCanvas, 
  positionModalNearText, 
  updateModalControls, 
  findElementAtPosition,
  findStickerResizeHandle
} from './canvasRenderer.js';
import { stickerControls } from './stickerControls.js';

export function initDragAndDrop() {
  const canvas = state.canvas;
  let resizeHandle = null;
  let initialStickerSize = null;
  let initialMousePos = null;

  function handleStart(e) {
    const { x, y } = getEventPos(e);
    
    // 크기 조정 핸들 확인
    resizeHandle = findStickerResizeHandle(x, y);
    if (resizeHandle && state.selectedElement && state.selectedElementType === 'sticker') {
      state.isDragging = false; // 드래그가 아닌 리사이즈 모드
      state.isResizing = true;
      initialStickerSize = {
        width: state.selectedElement.width,
        height: state.selectedElement.height
      };
      initialMousePos = { x, y };
      canvas.style.cursor = getResizeCursor(resizeHandle);
      
      // 스티커 크기 조정 시작 시 모달 위치 고정
      if (stickerControls && stickerControls.isFollowingSticker !== undefined) {
        stickerControls.isFollowingSticker = false;
      }
      
      e.preventDefault();
      return;
    }
    
    // 일반적인 요소 선택 및 드래그
    const result = findElementAtPosition(x, y);
    
    if (result) {
      const { element, type } = result;
      
      if (type === 'text') {
        state.selectedText = element;
        state.selectedElement = element;
        state.selectedElementType = 'text';
        state.isDragging = true;
        state.isResizing = false;
        state.dragOffset.x = x - element.x;
        state.dragOffset.y = y - element.y;
        
        updateModalControls(element);
        const modal = document.getElementById('textControlModal');
        if (modal.classList.contains('hidden')) {
          positionModalNearText(element);
        }
        modal.classList.remove('hidden');
        
      } else if (type === 'sticker') {
        state.selectedText = null;
        state.selectedElement = element;
        state.selectedElementType = 'sticker';
        state.isDragging = true;
        state.isResizing = false;
        state.dragOffset.x = x - element.x;
        state.dragOffset.y = y - element.y;
        
        // 스티커 선택 시 텍스트 모달은 숨김
        document.getElementById('textControlModal').classList.add('hidden');
        
        // 스티커 편집 팝업 표시
        import('./stickerControls.js').then(module => {
          module.stickerControls.showPopup(element);
        });
      }
      
      canvas.style.cursor = 'move';
      renderCanvas();
      e.preventDefault();
    } else {
      // 아무것도 선택되지 않음
      state.selectedText = null;
      state.selectedElement = null;
      state.selectedElementType = null;
      state.isDragging = false;
      state.isResizing = false;
      canvas.style.cursor = 'default';
      document.getElementById('textControlModal').classList.add('hidden');
      
      // 스티커 편집 팝업도 닫기
      import('./stickerControls.js').then(module => {
        module.stickerControls.clearSelection();
      });
      
      renderCanvas();
    }
  }

  function handleMove(e) {
    const { x, y } = getEventPos(e);
    
    // 크기 조정 모드 - 모달 위치 고정
    if (state.isResizing && resizeHandle && state.selectedElement) {
      const deltaX = x - initialMousePos.x;
      const deltaY = y - initialMousePos.y;
      
      resizeStickerByHandle(resizeHandle, deltaX, deltaY);
      renderCanvas();
      e.preventDefault();
      return;
    }
    
    // 드래그 모드
    if (state.isDragging && state.selectedElement) {
      state.selectedElement.x = x - state.dragOffset.x;
      state.selectedElement.y = y - state.dragOffset.y;
      
      // 모달 위치 업데이트 안함 - 드래그 중에는 모달 위치 고정
      // 텍스트와 스티커 모두 드래그 중에는 모달이 고정됨
      
      renderCanvas();
      e.preventDefault();
      return;
    }
    
    // 마우스 커서 업데이트 (호버 상태)
    updateCursor(x, y);
  }

  function handleEnd() {
    // 드래그/크기조정 종료 시 모달 위치 업데이트
    if (state.isDragging && state.selectedElement) {
      if (state.selectedElementType === 'text') {
        positionModalNearText(state.selectedElement);
      } else if (state.selectedElementType === 'sticker') {
        if (stickerControls && stickerControls.positionModalNearSticker) {
          stickerControls.positionModalNearSticker(state.selectedElement);
        }
      }
    }
    
    state.isDragging = false;
    
    // 크기 조정 종료 시 모달 위치 추적 재개
    if (state.isResizing && stickerControls && stickerControls.isFollowingSticker !== undefined) {
      stickerControls.isFollowingSticker = true;
    }
    
    state.isResizing = false;
    resizeHandle = null;
    initialStickerSize = null;
    initialMousePos = null;
    canvas.style.cursor = 'default';
  }

  function resizeStickerByHandle(handle, deltaX, deltaY) {
    const sticker = state.selectedElement;
    const aspectRatio = initialStickerSize.width / initialStickerSize.height;
    
    let newWidth = initialStickerSize.width;
    let newHeight = initialStickerSize.height;
    
    switch (handle) {
      case 'se': // 우하단
        newWidth = initialStickerSize.width + deltaX;
        newHeight = newWidth / aspectRatio;
        break;
      case 'sw': // 좌하단
        newWidth = initialStickerSize.width - deltaX;
        newHeight = newWidth / aspectRatio;
        break;
      case 'ne': // 우상단
        newWidth = initialStickerSize.width + deltaX;
        newHeight = newWidth / aspectRatio;
        break;
      case 'nw': // 좌상단
        newWidth = initialStickerSize.width - deltaX;
        newHeight = newWidth / aspectRatio;
        break;
    }
    
    // 최소/최대 크기 제한
    const minSize = 20;
    const maxSize = 300;
    
    if (newWidth < minSize) {
      newWidth = minSize;
      newHeight = newWidth / aspectRatio;
    }
    if (newWidth > maxSize) {
      newWidth = maxSize;
      newHeight = newWidth / aspectRatio;
    }
    
    sticker.width = newWidth;
    sticker.height = newHeight;
  }

  function getResizeCursor(handle) {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nw-resize';
      case 'ne':
      case 'sw':
        return 'ne-resize';
      default:
        return 'default';
    }
  }

  function updateCursor(x, y) {
    if (state.selectedElement && state.selectedElementType === 'sticker') {
      const handle = findStickerResizeHandle(x, y);
      if (handle) {
        canvas.style.cursor = getResizeCursor(handle);
        return;
      }
    }
    
    const result = findElementAtPosition(x, y);
    canvas.style.cursor = result ? 'move' : 'default';
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd);
}
