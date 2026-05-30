import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { loadData, USE_MOCK } from './lib/data.js';
import * as T from './lib/transform.js';
import KpiCards from './components/KpiCards.jsx';
import TrendChart from './components/TrendChart.jsx';
import TypeBar from './components/TypeBar.jsx';
import Heatmap from './components/Heatmap.jsx';
import TopTables from './components/TopTables.jsx';
import VehicleCheckin from './components/VehicleCheckin.jsx';

const TABS = [
  { key: 'tong-quan', label: 'Tổng quan' },
  { key: 'xu-huong', label: 'Xu hướng' },
  { key: 'loai', label: 'Theo Loại' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'top', label: 'Top thấp nhất' },
  { key: 'xe', label: 'Theo xe' },
];

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('tong-quan');

  useEffect(() => { loadData().then(setData).catch((e) => setError(e.message)); }, []);

  const view = useMemo(() => data && ({
    kpi: T.kpi(data), daily: T.daily(data), byType: T.typeBar(data),
    heatmap: T.heatmap(data), top: T.top(data), dates: T.allDates(data),
  }), [data]);

  if (error) return <main className="app"><h1>📊 Báo cáo Ontime</h1><p className="err">❌ {error}</p></main>;
  if (!view) return <main className="app"><h1>📊 Báo cáo Ontime</h1><p>Đang tải dữ liệu…</p></main>;

  return (
    <main className="app">
      <header>
        <h1>📊 NAK — Báo cáo Ontime giao hàng</h1>
        {USE_MOCK && <span className="badge">Dữ liệu mẫu (CSV) — chưa kết nối sheet</span>}
      </header>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>
      <section className="panel">
        {tab === 'tong-quan' && <KpiCards kpi={view.kpi} />}
        {tab === 'xu-huong' && <TrendChart daily={view.daily} />}
        {tab === 'loai' && <TypeBar byType={view.byType} />}
        {tab === 'heatmap' && <Heatmap heatmap={view.heatmap} />}
        {tab === 'top' && <TopTables top={view.top} />}
        {tab === 'xe' && <VehicleCheckin data={data} dates={view.dates} />}
      </section>
    </main>
  );
}
