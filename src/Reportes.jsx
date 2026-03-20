// src/Reportes.jsx
// Módulo de Reportes para Sketch — Analytics completo
// Gráficas SVG, KPIs, ranking, comparativa, tabla exportable
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

const reportStyles = `
  .reportes-page {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  }
    
[data-theme="light"] .reportes-table tbody td { color: #374151; }

  .reportes-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px; border-bottom: 1px solid var(--border);
    background: var(--panel); animation: fadeDown 0.5s 0.1s ease both;
    flex-shrink: 0; gap: 12px; flex-wrap: wrap;
  }
  .reportes-topbar-left h1 {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--white);
  }
  .reportes-topbar-left p { font-size: 13px; color: var(--gray); margin-top: 2px; }

  .reportes-period-tabs {
    display: flex; gap: 4px; background: rgba(255,255,255,0.05);
    padding: 4px; border-radius: 10px;
  }
  .reportes-period-tab {
    padding: 8px 18px; border: none; background: transparent;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--gray);
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .reportes-period-tab.active {
    background: var(--blue); color: white;
    box-shadow: 0 2px 8px rgba(26,115,232,0.4);
  }
  .reportes-period-tab:hover:not(.active) { color: var(--light); background: rgba(255,255,255,0.05); }

  .reportes-content {
    flex: 1; overflow-y: auto; padding: 24px 28px;
    animation: fadeUp 0.4s ease both;
  }
  .reportes-content::-webkit-scrollbar { width: 4px; }
  .reportes-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ─── KPI Cards ─── */
  .reportes-kpis {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
  }
  .reportes-kpi {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .reportes-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .reportes-kpi::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .reportes-kpi.blue::before { background: linear-gradient(90deg, var(--blue), var(--sky)); }
  .reportes-kpi.green::before { background: linear-gradient(90deg, var(--green), #6ee7b7); }
  .reportes-kpi.orange::before { background: linear-gradient(90deg, var(--orange), #fbbf24); }
  .reportes-kpi.cyan::before { background: linear-gradient(90deg, var(--cyan), var(--sky)); }

  .reportes-kpi-top {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;
  }
  .reportes-kpi-label { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
  .reportes-kpi-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .reportes-kpi-icon.blue { background: rgba(26,115,232,0.15); }
  .reportes-kpi-icon.green { background: rgba(52,211,153,0.15); }
  .reportes-kpi-icon.orange { background: rgba(251,146,60,0.15); }
  .reportes-kpi-icon.cyan { background: rgba(52,216,232,0.15); }

  .reportes-kpi-value {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--white);
  }
  .reportes-kpi-change { font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .reportes-kpi-change.up { color: var(--green); }
  .reportes-kpi-change.down { color: var(--red); }
  .reportes-kpi-change.neutral { color: var(--gray); }

  /* ─── Charts grid ─── */
  .reportes-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;
  }

  .reportes-chart-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
  }
  .reportes-chart-title {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    color: var(--white); margin-bottom: 4px;
  }
  .reportes-chart-subtitle { font-size: 12px; color: var(--gray); margin-bottom: 16px; }

  /* SVG Charts */
  .reportes-chart-svg { width: 100%; overflow: visible; }
  .chart-grid-line { stroke: rgba(255,255,255,0.05); stroke-width: 1; }
  .chart-label { fill: var(--gray); font-size: 10px; font-family: 'DM Sans', sans-serif; }
  .chart-line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .chart-area { opacity: 0.15; }
  .chart-dot { stroke-width: 2; }
  .chart-bar { rx: 4; transition: opacity 0.2s; }
  .chart-bar:hover { opacity: 0.8; }

  /* ─── Top products ranking ─── */
  .reportes-ranking { display: flex; flex-direction: column; gap: 8px; }
  .reportes-rank-item {
    display: grid; grid-template-columns: 28px 1fr auto auto;
    align-items: center; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .reportes-rank-item:last-child { border-bottom: none; }
  .reportes-rank-num {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: var(--sky);
  }
  .reportes-rank-name { font-size: 13px; color: var(--light); font-weight: 500; }
  .reportes-rank-qty { font-size: 12px; color: var(--gray); }
  .reportes-rank-total {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--green);
  }

  /* ─── Table ─── */
  .reportes-table-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
  }
  .reportes-table-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .reportes-export-btn {
    padding: 8px 16px; background: linear-gradient(135deg, var(--green), #6ee7b7);
    border: none; border-radius: 8px; color: #0A1628;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .reportes-export-btn:hover { transform: translateY(-1px); }

  .reportes-table-wrap { overflow-x: auto; }
  .reportes-table {
    width: 100%; border-collapse: collapse;
  }
  .reportes-table thead th {
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--gray); padding: 0 12px 10px; text-align: left; font-weight: 500;
  }
  .reportes-table tbody tr {
    border-top: 1px solid var(--border); transition: background 0.15s;
  }
  .reportes-table tbody tr:hover { background: rgba(255,255,255,0.03); }
  .reportes-table tbody td {
    padding: 11px 12px; font-size: 13px; color: var(--light);
  }

  .reportes-empty {
    text-align: center; padding: 60px 20px; color: var(--gray);
  }

  @media (max-width: 900px) {
    .reportes-kpis { grid-template-columns: repeat(2, 1fr); }
    .reportes-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .reportes-content { padding: 16px; }
    .reportes-kpis { grid-template-columns: 1fr; }
  }
`

