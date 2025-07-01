// js/imageLoader.js
import { state } from './state.js';
import { renderCanvas } from './canvasRenderer.js';

export function initImageLoader() {
  document.getElementById('imageLoader').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    state.originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    state.originalFileExt = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = event => {
      state.img.onload = () => {
        const ow = state.img.width;
        const oh = state.img.height;
        state.originalWidth = ow;
        state.originalHeight = oh;
        
        // 배경 이미지 상태 업데이트
        state.backgroundImage = state.img;
        state.isImageLoaded = true;

        // 캔버스 Wrapper 보이게 하고 너비 기준으로 가로폭 꽉 채우기
        const wrap = document.querySelector('.canvas-wrapper') || document.body;
        wrap.classList.add('image-loaded');
        const wrapWidth = wrap.clientWidth;
        const aspectRatio = ow / oh;
        const displayWidth = wrapWidth;
        const displayHeight = displayWidth / aspectRatio;

        const dpr = state.canvasScale;
        state.canvas.style.width = `${displayWidth}px`;
        state.canvas.style.height = `${displayHeight}px`;
        state.canvas.width = displayWidth * dpr;
        state.canvas.height = displayHeight * dpr;
        state.ctx.scale(dpr, dpr);
        
        // 캔버스 디스플레이 크기 정확히 저장
        state.canvasWidth = displayWidth;
        state.canvasHeight = displayHeight;
        
        // 원본 이미지와 디스플레이 간의 비율도 저장
        state.scaleRatioX = state.originalWidth / displayWidth;
        state.scaleRatioY = state.originalHeight / displayHeight;
        
        state.ctx.imageSmoothingEnabled = true;
        state.ctx.imageSmoothingQuality = 'high';

        // 캔버스 래퍼는 이미 표시됨

        renderCanvas();
        console.log(`이미지 로드됨: 원본 크기=${ow}x${oh}, 표시 크기=${displayWidth}x${displayHeight}, 비율=${state.scaleRatioX}x${state.scaleRatioY}`);
      };
      state.img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}