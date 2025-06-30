// js/canvasRenderer.js
import { state } from './state.js';

// 모든 요소들을 하나의 배열로 통합하여 레이어 순서 관리
function getAllElements() {
  const allElements = [];
  
  // 텍스트 객체들 추가
  state.textObjects.forEach((text, index) => {
    allElements.push({
      type: 'text',
      element: text,
      originalIndex: index
    });
  });
  
  // 스티커들 추가
  state.stickers.forEach((sticker, index) => {
    allElements.push({
      type: 'sticker',
      element: sticker,
      originalIndex: index
    });
  });
  
  // z-index로 정렬 (없으면 기본값 0)
  allElements.sort((a, b) => {
    const aZIndex = a.element.zIndex || 0;
    const bZIndex = b.element.zIndex || 0;
    return aZIndex - bZIndex;
  });
  
  return allElements;
}

export function renderCanvas() {
  const { ctx, canvas, img, canvasScale } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 배경 이미지 그리기
  if (img.src) {
    const w = canvas.width / canvasScale;
    const h = canvas.height / canvasScale;
    ctx.drawImage(img, 0, 0, w, h);
  }
  
  // 모든 요소를 z-index 순서로 정렬하여 렌더링
  const allElements = getAllElements();
  
  allElements.forEach(item => {
    if (item.type === 'sticker') {
      renderSticker(item.element);
    } else if (item.type === 'text') {
      renderText(item.element);
    }
  });
}

// 스티커 렌더링 함수
function renderSticker(sticker) {
  const { ctx } = state;
  
  ctx.save();
  ctx.translate(sticker.x, sticker.y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.globalAlpha = sticker.opacity;
  
  // 스티커 그리기 (중앙 정렬)
  ctx.drawImage(
    sticker.image,
    -sticker.width / 2,
    -sticker.height / 2,
    sticker.width,
    sticker.height
  );
  
  // 선택된 스티커에 테두리 효과 적용
  if (sticker === state.selectedElement) {
    const padding = 8;
    
    // 반투명 배경
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#59b4ad';
    ctx.beginPath();
    ctx.roundRect(
      -sticker.width / 2 - padding,
      -sticker.height / 2 - padding,
      sticker.width + padding * 2,
      sticker.height + padding * 2,
      4
    );
    ctx.fill();
    
    // 테두리
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#59b4ad';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      -sticker.width / 2 - padding,
      -sticker.height / 2 - padding,
      sticker.width + padding * 2,
      sticker.height + padding * 2,
      4
    );
    ctx.stroke();
    
    // 크기 조정 핸들 (모서리)
    const cornerSize = 8;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#59b4ad';
    ctx.lineWidth = 2;
    
    const corners = [
      { x: -sticker.width / 2 - padding, y: -sticker.height / 2 - padding, type: 'nw' },
      { x: sticker.width / 2 + padding, y: -sticker.height / 2 - padding, type: 'ne' },
      { x: -sticker.width / 2 - padding, y: sticker.height / 2 + padding, type: 'sw' },
      { x: sticker.width / 2 + padding, y: sticker.height / 2 + padding, type: 'se' }
    ];
    
    corners.forEach(corner => {
      ctx.beginPath();
      ctx.rect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
      ctx.fill();
      ctx.stroke();
    });
  }
  
  ctx.restore();
}

