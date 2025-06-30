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
