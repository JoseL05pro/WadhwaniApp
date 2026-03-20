// src/Ganancias.jsx
// Módulo de Ganancias — Calculadora de costos vs ventas, márgenes, rentabilidad
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

const ganStyles = `
  .gan-page {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  }

  .gan-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px; border-bottom: 1px solid var(--border);
    background: var(--panel); animation: fadeDown 0.5s 0.1s ease both;
    flex-shrink: 0; gap: 12px; flex-wrap: wrap;
  }
  .gan-topbar-left h1 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--white); }
  .gan-topbar-left p { font-size: 13px; color: var(--gray); margin-top: 2px; }

  .gan-content {
    flex: 1; overflow-y: auto; padding: 24px 28px;
    animation: fadeUp 0.4s ease both;
  }
  .gan-content::-webkit-scrollbar { width: 4px; }
  .gan-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* KPIs */
  .gan-kpis {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }
  .gan-kpi {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .gan-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .gan-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .gan-kpi.green::before { background: linear-gradient(90deg, var(--green), #6ee7b7); }
  .gan-kpi.blue::before { background: linear-gradient(90deg, var(--blue), var(--sky)); }
  .gan-kpi.orange::before { background: linear-gradient(90deg, var(--orange), #fbbf24); }
  .gan-kpi.cyan::before { background: linear-gradient(90deg, var(--cyan), var(--sky)); }

  .gan-kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .gan-kpi-label { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
  .gan-kpi-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .gan-kpi-icon.green { background: rgba(52,211,153,0.15); }
  .gan-kpi-icon.blue { background: rgba(26,115,232,0.15); }
  .gan-kpi-icon.orange { background: rgba(251,146,60,0.15); }
  .gan-kpi-icon.cyan { background: rgba(52,216,232,0.15); }

  .gan-kpi-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--white); }
  .gan-kpi.green .gan-kpi-value { color: var(--green); }
  .gan-kpi-sub { font-size: 12px; color: var(--gray); margin-top: 4px; }

  /* Sections */
  .gan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }

  .gan-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
  }
  .gan-card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 4px; }
  .gan-card-subtitle { font-size: 12px; color: var(--gray); margin-bottom: 16px; }

  /* Product profit table */
  .gan-table-wrap { overflow-x: auto; }
  .gan-table { width: 100%; border-collapse: collapse; }
  .gan-table thead th {
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--gray); padding: 0 12px 10px; text-align: left; font-weight: 500;
  }
  .gan-table tbody tr { border-top: 1px solid var(--border); transition: background 0.15s; }
  .gan-table tbody tr:hover { background: rgba(255,255,255,0.03); }
  .gan-table tbody td { padding: 11px 12px; font-size: 13px; color: var(--light); }

  .gan-profit-positive { color: var(--green); font-family: 'Syne', sans-serif; font-weight: 700; }
  .gan-profit-negative { color: var(--red); font-family: 'Syne', sans-serif; font-weight: 700; }
  .gan-margin-badge {
    font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
  }
  .gan-margin-badge.high { background: rgba(52,211,153,0.12); color: var(--green); }
  .gan-margin-badge.medium { background: rgba(251,146,60,0.12); color: var(--orange); }
  .gan-margin-badge.low { background: rgba(248,113,113,0.12); color: var(--red); }
  .gan-margin-badge.none { background: rgba(138,155,191,0.12); color: var(--gray); }

  /* Cost editor */
  .gan-cost-input {
    width: 80px; padding: 5px 8px; background: rgba(255,255,255,0.06);
    border: 1px solid var(--border); border-radius: 6px; color: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
    transition: all 0.2s; text-align: right;
  }
  .gan-cost-input:focus { border-color: var(--sky); background: rgba(91,184,245,0.06); }
  [data-theme="light"] .gan-cost-input { color: #1A1A2E; }

  .gan-save-btn {
    padding: 4px 10px; border-radius: 6px; border: none;
    background: var(--green); color: #0A1628;
    font-size: 11px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
    opacity: 0; transition: opacity 0.2s;
  }
  .gan-cost-row:hover .gan-save-btn { opacity: 1; }
  .gan-save-btn:hover { transform: translateY(-1px); }

  /* Category profit */
  .gan-cat-item {
    display: grid; grid-template-columns: 1fr auto auto auto;
    align-items: center; gap: 12px; padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .gan-cat-item:last-child { border-bottom: none; }
  .gan-cat-name { font-size: 13px; font-weight: 500; color: var(--light); }
  .gan-cat-products { font-size: 11px; color: var(--gray); }
  .gan-cat-margin { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; }
  .gan-cat-profit { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--green); }

  /* Bar visualization */
  .gan-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .gan-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .gan-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
  .gan-bar-label { font-size: 11px; color: var(--gray); min-width: 40px; text-align: right; }

  .gan-empty { text-align: center; padding: 40px; color: var(--gray); font-size: 13px; }

  .gan-tip {
    margin-top: 16px; padding: 14px 16px;
    background: rgba(52,216,232,0.06); border: 1px solid rgba(52,216,232,0.15);
    border-radius: 12px; font-size: 12px; color: var(--cyan); line-height: 1.5;
  }

  /* Notifications */
  .gan-notif-section { margin-bottom: 20px; }
  .gan-notif-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; margin-bottom: 8px; animation: fadeUp 0.3s ease;
  }
  .gan-notif-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite; }
  .gan-notif-dot.red { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .gan-notif-dot.orange { background: var(--orange); box-shadow: 0 0 8px var(--orange); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .gan-notif-text { font-size: 13px; color: var(--light); flex: 1; }
  .gan-notif-time { font-size: 11px; color: var(--gray); white-space: nowrap; }

  @media (max-width: 900px) {
    .gan-kpis { grid-template-columns: repeat(2, 1fr); }
    .gan-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .gan-content { padding: 16px; }
    .gan-kpis { grid-template-columns: 1fr; }
  }
`

