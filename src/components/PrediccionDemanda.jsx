// src/components/PrediccionDemanda.jsx
// Predicción de demanda — Modelos estadísticos reales
// Métodos: Regresión Lineal, Media Móvil Ponderada (WMA)
// Requisito mínimo: 5 ventas para activar predicciones
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const MIN_VENTAS = 5 // Mínimo de ventas para activar predicción

const predStyles = `
  .pred-section {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 24px; margin-top: 16px;
  }

  .pred-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  }
  .pred-header h4 {
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--white);
  }
  .pred-badge {
    font-size: 11px; padding: 4px 10px; border-radius: 6px;
    background: rgba(52,216,232,0.12); color: var(--cyan);
    font-weight: 600; letter-spacing: 0.5px;
  }

  /* ─── Minimum sales requirement ─── */
  .pred-requirement {
    text-align: center; padding: 24px 20px;
    background: var(--card2); border: 1px solid var(--border);
    border-radius: 14px;
  }
  .pred-req-icon { font-size: 36px; margin-bottom: 12px; display: block; }
  .pred-req-title {
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
    color: var(--white); margin-bottom: 6px;
  }
  .pred-req-text { font-size: 13px; color: var(--gray); margin-bottom: 16px; line-height: 1.5; }

  .pred-progress-wrap { max-width: 280px; margin: 0 auto; }
  .pred-progress-label {
    display: flex; justify-content: space-between; margin-bottom: 6px;
    font-size: 12px; color: var(--gray);
  }
  .pred-progress-count {
    font-family: 'Syne', sans-serif; font-weight: 700; color: var(--sky);
  }
  .pred-progress-bar {
    height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;
  }
  .pred-progress-fill {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--blue), var(--sky));
    transition: width 0.6s ease;
  }

  /* ─── Model info ─── */
  .pred-model-info {
    display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .pred-model-tag {
    font-size: 10px; padding: 4px 10px; border-radius: 6px;
    font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .pred-model-tag.lr {
    background: rgba(91,184,245,0.12); color: var(--sky);
  }
  .pred-model-tag.wma {
    background: rgba(52,211,153,0.12); color: var(--green);
  }
  .pred-model-tag.ventas {
    background: rgba(251,146,60,0.12); color: var(--orange);
  }

  /* ─── Predictions list ─── */
  .pred-list { display: flex; flex-direction: column; gap: 10px; }

  .pred-item {
    display: grid; grid-template-columns: 1fr auto auto auto;
    align-items: center; gap: 16px;
    padding: 14px 16px; background: var(--card2);
    border: 1px solid var(--border); border-radius: 12px;
    transition: all 0.2s;
  }
  .pred-item:hover { border-color: rgba(91,184,245,0.2); }

  .pred-item-name { font-size: 13px; font-weight: 500; color: var(--light); }
  .pred-item-sub { font-size: 11px; color: var(--gray); margin-top: 2px; }
  .pred-item-model { font-size: 10px; color: var(--cyan); margin-top: 3px; }

  .pred-item-days {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px;
    text-align: center; min-width: 50px;
  }
  .pred-item-days.critical { color: var(--red); }
  .pred-item-days.warning { color: var(--orange); }
  .pred-item-days.ok { color: var(--green); }

  .pred-item-days-label {
    font-size: 10px; color: var(--gray); text-transform: uppercase;
    letter-spacing: 0.5px; text-align: center;
  }

  .pred-item-bar-wrap {
    width: 80px; height: 6px; background: rgba(255,255,255,0.06);
    border-radius: 4px; overflow: hidden;
  }
  .pred-item-bar {
    height: 100%; border-radius: 4px; transition: width 0.6s ease;
  }

  .pred-item-action {
    padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
    border: 1px solid; cursor: default; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .pred-item-action.critical {
    border-color: rgba(248,113,113,0.3); color: var(--red);
    background: rgba(248,113,113,0.08);
  }
  .pred-item-action.warning {
    border-color: rgba(251,146,60,0.3); color: var(--orange);
    background: rgba(251,146,60,0.08);
  }
  .pred-item-action.ok {
    border-color: rgba(52,211,153,0.3); color: var(--green);
    background: rgba(52,211,153,0.08);
  }

  .pred-empty {
    text-align: center; padding: 30px; color: var(--gray); font-size: 13px;
  }

  .pred-insight {
    margin-top: 16px; padding: 14px 16px;
    background: rgba(52,216,232,0.06); border: 1px solid rgba(52,216,232,0.15);
    border-radius: 12px; font-size: 12px; color: var(--cyan); line-height: 1.5;
  }
  .pred-insight-title {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px;
    margin-bottom: 6px; color: var(--cyan);
  }

  /* ─── Stats summary ─── */
  .pred-stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;
  }
  .pred-stat-card {
    background: var(--card2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px; text-align: center;
  }
  .pred-stat-value {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--white);
    display: block;
  }
  .pred-stat-label {
    font-size: 10px; color: var(--gray); text-transform: uppercase;
    letter-spacing: 0.8px; margin-top: 4px; display: block;
  }

  @media (max-width: 600px) {
    .pred-item { grid-template-columns: 1fr auto; gap: 10px; }
    .pred-item-bar-wrap { display: none; }
    .pred-stats { grid-template-columns: 1fr; }
  }
`

