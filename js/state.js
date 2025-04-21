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
  canvasHeight: 0
};