export default function Ganancias({ onNavigate, user }) {
  const [products, setProducts] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCost, setEditingCost] = useState({}) // { id: value }
  const [notifications, setNotifications] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: prods } = await supabase.from('productos').select('*').order('nombre')
    setProducts(prods || [])

    // Fetch last 30 days sales
    const desde = new Date()
    desde.setDate(desde.getDate() - 30)
    const { data: ventasData } = await supabase
      .from('venta_detalles')
      .select('producto_id, nombre_producto, cantidad, precio_unitario, subtotal, created_at')
      .gte('created_at', desde.toISOString())
    setVentas(ventasData || [])

    // Generate notifications
    const notifs = []
    ;(prods || []).forEach(p => {
      if (p.stock <= 0) {
        notifs.push({ type: 'red', text: `${p.nombre} está agotado. Reabastecer urgente.`, time: 'Ahora' })
      } else if (p.stock <= (p.stock_minimo || 5)) {
        notifs.push({ type: 'orange', text: `${p.nombre} tiene solo ${p.stock} unidades. Stock bajo.`, time: 'Ahora' })
      }
    })
    setNotifications(notifs)

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Send push notifications for critical items
    if ('Notification' in window && Notification.permission === 'granted') {
      const agotados = (prods || []).filter(p => p.stock <= 0)
      if (agotados.length > 0) {
        new Notification('⚠️ Sketch — Productos agotados', {
          body: `${agotados.length} producto${agotados.length > 1 ? 's' : ''} sin stock: ${agotados.slice(0, 3).map(p => p.nombre).join(', ')}`,
          icon: '📦',
          tag: 'sketch-stock-alert'
        })
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Save cost for a product
  const saveCost = async (productId) => {
    const newCost = parseFloat(editingCost[productId])
    if (isNaN(newCost) || newCost < 0) return

    await supabase.from('productos').update({ costo: newCost }).eq('id', productId)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, costo: newCost } : p))
    setEditingCost(prev => { const n = { ...prev }; delete n[productId]; return n })
  }

  // Calculations
  const fmt = (n) => `$${(n || 0).toFixed(2)}`
  const fmtK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : fmt(n)

  const productProfits = products.map(p => {
    const costo = p.costo || 0
    const precio = p.precio || 0
    const ganancia = precio - costo
    const margen = precio > 0 ? ((ganancia / precio) * 100) : 0
    const gananciaTotal = ganancia * (p.stock || 0)

    // Sales data
    const ventasProducto = ventas.filter(v => v.producto_id === p.id)
    const unidadesVendidas = ventasProducto.reduce((s, v) => s + v.cantidad, 0)
    const ingresoVentas = ventasProducto.reduce((s, v) => s + Number(v.subtotal || v.precio_unitario * v.cantidad), 0)
    const costoVentas = unidadesVendidas * costo
    const gananciaVentas = ingresoVentas - costoVentas

    return {
      ...p, costo, ganancia, margen, gananciaTotal,
      unidadesVendidas, ingresoVentas, costoVentas, gananciaVentas,
      margenLevel: costo === 0 ? 'none' : margen >= 40 ? 'high' : margen >= 20 ? 'medium' : 'low'
    }
  }).sort((a, b) => b.gananciaVentas - a.gananciaVentas)

  const totalInversion = products.reduce((s, p) => s + ((p.costo || 0) * (p.stock || 0)), 0)
  const totalValorVenta = products.reduce((s, p) => s + ((p.precio || 0) * (p.stock || 0)), 0)
  const totalGananciaStock = totalValorVenta - totalInversion
  const margenPromedio = totalValorVenta > 0 ? ((totalGananciaStock / totalValorVenta) * 100) : 0

  const totalIngresoVentas = productProfits.reduce((s, p) => s + p.ingresoVentas, 0)
  const totalCostoVentas = productProfits.reduce((s, p) => s + p.costoVentas, 0)
  const totalGananciaVentas = totalIngresoVentas - totalCostoVentas

  // By category
  const catMap = {}
  productProfits.forEach(p => {
    const cat = p.categoria || 'General'
    if (!catMap[cat]) catMap[cat] = { productos: 0, ingresos: 0, costos: 0, ganancia: 0 }
    catMap[cat].productos++
    catMap[cat].ingresos += p.ingresoVentas
    catMap[cat].costos += p.costoVentas
    catMap[cat].ganancia += p.gananciaVentas
  })
  const categories = Object.entries(catMap).sort((a, b) => b[1].ganancia - a[1].ganancia)
  const maxCatGanancia = Math.max(...categories.map(([, d]) => d.ganancia), 1)

  const productsWithoutCost = products.filter(p => !p.costo || p.costo === 0).length

  return (
    <>
      <style>{ganStyles}</style>
      <div className="gan-page">
        <div className="gan-topbar">
          <div className="gan-topbar-left">
            <h1>💹 Ganancias</h1>
            <p>Análisis de rentabilidad y márgenes</p>
          </div>
        </div>

        <div className="gan-content">
          {loading ? (
            <div className="gan-empty">Calculando ganancias...</div>
          ) : (
            <>
              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="gan-notif-section">
                  {notifications.slice(0, 5).map((n, i) => (
                    <div key={i} className="gan-notif-item">
                      <div className={`gan-notif-dot ${n.type}`} />
                      <span className="gan-notif-text">{n.text}</span>
                      <span className="gan-notif-time">{n.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warning if missing costs */}
              {productsWithoutCost > 0 && (
                <div className="gan-tip" style={{ marginBottom: 16, borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.06)', color: 'var(--orange)' }}>
                  ⚠️ {productsWithoutCost} producto{productsWithoutCost > 1 ? 's' : ''} sin precio de costo registrado. Agrega el costo en la tabla de abajo para calcular ganancias reales.
                </div>
              )}

              {/* KPIs */}
              <div className="gan-kpis">
                <div className="gan-kpi green">
                  <div className="gan-kpi-top">
                    <span className="gan-kpi-label">Ganancia en ventas</span>
                    <div className="gan-kpi-icon green">💰</div>
                  </div>
                  <div className="gan-kpi-value">{fmtK(totalGananciaVentas)}</div>
                  <div className="gan-kpi-sub">Últimos 30 días</div>
                </div>

                <div className="gan-kpi blue">
                  <div className="gan-kpi-top">
                    <span className="gan-kpi-label">Inversión en stock</span>
                    <div className="gan-kpi-icon blue">📊</div>
                  </div>
                  <div className="gan-kpi-value">{fmtK(totalInversion)}</div>
                  <div className="gan-kpi-sub">Costo del inventario actual</div>
                </div>

                <div className="gan-kpi orange">
                  <div className="gan-kpi-top">
                    <span className="gan-kpi-label">Ganancia potencial</span>
                    <div className="gan-kpi-icon orange">📈</div>
                  </div>
                  <div className="gan-kpi-value">{fmtK(totalGananciaStock)}</div>
                  <div className="gan-kpi-sub">Si vendes todo el stock</div>
                </div>

                <div className="gan-kpi cyan">
                  <div className="gan-kpi-top">
                    <span className="gan-kpi-label">Margen promedio</span>
                    <div className="gan-kpi-icon cyan">🎯</div>
                  </div>
                  <div className="gan-kpi-value">{margenPromedio.toFixed(1)}%</div>
                  <div className="gan-kpi-sub">{margenPromedio >= 30 ? 'Buen margen' : margenPromedio >= 15 ? 'Margen aceptable' : 'Margen bajo'}</div>
                </div>
              </div>

              <div className="gan-grid">
                {/* Category profits */}
                <div className="gan-card">
                  <div className="gan-card-title">🏆 Ganancia por categoría</div>
                  <div className="gan-card-subtitle">Últimos 30 días de ventas</div>
                  {categories.length === 0 ? (
                    <div className="gan-empty">Sin datos de ventas</div>
                  ) : (
                    categories.map(([cat, data], i) => {
                      const margen = data.ingresos > 0 ? ((data.ganancia / data.ingresos) * 100) : 0
                      return (
                        <div key={i} className="gan-cat-item">
                          <div>
                            <div className="gan-cat-name">{cat}</div>
                            <div className="gan-cat-products">{data.productos} productos</div>
                          </div>
                          <div className="gan-bar-wrap" style={{ width: 80 }}>
                            <div className="gan-bar-bg">
                              <div className="gan-bar-fill" style={{
                                width: `${Math.max(5, (data.ganancia / maxCatGanancia) * 100)}%`,
                                background: data.ganancia >= 0 ? 'var(--green)' : 'var(--red)'
                              }} />
                            </div>
                          </div>
                          <span className="gan-cat-margin" style={{ color: margen >= 30 ? 'var(--green)' : margen >= 15 ? 'var(--orange)' : 'var(--red)' }}>
                            {margen.toFixed(0)}%
                          </span>
                          <span className="gan-cat-profit">{fmt(data.ganancia)}</span>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Top profitable products */}
                <div className="gan-card">
                  <div className="gan-card-title">🥇 Productos más rentables</div>
                  <div className="gan-card-subtitle">Por ganancia en ventas (30 días)</div>
                  {productProfits.filter(p => p.gananciaVentas > 0).slice(0, 8).map((p, i) => (
                    <div key={i} className="gan-cat-item">
                      <div>
                        <div className="gan-cat-name">{p.nombre}</div>
                        <div className="gan-cat-products">{p.unidadesVendidas} vendidos • Margen {p.margen.toFixed(0)}%</div>
                      </div>
                      <span className="gan-cat-margin" style={{ color: 'var(--sky)' }}>{p.unidadesVendidas} uds</span>
                      <span className="gan-cat-profit">{fmt(p.gananciaVentas)}</span>
                    </div>
                  ))}
                  {productProfits.filter(p => p.gananciaVentas > 0).length === 0 && (
                    <div className="gan-empty">Registra costos y ventas para ver rentabilidad</div>
                  )}
                </div>
              </div>

              {/* Full product table with editable costs */}
              <div className="gan-card">
                <div className="gan-card-title">📋 Detalle por producto — Costos y márgenes</div>
                <div className="gan-card-subtitle">Edita el precio de costo directamente en la tabla</div>
                <div className="gan-table-wrap">
                  <table className="gan-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Costo</th>
                        <th>Precio venta</th>
                        <th>Ganancia/u</th>
                        <th>Margen</th>
                        <th>Stock</th>
                        <th>Ganancia total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productProfits.map(p => (
                        <tr key={p.id} className="gan-cost-row">
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--white)' }}>{p.nombre}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray)' }}>{p.categoria || 'General'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              $<input
                                className="gan-cost-input"
                                type="number" step="0.5" min="0"
                                value={editingCost[p.id] !== undefined ? editingCost[p.id] : (p.costo || '')}
                                placeholder="0.00"
                                onChange={e => setEditingCost(prev => ({ ...prev, [p.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && saveCost(p.id)}
                              />
                              {editingCost[p.id] !== undefined && (
                                <button className="gan-save-btn" style={{ opacity: 1 }} onClick={() => saveCost(p.id)}>✓</button>
                              )}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'Syne', fontWeight: 600, color: 'var(--sky)' }}>{fmt(p.precio)}</td>
                          <td className={p.ganancia >= 0 ? 'gan-profit-positive' : 'gan-profit-negative'}>{fmt(p.ganancia)}</td>
                          <td><span className={`gan-margin-badge ${p.margenLevel}`}>{p.costo > 0 ? `${p.margen.toFixed(0)}%` : 'Sin costo'}</span></td>
                          <td style={{ color: 'var(--gray)' }}>{p.stock}</td>
                          <td className={p.gananciaTotal >= 0 ? 'gan-profit-positive' : 'gan-profit-negative'}>{fmt(p.gananciaTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="gan-tip">
                  💡 <strong>Tip:</strong> Edita el costo de cada producto directamente en la tabla. El margen ideal para tienditas es entre 25-40%. Productos con margen menor a 15% podrían no ser rentables considerando gastos operativos.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}