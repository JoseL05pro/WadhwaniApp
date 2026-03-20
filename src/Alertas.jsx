// src/Alertas.jsx
// Módulo de Alertas para Sketch — Mismo design system que Dashboard
// 4 tipos: Stock bajo, Agotados, Sin movimiento, Próximos a vencer
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

const alertasStyles = `
  .alertas-page {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  }

[data-theme="light"] .alertas-item { background: #fff; }

  .alertas-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px; border-bottom: 1px solid var(--border);
    background: var(--panel); animation: fadeDown 0.5s 0.1s ease both;
    flex-shrink: 0; gap: 12px; flex-wrap: wrap;
  }
  .alertas-topbar-left h1 {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--white);
  }
  .alertas-topbar-left p { font-size: 13px; color: var(--gray); margin-top: 2px; }

  .alertas-filters {
    display: flex; gap: 4px; background: rgba(255,255,255,0.05);
    padding: 4px; border-radius: 10px; flex-wrap: wrap;
  }
  .alertas-filter {
    padding: 7px 14px; border: none; background: transparent;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 500; color: var(--gray);
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
    display: flex; align-items: center; gap: 6px;
  }
  .alertas-filter.active {
    background: var(--blue); color: white;
    box-shadow: 0 2px 8px rgba(26,115,232,0.4);
  }
  .alertas-filter:hover:not(.active) { color: var(--light); background: rgba(255,255,255,0.05); }
  .alertas-filter-count {
    font-size: 10px; font-weight: 700; padding: 2px 6px;
    border-radius: 10px; min-width: 18px; text-align: center;
  }
  .alertas-filter.active .alertas-filter-count {
    background: rgba(255,255,255,0.2); color: white;
  }
  .alertas-filter:not(.active) .alertas-filter-count {
    background: rgba(255,255,255,0.08); color: var(--gray);
  }

  .alertas-content {
    flex: 1; overflow-y: auto; padding: 24px 28px;
    animation: fadeUp 0.4s ease both;
  }
  .alertas-content::-webkit-scrollbar { width: 4px; }
  .alertas-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ─── Summary cards ─── */
  .alertas-summary {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }
  .alertas-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
  }
  .alertas-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .alertas-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .alertas-card.red::before { background: linear-gradient(90deg, var(--red), #fca5a5); }
  .alertas-card.orange::before { background: linear-gradient(90deg, var(--orange), #fbbf24); }
  .alertas-card.blue::before { background: linear-gradient(90deg, var(--blue), var(--sky)); }
  .alertas-card.green::before { background: linear-gradient(90deg, var(--green), #6ee7b7); }

  .alertas-card-top {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;
  }
  .alertas-card-label {
    font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px;
  }
  .alertas-card-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .alertas-card-icon.red { background: rgba(248,113,113,0.15); }
  .alertas-card-icon.orange { background: rgba(251,146,60,0.15); }
  .alertas-card-icon.blue { background: rgba(91,184,245,0.15); }
  .alertas-card-icon.green { background: rgba(52,211,153,0.15); }

  .alertas-card-value {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--white);
  }
  .alertas-card-sub { font-size: 12px; color: var(--gray); margin-top: 4px; }

  /* ─── Alert items ─── */
  .alertas-section-title {
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
    color: var(--white); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }
  .alertas-section-count {
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
    font-weight: 600;
  }

  .alertas-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }

  .alertas-item {
    display: grid; grid-template-columns: auto 1fr auto auto;
    align-items: center; gap: 14px;
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 16px 20px; transition: all 0.2s;
  }
  .alertas-item:hover { border-color: rgba(91,184,245,0.2); transform: translateY(-1px); }

  .alertas-item-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .alertas-item-dot.red { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .alertas-item-dot.orange { background: var(--orange); box-shadow: 0 0 8px var(--orange); }
  .alertas-item-dot.blue { background: var(--sky); box-shadow: 0 0 8px var(--sky); }
  .alertas-item-dot.green { background: var(--green); box-shadow: 0 0 8px var(--green); }

  .alertas-item-info { min-width: 0; }
  .alertas-item-name { font-size: 14px; font-weight: 500; color: var(--light); }
  .alertas-item-detail { font-size: 12px; color: var(--gray); margin-top: 2px; }

  .alertas-item-stock {
    text-align: center; min-width: 60px;
  }
  .alertas-item-stock-value {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
  }
  .alertas-item-stock-value.red { color: var(--red); }
  .alertas-item-stock-value.orange { color: var(--orange); }
  .alertas-item-stock-value.blue { color: var(--sky); }
  .alertas-item-stock-label {
    font-size: 10px; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px;
  }

  .alertas-item-badge {
    font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 8px; white-space: nowrap;
  }
  .alertas-item-badge.red { background: rgba(248,113,113,0.12); color: var(--red); }
  .alertas-item-badge.orange { background: rgba(251,146,60,0.12); color: var(--orange); }
  .alertas-item-badge.blue { background: rgba(91,184,245,0.12); color: var(--sky); }
  .alertas-item-badge.green { background: rgba(52,211,153,0.12); color: var(--green); }

  .alertas-empty {
    text-align: center; padding: 60px 20px; color: var(--gray);
  }
  .alertas-empty-icon { font-size: 48px; margin-bottom: 12px; display: block; }
  .alertas-empty-title {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 6px;
  }

  @media (max-width: 900px) {
    .alertas-summary { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .alertas-content { padding: 16px; }
    .alertas-summary { grid-template-columns: 1fr; }
    .alertas-item { grid-template-columns: auto 1fr auto; }
    .alertas-item-stock { display: none; }
    .alertas-filters { overflow-x: auto; flex-wrap: nowrap; }
  }
`

