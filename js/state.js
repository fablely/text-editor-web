// js/state.js
export const state = {
  img: new Image(),
  textObjects: [],
  selectedText: null,
  dragOffset: { x: 0, y: 0 },
  isDragging: false,
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