// 텍스트 렌더링 함수
function renderText(t) {
  const { ctx } = state;
  
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.globalAlpha = t.opacity || 1;
  ctx.font = `${t.size}px "${t.fontFamily}"`;
  ctx.fillStyle = t.color;
  ctx.textBaseline = 'top';

  const spacing = t.letterSpacing || 0;
  
  // 디버깅: 텍스트 방향 로그
  console.log('Canvas Renderer - Rendering text:', {
    text: t.text,
    direction: t.direction,
    isVertical: t.direction === 'vertical',
    isSelected: t === state.selectedText
  });

  if (t.direction === 'vertical') {
    t.text.split('').forEach((ch, i) => {
      ctx.fillText(ch, 0, i * (t.size + spacing));
    });
  } else {
    if (spacing) {
      let xPos = 0;
      t.text.split('').forEach(ch => {
        ctx.fillText(ch, xPos, 0);
        xPos += ctx.measureText(ch).width + spacing;
      });
    } else {
      ctx.fillText(t.text, 0, 0);
    }
  }

  // 선택된 텍스트에 고급스러운 테두리 효과 적용
  if (t === state.selectedText) {
    let textWidth = t.direction === 'vertical'
      ? t.size
      : ctx.measureText(t.text).width + spacing * (t.text.length - 1);
    let textHeight = t.direction === 'vertical'
      ? t.text.length * (t.size + spacing)
      : t.size;
    
    // 패딩 추가 (더 작은 값으로 조정)
    const padding = Math.max(4, t.size * 0.08); // 패딩 값 축소
    
    // 반투명 배경 그리기
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#59b4ad';
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
    ctx.fill();
    
    // 테두리 그리기
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#59b4ad';
    ctx.lineWidth = 1.5; // 테두리 두께 약간 감소
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
    ctx.stroke();
    
    // 모서리 포인트 그리기 (더 작게 조정)
    const cornerSize = Math.max(4, t.size * 0.07); // 모서리 크기 축소
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#59b4ad';
    ctx.lineWidth = 1; // 모서리 테두리 두께 감소
    
    // 코너 포인트를 텍스트 모서리에 더 가깝게 배치
    [
      [-padding/2, -padding/2], // 왼쪽 위
      [textWidth + padding/2, -padding/2], // 오른쪽 위
      [-padding/2, textHeight + padding/2], // 왼쪽 아래
      [textWidth + padding/2, textHeight + padding/2] // 오른쪽 아래
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.roundRect(x - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize, cornerSize/4);
      ctx.fill();
      ctx.stroke();
    });
  }
  
  ctx.restore();
}

export function setupCanvas() {
  state.canvas.width = state.canvasWidth * state.canvasScale;
  state.canvas.height = state.canvasHeight * state.canvasScale;
  state.canvas.style.width = state.canvasWidth + 'px';
  state.canvas.style.height = state.canvasHeight + 'px';
  state.ctx.scale(state.canvasScale, state.canvasScale);
}

export function calculateCanvasSize(img) {
  const maxDisplayWidth = 550;
  const maxDisplayHeight = 550;
  const minDisplayWidth = 280;
  const minDisplayHeight = 280;
  
  const originalWidth = img.width;
  const originalHeight = img.height;
  const aspectRatio = originalWidth / originalHeight;
  
  let displayWidth = originalWidth;
  let displayHeight = originalHeight;
  
  if (originalWidth > maxDisplayWidth || originalHeight > maxDisplayHeight) {
    if (aspectRatio > 1) {
      displayWidth = maxDisplayWidth;
      displayHeight = maxDisplayWidth / aspectRatio;
    } else {
      displayHeight = maxDisplayHeight;
      displayWidth = maxDisplayHeight * aspectRatio;
    }
  }
  
  if (displayWidth < minDisplayWidth) {
    displayWidth = minDisplayWidth;
    displayHeight = minDisplayWidth / aspectRatio;
  }
  if (displayHeight < minDisplayHeight) {
    displayHeight = minDisplayHeight;
    displayWidth = minDisplayHeight * aspectRatio;
  }
  
  state.originalWidth = originalWidth;
  state.originalHeight = originalHeight;
  state.canvasWidth = displayWidth;
  state.canvasHeight = displayHeight;
  state.scaleRatioX = originalWidth / displayWidth;
  state.scaleRatioY = originalHeight / displayHeight;
  
  setupCanvas();
}

export function resizeCanvas(newWidth, newHeight) {
  state.canvasWidth = newWidth;
  state.canvasHeight = newHeight;
  setupCanvas();
}

export function positionModalNearText(textObj) {
  const canvasRect = state.canvas.getBoundingClientRect();
  const modalWidth = 280;
  const textScreenX = canvasRect.left + textObj.x;
  const textScreenY = canvasRect.top + textObj.y;

  state.ctx.font = `${textObj.size}px ${textObj.fontFamily}`;
  let textWidth, textHeight;
  if (textObj.direction === 'vertical') {
    textWidth = textObj.size;
    textHeight = textObj.text.length * textObj.size;
  } else {
    textWidth = state.ctx.measureText(textObj.text).width;
    textHeight = textObj.size;
  }

  let modalX = textScreenX + textWidth / 2 - modalWidth / 2;
  let modalY = textScreenY + textHeight + 20;
  if (modalX < 10) modalX = 10;
  if (modalX + modalWidth > window.innerWidth - 10) {
    modalX = window.innerWidth - modalWidth - 10;
  }

  const modal = document.getElementById('textControlModal');
  modal.style.left = `${modalX}px`;
  modal.style.top = `${modalY}px`;
}

