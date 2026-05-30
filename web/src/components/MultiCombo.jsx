import { useState } from 'react';

// Combobox multi-select có search, render-khi-mở (dùng <details>, không lib ngoài).
export default function MultiCombo({ label, options, selected, onChange }) {
  const [q, setQ] = useState('');
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  const list = options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).slice(0, 100);
  return (
    <details className="combo">
      <summary>{label}{selected.length ? ` (${selected.length})` : ''}</summary>
      <div className="combo-panel">
        <input className="combo-search" placeholder="tìm…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="combo-list">
          {list.map((o) => (
            <label key={o}><input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} /> {o}</label>
          ))}
          {!list.length && <div className="muted">— không có —</div>}
        </div>
        {selected.length > 0 && <button className="combo-clear" onClick={() => onChange([])}>Xoá chọn</button>}
      </div>
    </details>
  );
}
