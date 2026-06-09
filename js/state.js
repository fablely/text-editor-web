// js/state.js
export const state = {
  img: new Image(),
  backgroundImage: null, // 배경 이미지 추가
  isImageLoaded: false, // 이미지 로드 상태 플래그 추가
  textObjects: [],
  stickers: [], // 스티커 배열 추가
  selectedText: null,
  selectedElement: null, // 선택된 요소 (텍스트 또는 스티커)
  selectedElementType: null, // 'text' 또는 'sticker'
  dragOffset: { x: 0, y: 0 },
  isDragging: false,
  isResizing: false, // 크기 조정 상태 추가
  isTextSliderAdjusting: false, // 텍스트 슬라이더 조정 상태 추가
  originalFileName: "",
  originalFileExt: "jpg",
  originalWidth: 0,
  originalHeight: 0,
  canvas: document.getElementById('canvas'),
  ctx: document.getElementById('canvas').getContext('2d'),
  canvasScale: window.devicePixelRatio || 1,
  canvasWidth: 0,
  canvasHeight: 0,
  scaleRatioX: 1, // 원본/표시 X축 비율
  scaleRatioY: 1  // 원본/표시 Y축 비율
};