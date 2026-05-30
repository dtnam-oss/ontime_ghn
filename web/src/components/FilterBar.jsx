import MultiCombo from './MultiCombo.jsx';

const TYPES = ['Nội thành', 'Nội tỉnh/Nội vùng', 'Tuyến trục'];

// Thanh lọc sticky: chip Loại + combobox Xe/Tài xế/Tuyến + khoảng ngày + Reset + đếm khớp.
export default function FilterBar({ options, values, set, reset, matchCount }) {
  const v = values;
  const dates = options.dates;
  const max = dates[dates.length - 1] || '';
  const toggleLoai = (t) => set('loai', v.loai.includes(t) ? v.loai.filter((x) => x !== t) : [...v.loai, t]);
  const preset = (n) => {
    if (n == null) { set('from', ''); set('to', ''); return; }
    set('from', dates[Math.max(0, dates.length - n)] || ''); set('to', max);
  };
  return (
    <div className="filterbar">
      <div className="fb-group">
        {TYPES.filter((t) => options.loai.includes(t)).map((t) => (
          <button key={t} className={'chip' + (v.loai.includes(t) ? ' on' : '')} onClick={() => toggleLoai(t)}>{t}</button>
        ))}
      </div>
      <MultiCombo label="Xe" options={options.xe} selected={v.xe} onChange={(val) => set('xe', val)} />
      <MultiCombo label="Tài xế" options={options.taixe} selected={v.taixe} onChange={(val) => set('taixe', val)} />
      <MultiCombo label="Tuyến" options={options.tuyen} selected={v.tuyen} onChange={(val) => set('tuyen', val)} />
      <div className="fb-group dates">
        <input type="date" value={v.from} min={dates[0]} max={max} onChange={(e) => set('from', e.target.value)} />
        <span>–</span>
        <input type="date" value={v.to} min={dates[0]} max={max} onChange={(e) => set('to', e.target.value)} />
        <button className="chip" onClick={() => preset(7)}>7 ngày</button>
        <button className="chip" onClick={() => preset(1)}>Hôm nay</button>
        <button className="chip" onClick={() => preset(null)}>Tất cả</button>
      </div>
      <button className="reset" onClick={reset}>↺ Reset</button>
      <span className="match"><b>{matchCount}</b> chuyến khớp</span>
    </div>
  );
}
