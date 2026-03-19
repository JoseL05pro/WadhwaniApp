// src/services/productosService.js
// Servicio CRUD de productos conectado a Supabase
import { supabase } from '../supabaseClient'

// ─── OBTENER todos los productos ───
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data
}

// ─── BUSCAR producto por nombre (búsqueda parcial) ───
export async function buscarProducto(nombre) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .ilike('nombre', `%${nombre}%`)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// ─── AGREGAR producto ───
export async function agregarProducto({ nombre, precio, stock, stock_minimo, categoria }) {
  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre,
      precio: precio || 0,
      stock: stock || 0,
      stock_minimo: stock_minimo || 5,
      categoria: categoria || 'General'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── ELIMINAR producto por ID ───
export async function eliminarProducto(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// ─── ACTUALIZAR precio ───
export async function actualizarPrecio(id, nuevoPrecio) {
  const { data, error } = await supabase
    .from('productos')
    .update({ precio: nuevoPrecio })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── ACTUALIZAR stock (valor absoluto) ───
export async function actualizarStock(id, nuevoStock) {
  const { data, error } = await supabase
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── SUMAR stock (entrada de mercancía) ───
export async function sumarStock(id, cantidad) {
  // Primero obtenemos el stock actual
  const { data: producto, error: fetchError } = await supabase
    .from('productos')
    .select('stock')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const nuevoStock = producto.stock + cantidad

  const { data, error } = await supabase
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── OBTENER productos con stock bajo ───
export async function getAlertasStock() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .filter('stock', 'lte', supabase.rpc ? 5 : 5) // fallback

  if (error) throw error

  // Filtramos en JS para comparar stock vs stock_minimo
  // (Supabase no soporta comparar 2 columnas directo en .filter)
  const allProducts = await getProductos()
  return allProducts.filter(p => p.stock <= p.stock_minimo)
}

// ─── SUSCRIPCIÓN en tiempo real ───
export function suscribirProductos(callback) {
  const channel = supabase
    .channel('productos-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'productos' },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  // Retorna función para desuscribirse
  return () => {
    supabase.removeChannel(channel)
  }
}