// js/logger.js
// 프로덕션에서는 디버그 로그를 출력하지 않습니다.
// URL에 ?debug=1 을 붙이거나 localStorage.debug='1' 로 켤 수 있습니다.
const DEBUG =
  /[?&]debug=1\b/.test(location.search) ||
  (() => { try { return localStorage.getItem('debug') === '1'; } catch (_) { return false; } })();

const noop = () => {};

export const log = DEBUG ? console.log.bind(console) : noop;
export const warn = DEBUG ? console.warn.bind(console) : noop;
// 에러는 환경과 무관하게 항상 출력합니다.
export const error = console.error.bind(console);
