import { supabase } from '../supabaseClient'

export async function registrarVenta(venta) {
  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      total: venta.total,
      pago: venta.pago,
      cambio: venta.cambio,
      num_productos: venta.items.reduce((sum, i) => sum + i.cantidad, 0),
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  if (ventaError) throw ventaError

  const detalles = venta.items.map(item => ({
    venta_id: ventaData.id,
    producto_id: item.producto_id,
    nombre_producto: item.nombre,
    precio_unitario: item.precio,
    cantidad: item.cantidad,
    subtotal: item.precio * item.cantidad
  }))
  const { error: detalleError } = await supabase.from('venta_detalles').insert(detalles)
  if (detalleError) throw detalleError

  for (const item of venta.items) {
    const { data: prod } = await supabase.from('productos').select('stock').eq('id', item.producto_id).single()
    if (prod) {
      await supabase.from('productos').update({ stock: Math.max(0, prod.stock - item.cantidad) }).eq('id', item.producto_id)
    }
  }
  return ventaData
}

export async function getVentasHoy() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)
  const { data, error } = await supabase.from('ventas').select('*, venta_detalles(*)').gte('created_at', hoy.toISOString()).lt('created_at', manana.toISOString()).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCorteDeCaja() {
  const ventas = await getVentasHoy()
  const totalVentas = ventas.length
  const totalIngresos = ventas.reduce((sum, v) => sum + Number(v.total), 0)
  const totalProductos = ventas.reduce((sum, v) => sum + v.num_productos, 0)
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0

  const productCount = {}
  ventas.forEach(v => {
    (v.venta_detalles || []).forEach(d => {
      const key = d.nombre_producto
      if (!productCount[key]) productCount[key] = { nombre: key, cantidad: 0, total: 0 }
      productCount[key].cantidad += d.cantidad
      productCount[key].total += Number(d.subtotal)
    })
  })
  const topProductos = Object.values(productCount).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)

  const ventasPorHora = {}
  ventas.forEach(v => {
    const hora = new Date(v.created_at).getHours()
    if (!ventasPorHora[hora]) ventasPorHora[hora] = { ventas: 0, total: 0 }
    ventasPorHora[hora].ventas++
    ventasPorHora[hora].total += Number(v.total)
  })

  return { totalVentas, totalIngresos, totalProductos, ticketPromedio, topProductos, ventasPorHora, ventas }
}

export async function cancelarVenta(ventaId) {
  const { data: detalles } = await supabase.from('venta_detalles').select('*').eq('venta_id', ventaId)
  if (detalles) {
    for (const d of detalles) {
      const { data: prod } = await supabase.from('productos').select('stock').eq('id', d.producto_id).single()
      if (prod) await supabase.from('productos').update({ stock: prod.stock + d.cantidad }).eq('id', d.producto_id)
    }
  }
  await supabase.from('venta_detalles').delete().eq('venta_id', ventaId)
  await supabase.from('ventas').delete().eq('id', ventaId)
}