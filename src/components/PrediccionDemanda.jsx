// src/components/PrediccionDemanda.jsx
// Predicción de demanda con IA local — Sketch Innovation
// Analiza velocidad de venta, stock actual y patrones para predecir agotamiento
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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
    border: 1px solid; cursor: pointer; transition: all 0.15s;
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
`

export default function PrediccionDemanda({ products }) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyzeDemand()
  }, [products])

  const analyzeDemand = async () => {
    setLoading(true)
    try {
      // Fetch last 30 days of sales data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: ventas } = await supabase
        .from('venta_detalles')
        .select('producto_id, nombre_producto, cantidad, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Calculate sales velocity per product
      const salesMap = {}
      ;(ventas || []).forEach(v => {
        if (!salesMap[v.producto_id]) {
          salesMap[v.producto_id] = { nombre: v.nombre_producto, totalVendido: 0, diasConVenta: new Set() }
        }
        salesMap[v.producto_id].totalVendido += v.cantidad
        salesMap[v.producto_id].diasConVenta.add(new Date(v.created_at).toDateString())
      })

      // Generate predictions
      const preds = products.map(p => {
        const salesData = salesMap[p.id]
        let ventasDiarias = 0
        let diasHastaAgotarse = 999
        let confianza = 'baja'
        let recomendacion = 0

        if (salesData && salesData.totalVendido > 0) {
          const diasActivos = Math.max(salesData.diasConVenta.size, 1)
          const diasTotales = 30
          // Average daily sales (considering days with actual sales)
          ventasDiarias = salesData.totalVendido / diasTotales
          // Adjusted for frequency (products sold more frequently are more predictable)
          const frecuencia = diasActivos / diasTotales
          confianza = frecuencia > 0.5 ? 'alta' : frecuencia > 0.2 ? 'media' : 'baja'

          // Days until stockout
          diasHastaAgotarse = ventasDiarias > 0 ? Math.floor(p.stock / ventasDiarias) : 999

          // Recommended reorder quantity (7 days of stock + safety margin)
          recomendacion = Math.ceil(ventasDiarias * 7 * 1.3) // 30% safety margin
        } else {
          // No sales data — estimate based on stock level
          if (p.stock <= (p.stock_minimo || 5)) {
            diasHastaAgotarse = p.stock <= 0 ? 0 : 3
            confianza = 'estimada'
            recomendacion = (p.stock_minimo || 5) * 2
          }
        }

        const urgencia = diasHastaAgotarse <= 2 ? 'critical' : diasHastaAgotarse <= 7 ? 'warning' : 'ok'

        return {
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria || 'General',
          stock: p.stock,
          ventasDiarias: Math.round(ventasDiarias * 10) / 10,
          diasHastaAgotarse,
          recomendacion,
          confianza,
          urgencia,
          stockPct: p.stock_minimo ? Math.min(100, (p.stock / (p.stock_minimo * 3)) * 100) : Math.min(100, p.stock * 5)
        }
      })

      // Sort by urgency (critical first)
      preds.sort((a, b) => a.diasHastaAgotarse - b.diasHastaAgotarse)

      setPredictions(preds.filter(p => p.diasHastaAgotarse < 30))
    } catch (err) {
      console.error('Prediction error:', err)
    }
    setLoading(false)
  }

  const criticalCount = predictions.filter(p => p.urgencia === 'critical').length
  const warningCount = predictions.filter(p => p.urgencia === 'warning').length

  return (
    <>
      <style>{predStyles}</style>
      <div className="pred-section">
        <div className="pred-header">
          <h4>🧠 Predicción de demanda</h4>
          <span className="pred-badge">IA Local</span>
        </div>

        {loading ? (
          <div className="pred-empty">Analizando datos de ventas...</div>
        ) : predictions.length === 0 ? (
          <div className="pred-empty">
            Sin predicciones por el momento. Se necesitan más datos de ventas para generar estimaciones precisas.
          </div>
        ) : (
          <>
            <div className="pred-list">
              {predictions.slice(0, 8).map(p => (
                <div key={p.id} className="pred-item">
                  <div>
                    <div className="pred-item-name">{p.nombre}</div>
                    <div className="pred-item-sub">
                      {p.ventasDiarias > 0 ? `~${p.ventasDiarias}/día • ${p.stock} en stock` : `${p.stock} en stock`}
                      {p.confianza !== 'baja' && ` • Confianza: ${p.confianza}`}
                    </div>
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

            <div className="pred-insight">
              <div className="pred-insight-title">💡 Resumen inteligente</div>
              {criticalCount > 0 && `${criticalCount} producto${criticalCount > 1 ? 's' : ''} se agotará${criticalCount > 1 ? 'n' : ''} en menos de 3 días. `}
              {warningCount > 0 && `${warningCount} producto${warningCount > 1 ? 's' : ''} necesita${warningCount > 1 ? 'n' : ''} reabastecimiento esta semana. `}
              {criticalCount === 0 && warningCount === 0 && 'Todos los productos tienen stock suficiente para los próximos 7 días. '}
              {predictions.length > 0 && `Basado en ventas de los últimos 30 días.`}
            </div>
          </>
        )}
      </div>
    </>
  )
}