// ─── SVG Line Chart Component ───
function LineChart({ data, width = 500, height = 200 }) {
  if (!data || data.length === 0) return null
  const pad = { top: 20, right: 20, bottom: 30, left: 50 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom
  const maxY = Math.max(...data.map(d => d.value), 1)

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * w,
    y: pad.top + h - (d.value / maxY) * h
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + h} L${points[0].x},${pad.top + h} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="reportes-chart-svg">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--sky)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={i}>
          <line className="chart-grid-line" x1={pad.left} y1={pad.top + h * (1 - pct)} x2={pad.left + w} y2={pad.top + h * (1 - pct)} />
          <text className="chart-label" x={pad.left - 8} y={pad.top + h * (1 - pct) + 4} textAnchor="end">
            ${Math.round(maxY * pct)}
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} className="chart-label" x={points[i].x} y={height - 5} textAnchor="middle">{d.label}</text>
      ))}
      <path d={areaPath} fill="url(#lineGrad)" className="chart-area" />
      <path d={linePath} className="chart-line" stroke="var(--sky)" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--sky)" stroke="var(--card)" className="chart-dot" />
      ))}
    </svg>
  )
}

// ─── SVG Bar Chart Component ───
function BarChart({ data, width = 500, height = 200 }) {
  if (!data || data.length === 0) return null
  const pad = { top: 20, right: 20, bottom: 40, left: 50 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom
  const maxY = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min(40, (w / data.length) * 0.6)
  const gap = w / data.length

  const colors = ['var(--sky)', 'var(--cyan)', 'var(--green)', 'var(--orange)', 'var(--red)', '#a78bfa', '#f472b6', '#fbbf24']

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="reportes-chart-svg">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={i}>
          <line className="chart-grid-line" x1={pad.left} y1={pad.top + h * (1 - pct)} x2={pad.left + w} y2={pad.top + h * (1 - pct)} />
          <text className="chart-label" x={pad.left - 8} y={pad.top + h * (1 - pct) + 4} textAnchor="end">
            {Math.round(maxY * pct)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (d.value / maxY) * h
        const x = pad.left + gap * i + (gap - barW) / 2
        const y = pad.top + h - barH
        return (
          <g key={i}>
            <rect className="chart-bar" x={x} y={y} width={barW} height={barH} fill={colors[i % colors.length]} />
            <text className="chart-label" x={x + barW / 2} y={height - 8} textAnchor="middle" style={{ fontSize: '9px' }}>
              {d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════
// ── REPORTES COMPONENT ──
// ═══════════════════════════════════════
export default function Reportes({ onNavigate, user }) {
  const [period, setPeriod] = useState('semana') // semana, mes, trimestre
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchReportData = useCallback(async () => {
    setLoading(true)

    // Calculate date range
    const hoy = new Date()
    const inicio = new Date(hoy)
    const inicioAnterior = new Date(hoy)

    if (period === 'semana') {
      inicio.setDate(hoy.getDate() - 7)
      inicioAnterior.setDate(hoy.getDate() - 14)
    } else if (period === 'mes') {
      inicio.setDate(hoy.getDate() - 30)
      inicioAnterior.setDate(hoy.getDate() - 60)
    } else {
      inicio.setDate(hoy.getDate() - 90)
      inicioAnterior.setDate(hoy.getDate() - 180)
    }

    // Fetch current period sales
    const { data: ventasActuales } = await supabase
      .from('ventas')
      .select('*, venta_detalles(*)')
      .gte('created_at', inicio.toISOString())
      .order('created_at', { ascending: true })

    // Fetch previous period sales (for comparison)
    const { data: ventasAnteriores } = await supabase
      .from('ventas')
      .select('*, venta_detalles(*)')
      .gte('created_at', inicioAnterior.toISOString())
      .lt('created_at', inicio.toISOString())

    const ventas = ventasActuales || []
    const ventasPrev = ventasAnteriores || []

    // ─── KPIs ───
    const totalIngresos = ventas.reduce((s, v) => s + Number(v.total), 0)
    const totalVentas = ventas.length
    const totalProductos = ventas.reduce((s, v) => s + v.num_productos, 0)
    const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0

    const prevIngresos = ventasPrev.reduce((s, v) => s + Number(v.total), 0)
    const prevVentas = ventasPrev.length
    const prevTicket = prevVentas > 0 ? prevIngresos / prevVentas : 0

    const cambioIngresos = prevIngresos > 0 ? ((totalIngresos - prevIngresos) / prevIngresos * 100).toFixed(1) : null
    const cambioVentas = prevVentas > 0 ? ((totalVentas - prevVentas) / prevVentas * 100).toFixed(1) : null
    const cambioTicket = prevTicket > 0 ? ((ticketPromedio - prevTicket) / prevTicket * 100).toFixed(1) : null

    // ─── Sales by day (line chart) ───
    const ventasPorDia = {}
    ventas.forEach(v => {
      const dia = new Date(v.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + Number(v.total)
    })

    const lineData = Object.entries(ventasPorDia).map(([label, value]) => ({ label, value }))

    // ─── Top products (bar chart + ranking) ───
    const productMap = {}
    ventas.forEach(v => {
      (v.venta_detalles || []).forEach(d => {
        const key = d.nombre_producto
        if (!productMap[key]) productMap[key] = { nombre: key, cantidad: 0, total: 0 }
        productMap[key].cantidad += d.cantidad
        productMap[key].total += Number(d.subtotal || d.precio_unitario * d.cantidad)
      })
    })
    const topProducts = Object.values(productMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8)
    const barData = topProducts.slice(0, 6).map(p => ({ label: p.nombre, value: p.cantidad }))

    // ─── Detail table ───
    const tableData = ventas.map(v => ({
      id: v.id,
      fecha: new Date(v.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: new Date(v.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      productos: v.num_productos,
      detalles: (v.venta_detalles || []).map(d => d.nombre_producto).join(', '),
      total: Number(v.total),
      pago: Number(v.pago),
      cambio: Number(v.cambio),
    }))

    setData({
      totalIngresos, totalVentas, totalProductos, ticketPromedio,
      cambioIngresos, cambioVentas, cambioTicket,
      prevIngresos, prevVentas,
      lineData, barData, topProducts, tableData
    })
    setLoading(false)
  }, [period])

  useEffect(() => { fetchReportData() }, [fetchReportData])

  const fmt = (n) => `$${(n || 0).toFixed(2)}`
  const fmtK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(2)}`

  const exportCSV = () => {
    if (!data || !data.tableData.length) return
    const headers = 'Fecha,Hora,Productos,Detalle,Total,Pago,Cambio\n'
    const rows = data.tableData.map(r =>
      `${r.fecha},${r.hora},${r.productos},"${r.detalles}",${r.total},${r.pago},${r.cambio}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periodLabel = period === 'semana' ? 'últimos 7 días' : period === 'mes' ? 'últimos 30 días' : 'últimos 90 días'
  const prevLabel = period === 'semana' ? 'semana anterior' : period === 'mes' ? 'mes anterior' : 'trimestre anterior'

  return (
    <>
      <style>{reportStyles}</style>
      <div className="reportes-page">
        <div className="reportes-topbar">
          <div className="reportes-topbar-left">
            <h1>📈 Reportes</h1>
            <p>Análisis de {periodLabel}</p>
          </div>
          <div className="reportes-period-tabs">
            {[
              { id: 'semana', label: '7 días' },
              { id: 'mes', label: '30 días' },
              { id: 'trimestre', label: '90 días' },
            ].map(t => (
              <button key={t.id} className={`reportes-period-tab${period === t.id ? ' active' : ''}`}
                onClick={() => setPeriod(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reportes-content">
          {loading ? (
            <div className="reportes-empty">Generando reporte...</div>
          ) : !data ? (
            <div className="reportes-empty">Error al cargar datos</div>
          ) : (
            <>
              {/* ═══ KPIs ═══ */}
              <div className="reportes-kpis">
                <div className="reportes-kpi green">
                  <div className="reportes-kpi-top">
                    <span className="reportes-kpi-label">Ingresos</span>
                    <div className="reportes-kpi-icon green">💰</div>
                  </div>
                  <div className="reportes-kpi-value">{fmtK(data.totalIngresos)}</div>
                  <div className={`reportes-kpi-change ${data.cambioIngresos > 0 ? 'up' : data.cambioIngresos < 0 ? 'down' : 'neutral'}`}>
                    {data.cambioIngresos ? `${data.cambioIngresos > 0 ? '↑' : '↓'} ${Math.abs(data.cambioIngresos)}% vs ${prevLabel}` : `Anterior: ${fmtK(data.prevIngresos)}`}
                  </div>
                </div>

                <div className="reportes-kpi blue">
                  <div className="reportes-kpi-top">
                    <span className="reportes-kpi-label">Ventas</span>
                    <div className="reportes-kpi-icon blue">🛒</div>
                  </div>
                  <div className="reportes-kpi-value">{data.totalVentas}</div>
                  <div className={`reportes-kpi-change ${data.cambioVentas > 0 ? 'up' : data.cambioVentas < 0 ? 'down' : 'neutral'}`}>
                    {data.cambioVentas ? `${data.cambioVentas > 0 ? '↑' : '↓'} ${Math.abs(data.cambioVentas)}% vs ${prevLabel}` : `Anterior: ${data.prevVentas}`}
                  </div>
                </div>

                <div className="reportes-kpi orange">
                  <div className="reportes-kpi-top">
                    <span className="reportes-kpi-label">Productos vendidos</span>
                    <div className="reportes-kpi-icon orange">📦</div>
                  </div>
                  <div className="reportes-kpi-value">{data.totalProductos}</div>
                  <div className="reportes-kpi-change neutral">En {data.totalVentas} transacciones</div>
                </div>

                <div className="reportes-kpi cyan">
                  <div className="reportes-kpi-top">
                    <span className="reportes-kpi-label">Ticket promedio</span>
                    <div className="reportes-kpi-icon cyan">🎫</div>
                  </div>
                  <div className="reportes-kpi-value">{fmt(data.ticketPromedio)}</div>
                  <div className={`reportes-kpi-change ${data.cambioTicket > 0 ? 'up' : data.cambioTicket < 0 ? 'down' : 'neutral'}`}>
                    {data.cambioTicket ? `${data.cambioTicket > 0 ? '↑' : '↓'} ${Math.abs(data.cambioTicket)}% vs ${prevLabel}` : 'Sin datos previos'}
                  </div>
                </div>
              </div>

              {/* ═══ Charts ═══ */}
              <div className="reportes-grid">
                {/* Line chart — Sales over time */}
                <div className="reportes-chart-card">
                  <div className="reportes-chart-title">📈 Ventas en el tiempo</div>
                  <div className="reportes-chart-subtitle">Ingresos diarios — {periodLabel}</div>
                  {data.lineData.length > 0 ? (
                    <LineChart data={data.lineData} />
                  ) : (
                    <div className="reportes-empty" style={{ padding: 30 }}>Sin datos de ventas en este período</div>
                  )}
                </div>

                {/* Bar chart — Top products */}
                <div className="reportes-chart-card">
                  <div className="reportes-chart-title">🏆 Productos más vendidos</div>
                  <div className="reportes-chart-subtitle">Por cantidad — {periodLabel}</div>
                  {data.barData.length > 0 ? (
                    <BarChart data={data.barData} />
                  ) : (
                    <div className="reportes-empty" style={{ padding: 30 }}>Sin datos</div>
                  )}
                </div>
              </div>

              {/* ═══ Top Products Ranking ═══ */}
              {data.topProducts.length > 0 && (
                <div className="reportes-chart-card" style={{ marginBottom: 20 }}>
                  <div className="reportes-chart-title">🥇 Ranking de productos</div>
                  <div className="reportes-chart-subtitle">Top {data.topProducts.length} más vendidos — {periodLabel}</div>
                  <div className="reportes-ranking">
                    {data.topProducts.map((p, i) => (
                      <div key={i} className="reportes-rank-item">
                        <span className="reportes-rank-num">#{i + 1}</span>
                        <span className="reportes-rank-name">{p.nombre}</span>
                        <span className="reportes-rank-qty">{p.cantidad} uds</span>
                        <span className="reportes-rank-total">{fmt(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ Detail Table ═══ */}
              <div className="reportes-table-card">
                <div className="reportes-table-header">
                  <div>
                    <div className="reportes-chart-title">📋 Detalle de ventas</div>
                    <div className="reportes-chart-subtitle">{data.tableData.length} registros — {periodLabel}</div>
                  </div>
                  {data.tableData.length > 0 && (
                    <button className="reportes-export-btn" onClick={exportCSV}>
                      📥 Exportar CSV
                    </button>
                  )}
                </div>
                {data.tableData.length === 0 ? (
                  <div className="reportes-empty" style={{ padding: 30 }}>Sin ventas registradas en este período</div>
                ) : (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Productos</th>
                          <th>Detalle</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.tableData.slice(0, 50).map((r, i) => (
                          <tr key={i}>
                            <td>{r.fecha}</td>
                            <td style={{ color: 'var(--sky)' }}>{r.hora}</td>
                            <td>{r.productos}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detalles}</td>
                            <td style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--green)' }}>{fmt(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.tableData.length > 50 && (
                      <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--gray)' }}>
                        Mostrando 50 de {data.tableData.length} registros. Exporte CSV para ver todos.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}