// ═══════════════════════════════════════════════════════
// ─── MODELOS ESTADÍSTICOS ───
// ═══════════════════════════════════════════════════════

/**
 * Regresión Lineal Simple (Mínimos Cuadrados)
 * y = mx + b
 * Predice la tendencia de ventas diarias
 * @param {Array} datos - Array de { x: día, y: cantidad vendida }
 * @returns {{ pendiente: number, intercepto: number, r2: number, prediccion: function }}
 */
function regresionLineal(datos) {
  const n = datos.length
  if (n < 2) return { pendiente: 0, intercepto: 0, r2: 0, prediccion: () => 0 }

  const sumX = datos.reduce((s, d) => s + d.x, 0)
  const sumY = datos.reduce((s, d) => s + d.y, 0)
  const sumXY = datos.reduce((s, d) => s + d.x * d.y, 0)
  const sumX2 = datos.reduce((s, d) => s + d.x * d.x, 0)

  const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercepto = (sumY - pendiente * sumX) / n

  // Coeficiente de determinación R²
  const meanY = sumY / n
  const ssRes = datos.reduce((s, d) => s + Math.pow(d.y - (pendiente * d.x + intercepto), 2), 0)
  const ssTot = datos.reduce((s, d) => s + Math.pow(d.y - meanY, 2), 0)
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0

  return {
    pendiente: Math.round(pendiente * 1000) / 1000,
    intercepto: Math.round(intercepto * 1000) / 1000,
    r2: Math.round(r2 * 1000) / 1000,
    prediccion: (x) => Math.max(0, pendiente * x + intercepto)
  }
}

/**
 * Media Móvil Ponderada (WMA - Weighted Moving Average)
 * Da más peso a los días recientes
 * @param {Array} valores - Valores diarios de ventas
 * @param {number} periodo - Número de días a considerar
 * @returns {number} Promedio ponderado
 */
function mediaPonderada(valores, periodo = 7) {
  const datos = valores.slice(-periodo)
  if (datos.length === 0) return 0

  let sumPonderado = 0
  let sumPesos = 0

  datos.forEach((val, i) => {
    const peso = i + 1 // Más peso a los más recientes
    sumPonderado += val * peso
    sumPesos += peso
  })

  return sumPesos > 0 ? sumPonderado / sumPesos : 0
}

/**
 * Desviación estándar — para medir variabilidad
 */
function desviacionEstandar(valores) {
  if (valores.length < 2) return 0
  const media = valores.reduce((s, v) => s + v, 0) / valores.length
  const varianza = valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / (valores.length - 1)
  return Math.sqrt(varianza)
}