const DIAS_SIN_MOVIMIENTO = 7 // Días sin venderse para considerarse "sin movimiento"
const DIAS_VENCIMIENTO = 30 // Días para considerar "próximo a vencer"

export default function Alertas({ onNavigate, user }) {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('todas') // todas, agotados, stockBajo, sinMov, vencer
  const [alertas, setAlertas] = useState({ agotados: [], stockBajo: [], sinMovimiento: [], porVencer: [] })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch products
    const { data: prods } = await supabase.from('productos').select('*').order('stock', { ascending: true })
    const productos = prods || []
    setProducts(productos)

    // Fetch last sales per product (to detect "sin movimiento")
    const diasAtras = new Date()
    diasAtras.setDate(diasAtras.getDate() - DIAS_SIN_MOVIMIENTO)

    const { data: ventasRecientes } = await supabase
      .from('venta_detalles')
      .select('producto_id, created_at')
      .gte('created_at', diasAtras.toISOString())

    // Products that sold recently
    const productoConVenta = new Set((ventasRecientes || []).map(v => v.producto_id))

    // ─── Classify alerts ───
    const agotados = productos.filter(p => p.stock <= 0)
    const stockBajo = productos.filter(p => p.stock > 0 && p.stock <= (p.stock_minimo || 5))
    const sinMovimiento = productos.filter(p => p.stock > 0 && !productoConVenta.has(p.id))
    const porVencer = productos.filter(p => {
      if (!p.fecha_vencimiento) return false
      const vence = new Date(p.fecha_vencimiento)
      const hoy = new Date()
      const diasRestantes = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
      return diasRestantes >= 0 && diasRestantes <= DIAS_VENCIMIENTO
    })

    setAlertas({ agotados, stockBajo, sinMovimiento, porVencer })
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalAlertas = alertas.agotados.length + alertas.stockBajo.length + alertas.sinMovimiento.length + alertas.porVencer.length

  const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  // Días restantes para vencimiento
  const diasParaVencer = (fecha) => {
    if (!fecha) return 999
    return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
  }

  // What to show based on filter
  const showAgotados = filter === 'todas' || filter === 'agotados'
  const showBajo = filter === 'todas' || filter === 'stockBajo'
  const showSinMov = filter === 'todas' || filter === 'sinMov'
  const showVencer = filter === 'todas' || filter === 'vencer'

  return (
    <>
      <style>{alertasStyles}</style>
      <div className="alertas-page">
        {/* Topbar */}
        <div className="alertas-topbar">
          <div className="alertas-topbar-left">
            <h1>🔔 Alertas</h1>
            <p>{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} activa{totalAlertas !== 1 ? 's' : ''}</p>
          </div>
          <div className="alertas-filters">
            {[
              { id: 'todas', label: 'Todas', count: totalAlertas },
              { id: 'agotados', label: '🚨 Agotados', count: alertas.agotados.length },
              { id: 'stockBajo', label: '⚠️ Stock bajo', count: alertas.stockBajo.length },
              { id: 'sinMov', label: '💤 Sin movimiento', count: alertas.sinMovimiento.length },
              { id: 'vencer', label: '📅 Por vencer', count: alertas.porVencer.length },
            ].map(f => (
              <button key={f.id}
                className={`alertas-filter${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}>
                {f.label}
                <span className="alertas-filter-count">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="alertas-content">
          {loading ? (
            <div className="alertas-empty">Cargando alertas...</div>
          ) : totalAlertas === 0 ? (
            <div className="alertas-empty">
              <span className="alertas-empty-icon">✅</span>
              <div className="alertas-empty-title">Sin alertas</div>
              <p>Todo está en orden. No hay productos con problemas de stock, sin movimiento ni próximos a vencer.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="alertas-summary">
                <div className={`alertas-card red`} onClick={() => setFilter('agotados')}>
                  <div className="alertas-card-top">
                    <span className="alertas-card-label">Agotados</span>
                    <div className="alertas-card-icon red">🚨</div>
                  </div>
                  <div className="alertas-card-value">{alertas.agotados.length}</div>
                  <div className="alertas-card-sub">{alertas.agotados.length > 0 ? 'Reabastecer urgente' : 'Todo en stock'}</div>
                </div>

                <div className={`alertas-card orange`} onClick={() => setFilter('stockBajo')}>
                  <div className="alertas-card-top">
                    <span className="alertas-card-label">Stock bajo</span>
                    <div className="alertas-card-icon orange">⚠️</div>
                  </div>
                  <div className="alertas-card-value">{alertas.stockBajo.length}</div>
                  <div className="alertas-card-sub">{alertas.stockBajo.length > 0 ? 'Bajo el mínimo' : 'Niveles normales'}</div>
                </div>

                <div className={`alertas-card blue`} onClick={() => setFilter('sinMov')}>
                  <div className="alertas-card-top">
                    <span className="alertas-card-label">Sin movimiento</span>
                    <div className="alertas-card-icon blue">💤</div>
                  </div>
                  <div className="alertas-card-value">{alertas.sinMovimiento.length}</div>
                  <div className="alertas-card-sub">{alertas.sinMovimiento.length > 0 ? `Sin ventas en ${DIAS_SIN_MOVIMIENTO} días` : 'Todo se mueve'}</div>
                </div>

                <div className={`alertas-card green`} onClick={() => setFilter('vencer')}>
                  <div className="alertas-card-top">
                    <span className="alertas-card-label">Por vencer</span>
                    <div className="alertas-card-icon green">📅</div>
                  </div>
                  <div className="alertas-card-value">{alertas.porVencer.length}</div>
                  <div className="alertas-card-sub">{alertas.porVencer.length > 0 ? `En próximos ${DIAS_VENCIMIENTO} días` : 'Sin vencimientos'}</div>
                </div>
              </div>

              {/* ═══ AGOTADOS ═══ */}
              {showAgotados && alertas.agotados.length > 0 && (
                <>
                  <div className="alertas-section-title">
                    🚨 Productos agotados
                    <span className="alertas-section-count" style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--red)' }}>
                      {alertas.agotados.length}
                    </span>
                  </div>
                  <div className="alertas-list">
                    {alertas.agotados.map(p => (
                      <div key={p.id} className="alertas-item">
                        <div className="alertas-item-dot red" />
                        <div className="alertas-item-info">
                          <div className="alertas-item-name">{p.nombre}</div>
                          <div className="alertas-item-detail">{p.categoria || 'General'} • Precio: ${p.precio?.toFixed(2)} • Mín: {p.stock_minimo || 5}</div>
                        </div>
                        <div className="alertas-item-stock">
                          <div className="alertas-item-stock-value red">0</div>
                          <div className="alertas-item-stock-label">Stock</div>
                        </div>
                        <span className="alertas-item-badge red">Agotado</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ═══ STOCK BAJO ═══ */}
              {showBajo && alertas.stockBajo.length > 0 && (
                <>
                  <div className="alertas-section-title">
                    ⚠️ Stock bajo
                    <span className="alertas-section-count" style={{ background: 'rgba(251,146,60,0.12)', color: 'var(--orange)' }}>
                      {alertas.stockBajo.length}
                    </span>
                  </div>
                  <div className="alertas-list">
                    {alertas.stockBajo.map(p => (
                      <div key={p.id} className="alertas-item">
                        <div className="alertas-item-dot orange" />
                        <div className="alertas-item-info">
                          <div className="alertas-item-name">{p.nombre}</div>
                          <div className="alertas-item-detail">{p.categoria || 'General'} • Precio: ${p.precio?.toFixed(2)} • Mín: {p.stock_minimo || 5}</div>
                        </div>
                        <div className="alertas-item-stock">
                          <div className="alertas-item-stock-value orange">{p.stock}</div>
                          <div className="alertas-item-stock-label">Stock</div>
                        </div>
                        <span className="alertas-item-badge orange">Bajo mínimo</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ═══ SIN MOVIMIENTO ═══ */}
              {showSinMov && alertas.sinMovimiento.length > 0 && (
                <>
                  <div className="alertas-section-title">
                    💤 Sin movimiento ({DIAS_SIN_MOVIMIENTO} días)
                    <span className="alertas-section-count" style={{ background: 'rgba(91,184,245,0.12)', color: 'var(--sky)' }}>
                      {alertas.sinMovimiento.length}
                    </span>
                  </div>
                  <div className="alertas-list">
                    {alertas.sinMovimiento.map(p => (
                      <div key={p.id} className="alertas-item">
                        <div className="alertas-item-dot blue" />
                        <div className="alertas-item-info">
                          <div className="alertas-item-name">{p.nombre}</div>
                          <div className="alertas-item-detail">{p.categoria || 'General'} • {p.stock} uds en stock • Sin ventas en {DIAS_SIN_MOVIMIENTO}+ días</div>
                        </div>
                        <div className="alertas-item-stock">
                          <div className="alertas-item-stock-value blue">{p.stock}</div>
                          <div className="alertas-item-stock-label">Stock</div>
                        </div>
                        <span className="alertas-item-badge blue">Sin ventas</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ═══ PRÓXIMOS A VENCER ═══ */}
              {showVencer && alertas.porVencer.length > 0 && (
                <>
                  <div className="alertas-section-title">
                    📅 Próximos a vencer
                    <span className="alertas-section-count" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--green)' }}>
                      {alertas.porVencer.length}
                    </span>
                  </div>
                  <div className="alertas-list">
                    {alertas.porVencer.sort((a, b) => diasParaVencer(a.fecha_vencimiento) - diasParaVencer(b.fecha_vencimiento)).map(p => {
                      const dias = diasParaVencer(p.fecha_vencimiento)
                      const color = dias <= 7 ? 'red' : dias <= 15 ? 'orange' : 'green'
                      return (
                        <div key={p.id} className="alertas-item">
                          <div className={`alertas-item-dot ${color}`} />
                          <div className="alertas-item-info">
                            <div className="alertas-item-name">{p.nombre}</div>
                            <div className="alertas-item-detail">{p.categoria || 'General'} • {p.stock} uds • Vence: {fmtDate(p.fecha_vencimiento)}</div>
                          </div>
                          <div className="alertas-item-stock">
                            <div className={`alertas-item-stock-value ${color}`}>{dias}</div>
                            <div className="alertas-item-stock-label">Días</div>
                          </div>
                          <span className={`alertas-item-badge ${color}`}>
                            {dias <= 0 ? 'Vencido' : dias <= 7 ? 'Urgente' : dias <= 15 ? 'Pronto' : `${dias} días`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}