export function updateModalControls(textObj) {
  document.getElementById('modalTextContent').value = textObj.text;
  document.getElementById('modalFontFamily').value = textObj.fontFamily;
  
  // 모달 폰트 디스플레이 업데이트
  const modalFontDisplay = document.getElementById('modalFontDisplay');
  if (modalFontDisplay) {
    const fontFamily = document.getElementById('fontFamily');
    const option = Array.from(fontFamily.options).find(opt => opt.value === textObj.fontFamily);
    if (option) {
      modalFontDisplay.textContent = option.textContent;
      modalFontDisplay.style.fontFamily = option.value;
    }
  }
  
  document.getElementById('modalFontColor').value = textObj.color;
  document.getElementById('modalFontSize').value = textObj.size;
  document.getElementById('modalFontSizeValue').textContent = textObj.size;
  document.getElementById('modalOpacity').value = textObj.opacity || 1;
  document.getElementById('modalOpacityValue').textContent = (textObj.opacity || 1).toFixed(1);
  document.getElementById('modalLetterSpacing').value = textObj.letterSpacing || 0;
  document.getElementById('modalLetterSpacingValue').textContent = textObj.letterSpacing || 0;
  document.getElementById('modalRotation').value = textObj.rotation || 0;
  document.getElementById('modalRotationValue').textContent = `${textObj.rotation || 0}°`;
  document.getElementById('modalTextDirection').value = textObj.direction || 'horizontal';
  
  console.log('Canvas Renderer - updateModalControls:', {
    textObj: textObj,
    direction: textObj.direction,
    modalDirectionValue: document.getElementById('modalTextDirection').value
  });
  
  // 방향 디스플레이 업데이트
  const directionDisplay = document.getElementById('modalDirectionDisplay');
  if (directionDisplay) {
    directionDisplay.textContent = (textObj.direction || 'horizontal') === 'horizontal' ? '가로' : '세로';
    console.log('Canvas Renderer - Direction display updated to:', directionDisplay.textContent);
  }
  
  // DirectionPicker 상태도 업데이트
  if (window.directionPicker) {
    window.directionPicker.setSelectedDirection(textObj.direction || 'horizontal');
  }
}