// ═══════════════════════════════════════════════════════
// ─── COMPONENTE ───
// ═══════════════════════════════════════════════════════

export default function PrediccionDemanda({ products }) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalVentas, setTotalVentas] = useState(0)
  const [modelStats, setModelStats] = useState({ r2Promedio: 0, totalAnalizado: 0 })

  useEffect(() => {
    analyzeDemand()
  }, [products])

  const analyzeDemand = async () => {
    setLoading(true)
    try {
      // Fetch last 30 days of sales
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: ventas, error } = await supabase
        .from('venta_detalles')
        .select('producto_id, nombre_producto, cantidad, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error) { console.error(error); setLoading(false); return }

      // Count total sales
      const totalSales = (ventas || []).reduce((s, v) => s + v.cantidad, 0)
      setTotalVentas(totalSales)

      // If not enough sales, don't predict
      if (totalSales < MIN_VENTAS) {
        setPredictions([])
        setLoading(false)
        return
      }

      // Group sales by product and by day
      const salesByProduct = {}
      const hoy = new Date()

      ;(ventas || []).forEach(v => {
        if (!salesByProduct[v.producto_id]) {
          salesByProduct[v.producto_id] = {
            nombre: v.nombre_producto,
            ventasPorDia: {}, // { 'YYYY-MM-DD': cantidad }
            totalVendido: 0,
            diasConVenta: new Set()
          }
        }
        const fecha = new Date(v.created_at).toISOString().split('T')[0]
        salesByProduct[v.producto_id].ventasPorDia[fecha] = (salesByProduct[v.producto_id].ventasPorDia[fecha] || 0) + v.cantidad
        salesByProduct[v.producto_id].totalVendido += v.cantidad
        salesByProduct[v.producto_id].diasConVenta.add(fecha)
      })

      // Generate predictions using statistical models
      let sumR2 = 0
      let countR2 = 0

      const preds = products.map(p => {
        const salesData = salesByProduct[p.id]
        let ventasDiariasWMA = 0
        let ventasDiariasLR = 0
        let diasHastaAgotarse = 999
        let confianza = 'baja'
        let recomendacion = 0
        let modeloUsado = 'Sin datos'
        let r2 = 0
        let tendencia = 'estable' // creciente, decreciente, estable

        if (salesData && salesData.totalVendido > 0) {
          // Build daily sales array for last 30 days
          const ventasDiarias = []
          const datosRegresion = []

          for (let i = 29; i >= 0; i--) {
            const fecha = new Date(hoy)
            fecha.setDate(fecha.getDate() - i)
            const key = fecha.toISOString().split('T')[0]
            const qty = salesData.ventasPorDia[key] || 0
            ventasDiarias.push(qty)
            datosRegresion.push({ x: 30 - i, y: qty })
          }

          // ─── Método 1: Media Móvil Ponderada (WMA) ───
          ventasDiariasWMA = mediaPonderada(ventasDiarias, 7)

          // ─── Método 2: Regresión Lineal ───
          const lr = regresionLineal(datosRegresion)
          ventasDiariasLR = lr.prediccion(31) // Predicción para mañana
          r2 = lr.r2
          sumR2 += r2
          countR2++

          // Tendencia basada en la pendiente
          if (lr.pendiente > 0.1) tendencia = 'creciente'
          else if (lr.pendiente < -0.1) tendencia = 'decreciente'
          else tendencia = 'estable'

          // ─── Seleccionar mejor modelo ───
          // Si R² es bueno (>0.3), usar regresión lineal; sino, usar WMA
          let ventasDiariasPrediccion
          if (r2 > 0.3 && ventasDiariasLR > 0) {
            ventasDiariasPrediccion = ventasDiariasLR
            modeloUsado = `Regresión Lineal (R²=${r2.toFixed(2)})`
          } else {
            ventasDiariasPrediccion = ventasDiariasWMA
            modeloUsado = 'Media Móvil Ponderada (7 días)'
          }

          // Days until stockout
          diasHastaAgotarse = ventasDiariasPrediccion > 0
            ? Math.floor(p.stock / ventasDiariasPrediccion)
            : 999

          // Confidence based on data quality
          const desv = desviacionEstandar(ventasDiarias.filter(v => v > 0))
          const coefVariacion = ventasDiariasWMA > 0 ? desv / ventasDiariasWMA : 999
          const diasActivos = salesData.diasConVenta.size

          if (diasActivos >= 10 && coefVariacion < 1) confianza = 'alta'
          else if (diasActivos >= 5 && coefVariacion < 2) confianza = 'media'
          else confianza = 'baja'

          // Reorder recommendation (7 days of stock + safety based on variability)
          const margenSeguridad = confianza === 'alta' ? 1.2 : confianza === 'media' ? 1.4 : 1.6
          recomendacion = Math.ceil(ventasDiariasPrediccion * 7 * margenSeguridad)

        } else {
          if (p.stock <= (p.stock_minimo || 5)) {
            diasHastaAgotarse = p.stock <= 0 ? 0 : 3
            confianza = 'estimada'
            recomendacion = (p.stock_minimo || 5) * 2
            modeloUsado = 'Estimación por stock mínimo'
          }
        }

        const urgencia = diasHastaAgotarse <= 2 ? 'critical' : diasHastaAgotarse <= 7 ? 'warning' : 'ok'

        return {
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria || 'General',
          stock: p.stock,
          ventasDiarias: Math.round(ventasDiariasWMA * 10) / 10,
          diasHastaAgotarse,
          recomendacion,
          confianza,
          urgencia,
          modeloUsado,
          tendencia,
          r2,
          stockPct: p.stock_minimo ? Math.min(100, (p.stock / (p.stock_minimo * 3)) * 100) : Math.min(100, p.stock * 5)
        }
      })

      preds.sort((a, b) => a.diasHastaAgotarse - b.diasHastaAgotarse)

      setModelStats({
        r2Promedio: countR2 > 0 ? Math.round((sumR2 / countR2) * 100) / 100 : 0,
        totalAnalizado: countR2
      })

      setPredictions(preds.filter(p => p.diasHastaAgotarse < 30))
    } catch (err) {
      console.error('Prediction error:', err)
    }
    setLoading(false)
  }

  const criticalCount = predictions.filter(p => p.urgencia === 'critical').length
  const warningCount = predictions.filter(p => p.urgencia === 'warning').length
  const progressPct = Math.min(100, (totalVentas / MIN_VENTAS) * 100)

  return (
    <>
      <style>{predStyles}</style>
      <div className="pred-section">
        <div className="pred-header">
          <h4>🧠 Predicción de demanda</h4>
          <span className="pred-badge">Modelos Estadísticos</span>
        </div>

        {loading ? (
          <div className="pred-empty">Analizando datos de ventas con modelos estadísticos...</div>
        ) : totalVentas < MIN_VENTAS ? (
          /* ═══ NOT ENOUGH SALES ═══ */
          <div className="pred-requirement">
            <span className="pred-req-icon">📊</span>
            <div className="pred-req-title">Datos insuficientes para predicción</div>
            <div className="pred-req-text">
              Se requieren al menos <strong>{MIN_VENTAS} ventas</strong> registradas para que los modelos
              de Regresión Lineal y Media Móvil Ponderada generen predicciones confiables.
            </div>
            <div className="pred-progress-wrap">
              <div className="pred-progress-label">
                <span>Progreso</span>
                <span><span className="pred-progress-count">{totalVentas}</span> / {MIN_VENTAS} ventas</span>
              </div>
              <div className="pred-progress-bar">
                <div className="pred-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        ) : predictions.length === 0 ? (
          <div className="pred-empty">
            Todos los productos tienen stock suficiente. No se detectan riesgos de agotamiento en los próximos 30 días.
          </div>
        ) : (
          /* ═══ PREDICTIONS ═══ */
          <>
            {/* Model tags + stats */}
            <div className="pred-model-info">
              <span className="pred-model-tag lr">📈 Regresión Lineal</span>
              <span className="pred-model-tag wma">📊 Media Móvil Ponderada</span>
              <span className="pred-model-tag ventas">{totalVentas} ventas analizadas</span>
            </div>

            {/* Summary stats */}
            <div className="pred-stats">
              <div className="pred-stat-card">
                <span className="pred-stat-value" style={{ color: 'var(--red)' }}>{criticalCount}</span>
                <span className="pred-stat-label">Críticos (&lt;3 días)</span>
              </div>
              <div className="pred-stat-card">
                <span className="pred-stat-value" style={{ color: 'var(--orange)' }}>{warningCount}</span>
                <span className="pred-stat-label">Alerta (&lt;7 días)</span>
              </div>
              <div className="pred-stat-card">
                <span className="pred-stat-value" style={{ color: 'var(--sky)' }}>{modelStats.r2Promedio.toFixed(2)}</span>
                <span className="pred-stat-label">R² promedio</span>
              </div>
            </div>

            {/* Predictions list */}
            <div className="pred-list">
              {predictions.slice(0, 8).map(p => (
                <div key={p.id} className="pred-item">
                  <div>
                    <div className="pred-item-name">{p.nombre}</div>
                    <div className="pred-item-sub">
                      {p.ventasDiarias > 0 ? `~${p.ventasDiarias}/día` : ''} • {p.stock} en stock
                      {p.tendencia !== 'estable' && ` • Tendencia ${p.tendencia === 'creciente' ? '↑' : '↓'}`}
                      {p.confianza !== 'baja' && ` • ${p.confianza}`}
                    </div>
                    <div className="pred-item-model">{p.modeloUsado}</div>
                  </div>

                  <div>
                    <div className={`pred-item-days ${p.urgencia}`}>
                      {p.diasHastaAgotarse === 0 ? '⚠️' : p.diasHastaAgotarse > 99 ? '99+' : p.diasHastaAgotarse}
                    </div>
                    <div className="pred-item-days-label">
                      {p.diasHastaAgotarse === 0 ? 'Agotado' : 'días'}
                    </div>
                  </div>

                  <div className="pred-item-bar-wrap">
                    <div
                      className="pred-item-bar"
                      style={{
                        width: `${p.stockPct}%`,
                        background: p.urgencia === 'critical' ? 'var(--red)' : p.urgencia === 'warning' ? 'var(--orange)' : 'var(--green)'
                      }}
                    />
                  </div>

                  <span className={`pred-item-action ${p.urgencia}`}>
                    {p.urgencia === 'critical' ? `Pedir ${p.recomendacion} uds` :
                     p.urgencia === 'warning' ? `Reabastecer pronto` :
                     'Stock OK'}
                  </span>
                </div>
              ))}
            </div>

            {/* Insight */}
            <div className="pred-insight">
              <div className="pred-insight-title">💡 Resumen estadístico</div>
              {criticalCount > 0 && `${criticalCount} producto${criticalCount > 1 ? 's' : ''} se agotará${criticalCount > 1 ? 'n' : ''} en menos de 3 días. `}
              {warningCount > 0 && `${warningCount} necesita${warningCount > 1 ? 'n' : ''} reabastecimiento esta semana. `}
              {criticalCount === 0 && warningCount === 0 && 'Stock suficiente para los próximos 7 días. '}
              {`Análisis basado en ${totalVentas} ventas de los últimos 30 días. `}
              {modelStats.r2Promedio > 0.5 ? 'El modelo de regresión muestra buen ajuste (R² > 0.5), las predicciones son confiables.' :
               modelStats.r2Promedio > 0.2 ? 'El modelo tiene ajuste moderado. Se complementa con Media Móvil Ponderada para mayor precisión.' :
               'Se usa Media Móvil Ponderada como modelo principal por mejor ajuste a los datos actuales.'}
            </div>
          </>
        )}
      </div>
    </>
  )
}