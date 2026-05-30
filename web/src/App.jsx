import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { loadTrips, loadStops } from './lib/data.js';
import * as T from './lib/transform.js';
import { useFilters } from './hooks/useFilters.js';
import FilterBar from './components/FilterBar.jsx';
import KpiCards from './components/KpiCards.jsx';
import TrendChart from './components/TrendChart.jsx';
import TypeBar from './components/TypeBar.jsx';
import CheckinDonut from './components/CheckinDonut.jsx';
import Heatmap from './components/Heatmap.jsx';
import TopTables from './components/TopTables.jsx';
import VehicleCheckin from './components/VehicleCheckin.jsx';
import TripDetail from './components/TripDetail.jsx';

// 1 trang cuộn liền mạch + bộ lọc toàn cục. FE đọc agg_trip, tự gom + lọc.
export default function App() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState(null);
  const { values, set, reset } = useFilters();
  const [drill, setDrill] = useState(null);
  const [selTrip, setSelTrip] = useState(null);
  const [stops, setStops] = useState(null);

  useEffect(() => { loadTrips().then((v) => setTrips(T.parseTrips(v))).catch((e) => setError(e.message)); }, []);

  const opts = useMemo(() => trips && T.options(trips), [trips]);
  const ft = useMemo(() => (trips ? T.filterTrips(trips, values) : []), [trips, values]);
  const view = useMemo(() => (trips ? {
    kpi: T.kpi(ft), daily: T.daily(ft), byType: T.typeBar(ft), checkin: T.checkin(ft),
    heatmap: T.heatmap(ft), top: T.top(ft), vehicle: T.vehicle(ft),
  } : null), [ft, trips]);

  const matchedTrips = useMemo(() => T.tripsForDrill(ft, drill), [ft, drill]);
  const selected = matchedTrips.find((t) => t.trip === selTrip) || matchedTrips[0] || null;

  const onDrill = (d) => {
    if (!stops) loadStops().then((v) => setStops(T.parseStops(v))).catch(() => {});
    setDrill(d); setSelTrip(null);
  };

  if (error) return <main className="app"><h1>📊 Báo cáo Ontime</h1><p className="err">❌ {error}</p></main>;
  if (!view) return <main className="app"><h1>📊 Báo cáo Ontime</h1><p>Đang tải dữ liệu…</p></main>;

  return (
    <main className="app">
      <header className="topbar">
        <h1>📊 NAK — Báo cáo Ontime giao hàng</h1>
      </header>
      <FilterBar options={opts} values={values} set={set} reset={reset} matchCount={ft.length} />
      {ft.length === 0 ? (
        <p className="empty">Không có dữ liệu khớp bộ lọc.</p>
      ) : (
        <section className="grid">
          <div className="full"><KpiCards kpi={view.kpi} /></div>
          <div className="card full"><TrendChart daily={view.daily} /></div>
          <div className="card half"><TypeBar byType={view.byType} /></div>
          <div className="card half"><CheckinDonut data={view.checkin} /></div>
          <div className="card full"><Heatmap heatmap={view.heatmap} onDrill={onDrill} /></div>
          <div className="card full"><TopTables top={view.top} onDrill={onDrill} /></div>
          <div className="card full"><TripDetail drill={drill} matchedTrips={matchedTrips} selected={selected} onSelect={(t) => setSelTrip(t.trip)} allStops={stops || []} /></div>
          <div className="card full"><VehicleCheckin rows={view.vehicle} /></div>
        </section>
      )}
    </main>
  );
}