// 위치에서 텍스트 찾기 (z-index 순서 고려)
export function findTextAtPosition(x, y) {
  // getAllElements를 사용해서 z-index 순서로 정렬된 배열에서 텍스트만 필터링
  const sortedElements = getAllElements();
  const textElements = sortedElements.filter(item => item.type === 'text');
  
  // 높은 z-index부터 검사 (역순)
  for (let i = textElements.length - 1; i >= 0; i--) {
    const t = textElements[i].element;
    state.ctx.save();
    state.ctx.font = `${t.size}px "${t.fontFamily}"`;
    state.ctx.textBaseline = 'top';

    let textWidth, textHeight;
    const spacing = t.letterSpacing || 0;
    
    if (t.direction === 'vertical') {
      textWidth = t.size;
      textHeight = t.text.length * (t.size + spacing);
    } else {
      textWidth = state.ctx.measureText(t.text).width + spacing * (t.text.length - 1);
      textHeight = t.size;
    }
    
    // 패딩 추가 (선택 영역을 조금 더 넓게 인식하기 위함)
    const padding = Math.max(8, t.size * 0.15);
    textWidth += padding * 2;
    textHeight += padding * 2;

    const dx = x - t.x + padding; // 패딩만큼 보정
    const dy = y - t.y + padding; // 패딩만큼 보정
    const angle = (-t.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    state.ctx.restore();

    if (
      rotatedX >= 0 && rotatedX <= textWidth &&
      rotatedY >= 0 && rotatedY <= textHeight
    ) {
      return t;
    }
  }
  return null;
}

// 위치에서 스티커 찾기 (z-index 순서 고려)
export function findStickerAtPosition(x, y) {
  if (!state.stickers) return null;
  
  // getAllElements를 사용해서 z-index 순서로 정렬된 배열에서 스티커만 필터링
  const sortedElements = getAllElements();
  const stickerElements = sortedElements.filter(item => item.type === 'sticker');
  
  // 높은 z-index부터 검사 (역순)
  for (let i = stickerElements.length - 1; i >= 0; i--) {
    const sticker = stickerElements[i].element;
    
    const dx = x - sticker.x;
    const dy = y - sticker.y;
    const angle = (-sticker.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

    const halfWidth = sticker.width / 2;
    const halfHeight = sticker.height / 2;
    
    if (
      rotatedX >= -halfWidth && rotatedX <= halfWidth &&
      rotatedY >= -halfHeight && rotatedY <= halfHeight
    ) {
      return sticker;
    }
  }
  return null;
}

// 위치에서 요소 찾기 (텍스트 또는 스티커, z-index 순서 고려)
export function findElementAtPosition(x, y) {
  // getAllElements를 사용해서 z-index 순서로 정렬된 배열 가져오기
  const sortedElements = getAllElements();
  
  // 높은 z-index부터 검사 (역순)
  for (let i = sortedElements.length - 1; i >= 0; i--) {
    const item = sortedElements[i];
    
    if (item.type === 'sticker') {
      const sticker = item.element;
      const dx = x - sticker.x;
      const dy = y - sticker.y;
      const angle = (-sticker.rotation * Math.PI) / 180;
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

      const halfWidth = sticker.width / 2;
      const halfHeight = sticker.height / 2;
      
      if (
        rotatedX >= -halfWidth && rotatedX <= halfWidth &&
        rotatedY >= -halfHeight && rotatedY <= halfHeight
      ) {
        return { element: sticker, type: 'sticker' };
      }
    } else if (item.type === 'text') {
      const t = item.element;
      state.ctx.save();
      state.ctx.font = `${t.size}px "${t.fontFamily}"`;
      state.ctx.textBaseline = 'top';

      let textWidth, textHeight;
      const spacing = t.letterSpacing || 0;
      
      if (t.direction === 'vertical') {
        textWidth = t.size;
        textHeight = t.text.length * (t.size + spacing);
      } else {
        textWidth = state.ctx.measureText(t.text).width + spacing * (t.text.length - 1);
        textHeight = t.size;
      }
      
      // 패딩 추가
      const padding = Math.max(8, t.size * 0.15);
      textWidth += padding * 2;
      textHeight += padding * 2;

      const dx = x - t.x + padding;
      const dy = y - t.y + padding;
      const angle = (-t.rotation * Math.PI) / 180;
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
      state.ctx.restore();

      if (
        rotatedX >= 0 && rotatedX <= textWidth &&
        rotatedY >= 0 && rotatedY <= textHeight
      ) {
        return { element: t, type: 'text' };
      }
    }
  }
  
  return null;
}

// 스티커 리사이즈 핸들 찾기
export function findStickerResizeHandle(x, y) {
  if (!state.selectedElement || state.selectedElementType !== 'sticker') return null;
  
  const sticker = state.selectedElement;
  const padding = 8;
  const cornerSize = 8;
  
  const corners = [
    { 
      x: sticker.x - sticker.width / 2 - padding, 
      y: sticker.y - sticker.height / 2 - padding, 
      type: 'nw' 
    },
    { 
      x: sticker.x + sticker.width / 2 + padding, 
      y: sticker.y - sticker.height / 2 - padding, 
      type: 'ne' 
    },
    { 
      x: sticker.x - sticker.width / 2 - padding, 
      y: sticker.y + sticker.height / 2 + padding, 
      type: 'sw' 
    },
    { 
      x: sticker.x + sticker.width / 2 + padding, 
      y: sticker.y + sticker.height / 2 + padding, 
      type: 'se' 
    }
  ];
  
  for (const corner of corners) {
    if (
      x >= corner.x - cornerSize / 2 && 
      x <= corner.x + cornerSize / 2 &&
      y >= corner.y - cornerSize / 2 && 
      y <= corner.y + cornerSize / 2
    ) {
      return corner.type;
    }
  }
  
  return null;
}
