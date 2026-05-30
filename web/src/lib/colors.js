// ontime% -> màu nội suy: 0%=đỏ, 50%=vàng, 100%=xanh. null=xám nhạt.
export function ontimeColor(pct) {
  if (pct == null) return '#f3f3f3';
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const r = p < 0.5 ? 211 : Math.round(211 - (p - 0.5) * 2 * 165);
  const g = p < 0.5 ? Math.round(60 + p * 2 * 120) : 180;
  return `rgb(${r},${g},58)`;
}

export const PALETTE = {
  ontime: '#2e7d32', late: '#ef6c00', notChecked: '#bdbdbd',
  bar: '#1976d2', trend: '#d32f2f',
};
