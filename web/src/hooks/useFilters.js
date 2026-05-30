import { useState } from 'react';

const EMPTY = { loai: [], xe: [], taixe: [], tuyen: [], from: '', to: '' };

// State bộ lọc toàn cục (multi-select + khoảng ngày). Rỗng = không ràng buộc.
export function useFilters() {
  const [values, setValues] = useState(EMPTY);
  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));
  const reset = () => setValues(EMPTY);
  return { values, set, reset };
}
