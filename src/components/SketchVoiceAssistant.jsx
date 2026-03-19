// src/components/SketchVoiceAssistant.jsx
// Asistente de voz para Sketch v5 — HÍBRIDO: Claude API + NLP Local como fallback
// Requiere proxy.mjs corriendo en localhost:3001
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getProductos,
  agregarProducto,
  eliminarProducto,
  actualizarPrecio,
  actualizarStock,
  sumarStock,
  suscribirProductos
} from '../services/productosService'
import './SketchVoiceAssistant.css'

// ═══════════════════════════════════════════════════════
// ─── CLAUDE API (via proxy local) ───
// ═══════════════════════════════════════════════════════
const PROXY_URL = 'http://localhost:3001'
const USE_CLAUDE = true // Cambiar a false para usar solo NLP local

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

async function askClaude(conversationHistory, productList) {
  const greeting = getGreeting()
  const systemPrompt = `Eres "Sketch", un asistente de voz para gestión de inventario en pequeñas tiendas mexicanas (abarrotes, misceláneas, tienditas).

PERSONALIDAD:
- Tratas al usuario de "usted" siempre (formal pero cálido)
- Eres eficiente, claro y amigable — como un empleado de confianza
- Respuestas CORTAS (máximo 2-3 oraciones) porque se leen en voz alta
- Nunca uses emojis, markdown, asteriscos ni formato especial — solo texto plano
- Si el usuario saluda, responde con "${greeting}" y pregunta en qué ayuda

INVENTARIO ACTUAL (${productList.length} productos):
${JSON.stringify(productList.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio, stock: p.stock, stock_minimo: p.stock_minimo, categoria: p.categoria })))}

CAPACIDADES — Responde SIEMPRE en JSON válido con esta estructura:
{
  "response": "texto que se le dirá al usuario en voz alta",
  "action": null | {
    "type": "add" | "delete" | "editPrice" | "editStock" | "addStock" | "sell" | "alerts" | "list",
    "data": { ...datos relevantes }
  },
  "needs_confirmation": true | false
}

REGLAS DE ACCIONES:
1. "add": data: { nombre, precio, stock, stock_minimo, categoria }
   - Si el usuario dice presentación (600ml, 1L, lata), INCLÚYELA en el nombre
   - Si falta presentación para refrescos/botanas/lácteos, PREGUNTA
   - Corrige nombres de voz: "cosacola"→"Coca-Cola", "savritas"→"Sabritas"
   - Categorías auto: Bebidas, Botanas, Panadería, Lácteos, Abarrotes, Limpieza, etc.
   - Si falta precio o stock, pregunta UNO a la vez
   - NUNCA agregues sin precio

2. "delete": data: { id, nombre }
3. "editPrice": data: { id, nombre, nuevoPrecio }
4. "editStock": data: { id, nombre, nuevoStock }
5. "addStock": data: { id, nombre, cantidad }
6. "sell": Para ventas rápidas. data: { items: [{ id, nombre, precio, cantidad }], total }
   - "Cobra 2 cocas y unas sabritas" → busca en inventario, calcula total
7. "alerts": Sin data
8. "list": Sin data

CONFIRMACIÓN:
- needs_confirmation = true para: add, delete, editPrice, editStock, addStock, sell
- needs_confirmation = false para: consultas, alertas, listar, saludos, ayuda
- Cuando confirmes, resume la acción y termina con "¿Confirmo?"

IMPORTANTE:
- SIEMPRE JSON válido, sin backticks
- Busca coincidencias parciales ("coca" → "Coca-Cola 600ml")
- Si hay múltiples coincidencias, pregunta cuál
- Si dice "sí/dale/ok" → confirma. Si dice "no/cancela" → cancela

DESPEDIDAS:
- Si el usuario se despide ("adiós", "bye", "nos vemos", "ya estuvo", "hasta luego", "ya me voy", "chao", "ya wey", "nel ya", "ya valió"), responde con una despedida cálida y breve.
- Usa action type "dismiss" para cerrar el panel automáticamente.
- Ejemplo: { "response": "¡Hasta luego! Que le vaya bien en la tienda.", "action": { "type": "dismiss" }, "needs_confirmation": false }
- Varía las despedidas: "¡Que le vaya chido!", "¡Ahí nos vemos, cuídese!", "¡Éxito hoy! Aquí estaré cuando me necesite."

SALUDOS CASUALES:
- "¿Qué pedo?", "¿Qué onda?", "¿Qué rollo?" → responde casual pero profesional: "¡Qué onda! Aquí andamos. ¿En qué le echo la mano?"
- "¿Cómo estás?" → "¡Bien, listo para chambear! ¿Qué necesita?"
- Groserías casuales tipo mexicano ("no mames", "wey", "chingón") → ignóralas con naturalidad, no las repitas, responde normal`

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: conversationHistory
      })
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Claude API error:', err)
    return null // null = fallback to local NLP
  }
}


// ═══════════════════════════════════════════════════════
// ─── MOTOR NLP LOCAL (fallback) ───
// ═══════════════════════════════════════════════════════

const VOICE_CORRECTIONS = {
  'cosacola': 'Coca-Cola', 'coca cola': 'Coca-Cola', 'cocacola': 'Coca-Cola', 'coca': 'Coca-Cola',
  'coquita': 'Coca-Cola', 'koka': 'Coca-Cola', 'koka kola': 'Coca-Cola',
  'pepsicola': 'Pepsi', 'pepsi cola': 'Pepsi', 'pepsy': 'Pepsi',
  'savritas': 'Sabritas', 'zabritas': 'Sabritas',
  'vim bo': 'Bimbo', 'vimbo': 'Bimbo', 'bim bo': 'Bimbo',
  'marucha': 'Maruchan', 'maruchán': 'Maruchan', 'marruchan': 'Maruchan',
  'nescafe': 'Nescafé', 'nes café': 'Nescafé',
  'tang': 'Tang', 'fanta': 'Fanta', 'mirinda': 'Mirinda',
  'gansito': 'Gansito', 'chokis': 'Chokis',
  'doritos': 'Doritos', 'ruffles': 'Ruffles', 'cheetos': 'Cheetos',
  'zucaritas': 'Zucaritas', 'zuca ritas': 'Zucaritas',
  'modelo': 'Modelo', 'corona': 'Corona', 'tecate': 'Tecate', 'victoria': 'Victoria',
  'ciel': 'Ciel', 'bonafon': 'Bonafont', 'bonafont': 'Bonafont',
  'gamesa': 'Gamesa', 'marinela': 'Marinela',
  'lala': 'Lala', 'alpura': 'Alpura',
  'pinol': 'Pinol', 'fabuloso': 'Fabuloso', 'cloralex': 'Cloralex',
}

const CATEGORY_MAP = {
  'Bebidas': ['coca-cola', 'pepsi', 'fanta', 'mirinda', 'sprite', 'ciel', 'bonafont', 'tang', 'jumex', 'boing', 'jarritos', 'agua', 'refresco', 'jugo'],
  'Botanas': ['sabritas', 'doritos', 'cheetos', 'ruffles', 'takis', 'cacahuates', 'papas', 'chicharrones'],
  'Panadería': ['bimbo', 'marinela', 'gansito', 'chokis', 'pan', 'galletas', 'gamesa', 'tortillas'],
  'Lácteos': ['lala', 'alpura', 'leche', 'queso', 'yogurt', 'crema'],
  'Abarrotes': ['maruchan', 'atún', 'arroz', 'frijol', 'aceite', 'azúcar', 'sal', 'harina', 'nescafé', 'café'],
  'Limpieza': ['pinol', 'fabuloso', 'cloralex', 'jabón', 'detergente', 'cloro', 'papel'],
  'Dulcería': ['dulce', 'chicle', 'paleta', 'mazapán', 'chocolate', 'gomitas'],
  'Cerveza': ['modelo', 'corona', 'tecate', 'victoria', 'cerveza'],
}

function detectCategory(name) {
  const l = name.toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORY_MAP)) {
    if (kws.some(k => l.includes(k))) return cat
  }
  return 'General'
}

function correctProductName(raw) {
  const l = raw.toLowerCase().trim()
  for (const [wrong, correct] of Object.entries(VOICE_CORRECTIONS)) {
    if (l === wrong || l.includes(wrong)) {
      const rest = l.replace(wrong, '').trim()
      return rest ? `${correct} ${rest}` : correct
    }
  }
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase())
}

function extractPresentation(t) {
  const lower = t.toLowerCase()
  const pats = [/(\d+)\s*ml/i, /(\d+(?:\.\d+)?)\s*(?:litros?|lt?|lts)/i, /(\d+)\s*(?:gramos?|gr?|gs)/i]
  for (const p of pats) {
    const m = lower.match(p)
    if (m) {
      if (/litros?|lt|lts/i.test(m[0])) return `${m[1]}L`
      if (/ml/i.test(m[0])) return `${m[1]}ml`
      if (/gramos?|gr?|gs/i.test(m[0])) return `${m[1]}g`
    }
  }
  if (/\blata\b/i.test(lower)) return 'Lata'
  if (/\bbotella\b/i.test(lower)) return 'Botella'
  if (/\bgrande\b/i.test(lower)) return 'Grande'
  if (/\bchico\b/i.test(lower)) return 'Chico'
  if (/\bfamiliar\b/i.test(lower)) return 'Familiar'
  return null
}

function extractPrice(t) {
  const pats = [
    /(?:a|por|precio(?:\s+de)?|cuesta|vale|con(?:\s+un)?(?:\s+precio)?(?:\s+de)?)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:pesos|varos)?/i,
    /\$\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:pesos|varos)/i,
  ]
  for (const p of pats) { const m = t.toLowerCase().match(p); if (m) return parseFloat(m[1]) }
  return null
}

function extractStock(t) {
  const pats = [
    /(?:con|stock(?:\s+de)?|cantidad(?:\s+de)?|existencia|tengo|hay)\s+(\d+)\s*(?:unidades|piezas|en\s+stock)?/i,
    /(\d+)\s*(?:unidades|piezas|en\s+stock|en\s+existencia|de\s+stock)/i,
  ]
  for (const p of pats) { const m = t.toLowerCase().match(p); if (m) return parseInt(m[1]) }
  return null
}

function extractProductNameFromAdd(text) {
  let c = text.toLowerCase()
    .replace(/^(?:agrega|agregar|añade|añadir|registra|registrar|mete|meter|pon|poner|da de alta|nuevo producto|quiero agregar|agrega un|agrega una|agregar un|agregar una|registra un|registra una|añade un|añade una|mete un|mete una|quiero agregar un|quiero agregar una)\s*/i, '')
    .replace(/(?:a|por|precio(?:\s+de)?|cuesta|vale|con(?:\s+un)?(?:\s+precio)?(?:\s+de)?)\s+\$?\s*\d+(?:\.\d{1,2})?\s*(?:pesos|varos)?/gi, '')
    .replace(/\$\s*\d+(?:\.\d{1,2})?/g, '')
    .replace(/\d+(?:\.\d{1,2})?\s*(?:pesos|varos)/gi, '')
    .replace(/(?:con|stock(?:\s+de)?|cantidad(?:\s+de)?|existencia|tengo|hay)\s+\d+\s*(?:unidades|piezas|en\s+stock)?/gi, '')
    .replace(/\d+\s*(?:unidades|piezas|en\s+stock|en\s+existencia|de\s+stock)/gi, '')
    .replace(/\s+/g, ' ').trim()
  return c || null
}

function findProduct(products, query) {
  const q = query.toLowerCase()
  let found = products.filter(p => p.nombre.toLowerCase() === q)
  if (found.length === 1) return { exact: true, products: found }
  found = products.filter(p => p.nombre.toLowerCase().includes(q) || q.includes(p.nombre.toLowerCase()))
  if (found.length > 0) return { exact: found.length === 1, products: found }
  const corrected = correctProductName(query).toLowerCase()
  found = products.filter(p => p.nombre.toLowerCase().includes(corrected) || corrected.includes(p.nombre.toLowerCase()))
  return { exact: found.length === 1, products: found }
}

const NEEDS_PRES = ['coca-cola', 'pepsi', 'fanta', 'sprite', 'ciel', 'bonafont', 'modelo', 'corona', 'tecate', 'sabritas', 'doritos', 'cheetos', 'ruffles', 'takis', 'bimbo', 'marinela', 'maruchan', 'leche', 'lala', 'alpura', 'jumex', 'tang', 'nescafé']

function needsPresentation(name) { return NEEDS_PRES.some(p => name.toLowerCase().includes(p)) }

function processLocalNLP(transcript, products, pendingCtx) {
  const t = transcript.toLowerCase().replace(/[.!?]+$/, '').trim()

  if (/^(hola|hey|buenas?|qué onda|que onda|qué tal|que tal|buenos días|buenas tardes|buenas noches|saludos)(\s|$)/i.test(t) && t.length < 40) {
    const g = getGreeting()
    const h = new Date().getHours()
    let x = h < 9 ? ' ¿Listo para empezar?' : h < 14 ? ' ¿En qué le ayudo?' : h < 19 ? ' ¿Cómo va la tienda?' : ' ¿Hacemos corte?'
    return { response: `¡${g}! Aquí Sketch a sus órdenes.${x}`, action: null, needs_confirmation: false }
  }

  // Casual greetings (mexicanismos)
  if (/^(qué pedo|que pedo|qué rollo|que rollo|qué onda wey|cómo estás|como estas|qué hay|que hay)/i.test(t)) {
    return { response: '¡Qué onda! Aquí andamos, listo para chambear. ¿En qué le echo la mano?', action: null, needs_confirmation: false }
  }

  // ─── FAREWELL / DESPEDIDA ───
  if (/^(adiós|adios|bye|nos vemos|hasta luego|hasta mañana|ya estuvo|ya me voy|chao|chau|ya wey|nel ya|ya valió|ya valio|me voy|ahí te dejo|ahi te dejo|hasta pronto|cuídate|cuidate|ya quedó|ya quedo|eso es todo|es todo|nada más|nada mas|ya no|listo gracias|ya con eso)/i.test(t)) {
    const despedidas = [
      '¡Hasta luego! Que le vaya bien en la tienda.',
      '¡Ahí nos vemos! Aquí estaré cuando me necesite.',
      '¡Éxito hoy! Diga "Hey Sketch" cuando me ocupe.',
      '¡Que le vaya chido! Cuídese.',
      '¡Sale! Aquí lo espero para la siguiente.',
    ]
    return { response: despedidas[Math.floor(Math.random() * despedidas.length)], action: { type: 'dismiss' }, needs_confirmation: false }
  }

  if (/^(ayuda|qué puedes hacer|que puedes hacer|cómo funciona|como funciona)$/i.test(t)) {
    return { response: 'Puedo agregar productos, consultar precios, revisar stock bajo, registrar ventas y más. Diga por ejemplo: "Agrega una Coca de 600 ml a 18 pesos con 24 en stock" o "Cobra 2 cocas y unas sabritas".', action: null, needs_confirmation: false }
  }

  if (/^(gracias|muchas gracias|chido|genial|perfecto)/i.test(t)) {
    return { response: '¡Para servirle! ¿Algo más?', action: null, needs_confirmation: false }
  }

  // Pending context
  if (pendingCtx) {
    const ctx = { ...pendingCtx }
    if (ctx.waitingFor === 'name') {
      const pres = extractPresentation(t); const price = extractPrice(t); const stock = extractStock(t)
      let name = correctProductName(t.replace(/(?:a|por)\s+\$?\s*\d+.*$/gi, '').replace(/(?:con|stock)\s+\d+.*$/gi, '').trim())
      if (!name || name.length < 2) return { response: 'No capté el nombre. Dígame el producto.', action: null, needs_confirmation: false, pendingContext: ctx }
      const cat = detectCategory(name)
      if (pres && !name.toLowerCase().includes(pres.toLowerCase())) name = `${name} ${pres}`
      if (!pres && needsPresentation(name)) return { response: `${name}, ¿de qué presentación? 600ml, 1 litro, lata...`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'presentation', baseName: name, nombre: name, precio: price, stock, categoria: cat, stock_minimo: 5 } }
      if (!price) return { response: `${name}, ¿a cómo lo vende?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'price', nombre: name, precio: null, stock, categoria: cat, stock_minimo: 5 } }
      if (stock == null) return { response: `${name} a $${price}. ¿Cuántas unidades?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'stock', nombre: name, precio: price, stock: null, categoria: cat, stock_minimo: 5 } }
      return { response: `Registrar ${name} a $${price}, ${stock} uds, categoría ${cat}. ¿Confirmo?`, action: { type: 'add', data: { nombre: name, precio: price, stock, stock_minimo: 5, categoria: cat } }, needs_confirmation: true, pendingContext: null }
    }
    if (ctx.waitingFor === 'presentation') {
      const pres = extractPresentation(t) || t.trim()
      if (pres) {
        ctx.nombre = `${ctx.baseName} ${typeof pres === 'string' ? correctProductName(pres) : pres}`
        if (!ctx.precio) { ctx.waitingFor = 'price'; return { response: `${ctx.nombre}. ¿A cómo lo vende?`, action: null, needs_confirmation: false, pendingContext: ctx } }
        if (ctx.stock == null) { ctx.waitingFor = 'stock'; return { response: `${ctx.nombre} a $${ctx.precio}. ¿Cuántas unidades?`, action: null, needs_confirmation: false, pendingContext: ctx } }
        return { response: `Registrar ${ctx.nombre} a $${ctx.precio}, ${ctx.stock} uds. ¿Confirmo?`, action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock: ctx.stock, stock_minimo: 5, categoria: ctx.categoria } }, needs_confirmation: true, pendingContext: null }
      }
      return { response: 'Dígame la presentación: 600ml, 1 litro, lata...', action: null, needs_confirmation: false, pendingContext: ctx }
    }
    if (ctx.waitingFor === 'price') {
      const price = extractPrice(t) || parseFloat(t.replace(/[^0-9.]/g, ''))
      if (price > 0) {
        ctx.precio = price
        if (ctx.stock == null) { ctx.waitingFor = 'stock'; return { response: `$${price} anotado. ¿Cuántas unidades?`, action: null, needs_confirmation: false, pendingContext: ctx } }
        return { response: `Registrar ${ctx.nombre} a $${price}, ${ctx.stock} uds. ¿Confirmo?`, action: { type: 'add', data: { nombre: ctx.nombre, precio: price, stock: ctx.stock, stock_minimo: 5, categoria: ctx.categoria } }, needs_confirmation: true, pendingContext: null }
      }
      return { response: 'Dígame el precio, por ejemplo: 18 pesos', action: null, needs_confirmation: false, pendingContext: ctx }
    }
    if (ctx.waitingFor === 'stock') {
      const stock = extractStock(t) || parseInt(t.replace(/[^0-9]/g, ''))
      if (stock >= 0 && !isNaN(stock)) {
        return { response: `Registrar ${ctx.nombre} a $${ctx.precio}, ${stock} uds. ¿Confirmo?`, action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock, stock_minimo: 5, categoria: ctx.categoria } }, needs_confirmation: true, pendingContext: null }
      }
      return { response: 'Dígame la cantidad, por ejemplo: 24', action: null, needs_confirmation: false, pendingContext: ctx }
    }
  }

  // Add
  if (/(?:agrega|agregar|añade|añadir|registra|registrar|mete|meter|pon|poner|da de alta|nuevo producto|quiero agregar)/i.test(t)) {
    const rawName = extractProductNameFromAdd(transcript)
    if (!rawName || /^(un|una|el|la|producto)$/i.test(rawName.trim())) {
      return { response: '¿Qué producto quiere agregar?', action: null, needs_confirmation: false, pendingContext: { waitingFor: 'name' } }
    }
    const pres = extractPresentation(t); const price = extractPrice(t); const stock = extractStock(t)
    let name = correctProductName(rawName); const cat = detectCategory(name)
    if (pres && !name.toLowerCase().includes(pres.toLowerCase())) name = `${name} ${pres}`
    if (!pres && needsPresentation(name)) return { response: `${name}, ¿de qué presentación?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'presentation', baseName: name, nombre: name, precio: price, stock, categoria: cat, stock_minimo: 5 } }
    if (!price) return { response: `${name}. ¿A cómo lo vende?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'price', nombre: name, precio: null, stock, categoria: cat, stock_minimo: 5 } }
    if (stock == null) return { response: `${name} a $${price}. ¿Cuántas unidades?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'stock', nombre: name, precio: price, stock: null, categoria: cat, stock_minimo: 5 } }
    return { response: `Registrar ${name} a $${price}, ${stock} uds, categoría ${cat}. ¿Confirmo?`, action: { type: 'add', data: { nombre: name, precio: price, stock, stock_minimo: 5, categoria: cat } }, needs_confirmation: true, pendingContext: null }
  }

  // Sell
  if (/(?:cobra|cobrar|vende|vender|venta de|registra venta)/i.test(t)) {
    const items = []
    const parts = t.replace(/(?:cobra|cobrar|vende|vender|registra venta|una venta)\s*/i, '').split(/\s+y\s+|\s*,\s*/)
    for (const part of parts) {
      const qm = part.match(/(\d+)\s+/); const qty = qm ? parseInt(qm[1]) : 1
      const nm = part.replace(/^\d+\s*/, '').replace(/^(de\s+|una?\s+)/i, '').trim()
      if (!nm) continue
      const r = findProduct(products, nm)
      if (r.products.length === 1) items.push({ id: r.products[0].id, nombre: r.products[0].nombre, precio: r.products[0].precio, cantidad: qty })
    }
    if (items.length === 0) return { response: 'No encontré esos productos. Diga: "Cobra 2 Cocas y unas Sabritas".', action: null, needs_confirmation: false }
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
    const resumen = items.map(i => `${i.cantidad}x ${i.nombre} ($${i.precio})`).join(', ')
    return { response: `Venta: ${resumen}. Total: $${total.toFixed(2)}. ¿Confirmo?`, action: { type: 'sell', data: { items, total } }, needs_confirmation: true }
  }

  // Delete
  if (/(?:elimina|eliminar|borra|borrar|quita|quitar)/i.test(t)) {
    const nm = t.replace(/(?:elimina|eliminar|borra|borrar|quita|quitar)\s*/i, '').replace(/^(el|la|los|las|un|una|del)\s+/i, '').trim()
    if (!nm) return { response: '¿Qué producto elimino?', action: null, needs_confirmation: false }
    const r = findProduct(products, nm)
    if (r.products.length === 0) return { response: `No encontré "${nm}".`, action: null, needs_confirmation: false }
    if (r.products.length === 1) return { response: `Eliminar "${r.products[0].nombre}". ¿Confirmo?`, action: { type: 'delete', data: { id: r.products[0].id, nombre: r.products[0].nombre } }, needs_confirmation: true }
    return { response: `Encontré varios: ${r.products.map(p => p.nombre).join(', ')}. ¿Cuál?`, action: null, needs_confirmation: false }
  }

  // Price query
  if (/(?:cuánto|cuanto|qué precio|que precio|a cómo|a como|precio de|cuánto cuesta|cuanto cuesta)/i.test(t)) {
    let nm = t.replace(/(?:cuánto|cuanto|qué precio|que precio|a cómo|a como)\s*(cuesta|vale|está|tiene)?\s*(la|el|los|las|de la|del)?\s*/i, '').replace(/\?/g, '').trim()
    if (!nm) return { response: '¿De qué producto?', action: null, needs_confirmation: false }
    const r = findProduct(products, nm)
    if (r.products.length === 0) return { response: `No encontré "${nm}".`, action: null, needs_confirmation: false }
    if (r.products.length === 1) return { response: `${r.products[0].nombre}: $${r.products[0].precio}.`, action: null, needs_confirmation: false }
    return { response: `Encontré: ${r.products.map(p => `${p.nombre} a $${p.precio}`).join(', ')}. ¿Cuál?`, action: null, needs_confirmation: false }
  }

  // Stock query
  if (/(?:cuántos?|cuantos?|qué stock|que stock|stock de|hay de)/i.test(t)) {
    let nm = t.replace(/(?:cuántos?|cuantos?|qué stock|que stock)\s*(hay|tiene|queda)?\s*(de\s*(la|el)?\s*)?/i, '').replace(/\?/g, '').trim()
    if (!nm) return { response: '¿De qué producto?', action: null, needs_confirmation: false }
    const r = findProduct(products, nm)
    if (r.products.length === 0) return { response: `No encontré "${nm}".`, action: null, needs_confirmation: false }
    if (r.products.length === 1) { const p = r.products[0]; return { response: `${p.nombre}: ${p.stock} unidades.${p.stock <= (p.stock_minimo||5) ? ' Stock bajo.' : ''}`, action: null, needs_confirmation: false } }
    return { response: `Encontré: ${r.products.map(p => `${p.nombre} con ${p.stock}`).join(', ')}`, action: null, needs_confirmation: false }
  }

  if (/(?:alertas?|stock bajo|falta|faltan|reponer)/i.test(t)) return { response: '', action: { type: 'alerts' }, needs_confirmation: false }
  if (/(?:inventario|lista|listar|todos los productos|muéstrame|muestrame|ver productos|qué tengo|que tengo)/i.test(t)) return { response: '', action: { type: 'list' }, needs_confirmation: false }

  return { response: 'No entendí. Diga "Ayuda" para ver opciones.', action: null, needs_confirmation: false }
}


// ═══════════════════════════════════════════════════════
// ─── Text-to-Speech ───
// ═══════════════════════════════════════════════════════
function speak(text, onEnd) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'es-MX'; utter.rate = 1.05; utter.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const mxVoice = voices.find(v => v.lang === 'es-MX') || voices.find(v => v.lang.startsWith('es'))
    if (mxVoice) utter.voice = mxVoice
    if (onEnd) utter.onend = onEnd
    window.speechSynthesis.speak(utter)
  }
}

function checkWakeWord(transcript) {
  const t = transcript.toLowerCase()
  return t.includes('hey sketch') || t.includes('oye sketch') || t.includes('sketch')
}


// ═══════════════════════════════════════════════════════
// ─── COMPONENTE PRINCIPAL ───
// ═══════════════════════════════════════════════════════
export default function SketchVoiceAssistant() {
  const [products, setProducts] = useState([])
  const [messages, setMessages] = useState([])
  const [chatHistory, setChatHistory] = useState([]) // Claude conversation history
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [wakeListening, setWakeListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingContext, setPendingContext] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [hasGreeted, setHasGreeted] = useState(false)
  const [aiMode, setAiMode] = useState(USE_CLAUDE ? 'claude' : 'local') // Track which mode is active
  const recognitionRef = useRef(null)
  const wakeRecognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  // ─── Smart greeting on first open ───
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting = getGreeting()
      const hour = new Date().getHours()
      let ctx = hour < 9 ? ' ¿Listo para abrir la tienda?' : hour < 14 ? ' ¿En qué le ayudo hoy?' : hour < 19 ? ' ¿Cómo va el día?' : ' ¿Hacemos el corte?'
      const welcomeText = `¡${greeting}! Soy Sketch, su asistente de inventario.${ctx} Toque el micrófono o diga "Hey Sketch".`
      setMessages([{ role: 'assistant', text: welcomeText, time: new Date() }])
      setHasGreeted(true)
      setIsSpeaking(true)
      speak(welcomeText, () => setIsSpeaking(false))
    }
  }, [isOpen, hasGreeted])

  useEffect(() => {
    async function load() {
      try {
        const data = await getProductos()
        setProducts(data)
        setLowStockProducts(data.filter(p => p.stock <= p.stock_minimo))
      } catch (err) { console.error(err) }
    }
    load()
    const unsub = suscribirProductos(() => load())
    return () => unsub()
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices() } }, [])

  const addMessage = useCallback((role, text) => { setMessages(prev => [...prev, { role, text, time: new Date() }]) }, [])

  const reloadProducts = useCallback(async () => {
    try { const data = await getProductos(); setProducts(data); setLowStockProducts(data.filter(p => p.stock <= p.stock_minimo)); return data }
    catch (err) { console.error(err); return products }
  }, [products])

  const respond = useCallback((text) => {
    setIsProcessing(false); addMessage('assistant', text); setIsSpeaking(true); speak(text, () => setIsSpeaking(false))
  }, [addMessage])

  // ─── Execute action ───
  const executeAction = useCallback(async (action) => {
    try {
      const { type, data } = action
      switch (type) {
        case 'add': {
          const n = await agregarProducto({ nombre: data.nombre, precio: data.precio || 0, stock: data.stock || 0, stock_minimo: data.stock_minimo || 5, categoria: data.categoria || 'General' })
          await reloadProducts()
          return `Registré "${n.nombre}" a $${n.precio}, ${n.stock} uds. Categoría: ${n.categoria}. ¿Algo más?`
        }
        case 'delete': { await eliminarProducto(data.id); await reloadProducts(); return `"${data.nombre}" eliminado. ¿Algo más?` }
        case 'editPrice': { await actualizarPrecio(data.id, data.nuevoPrecio); await reloadProducts(); return `Precio de "${data.nombre}" actualizado a $${data.nuevoPrecio}. ¿Algo más?` }
        case 'editStock': { await actualizarStock(data.id, data.nuevoStock); await reloadProducts(); return `Stock de "${data.nombre}": ${data.nuevoStock} uds. ¿Algo más?` }
        case 'addStock': { const u = await sumarStock(data.id, data.cantidad); await reloadProducts(); return `+${data.cantidad} a "${data.nombre}". Total: ${u.stock}. ¿Algo más?` }
        case 'sell': {
          const { registrarVenta } = await import('../services/ventasService')
          await registrarVenta({
            items: data.items.map(i => ({ producto_id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
            total: data.total, pago: data.total, cambio: 0
          })
          await reloadProducts()
          return `Venta registrada por $${data.total.toFixed(2)}. ¿Algo más?`
        }
        default: return 'Listo. ¿Algo más?'
      }
    } catch (err) { console.error(err); return 'Error al ejecutar. Intente de nuevo.' }
  }, [reloadProducts])

  // ─── Process command — HYBRID: Claude API + Local fallback ───
  const processCommand = useCallback(
    async (transcript) => {
      addMessage('user', transcript)
      setIsProcessing(true)

      const t = transcript.toLowerCase().replace(/[.!?]+$/, '').trim()

      // Handle confirmation
      if (pendingAction) {
        const isYes = /^(sí|si|dale|ok|okey|claro|confirmo|afirmativo|adelante|va|sale|perfecto|órale|arre|hazlo|jalo)$/i.test(t) ||
                      t.includes('sí') || t.includes('confirmo') || t.includes('dale')
        const isNo = /^(no|cancela|cancelar|mejor no|déjalo|nel|nada|descarta)$/i.test(t) ||
                     t.includes('cancela') || t.includes('mejor no')
        if (isYes) { const r = await executeAction(pendingAction); setPendingAction(null); setPendingContext(null); respond(r); return }
        if (isNo) { setPendingAction(null); setPendingContext(null); respond('Cancelado. ¿En qué más le ayudo?'); return }
      }

      let result = null

      // ─── TRY CLAUDE API FIRST ───
      if (USE_CLAUDE) {
        const newHistory = [...chatHistory, { role: 'user', content: transcript }].slice(-20)
        const claudeResult = await askClaude(newHistory, products)

        if (claudeResult) {
          // Claude responded successfully
          setAiMode('claude')
          setChatHistory([...newHistory, { role: 'assistant', content: JSON.stringify(claudeResult) }])
          result = claudeResult
        }
      }

      // ─── FALLBACK TO LOCAL NLP ───
      if (!result) {
        setAiMode('local')
        result = processLocalNLP(transcript, products, pendingContext)
        if (result.pendingContext !== undefined) setPendingContext(result.pendingContext)
      }

      // ─── Handle result ───
      if (result.action && result.action.type === 'dismiss') {
        // Farewell — respond and close panel after speaking
        setIsProcessing(false)
        addMessage('assistant', result.response)
        setIsSpeaking(true)
        speak(result.response, () => {
          setIsSpeaking(false)
          // Close panel after goodbye
          setTimeout(() => setIsOpen(false), 800)
        })
      } else if (result.action && result.needs_confirmation) {
        setPendingAction(result.action)
        respond(result.response)
      } else if (result.action && !result.needs_confirmation) {
        if (result.action.type === 'alerts') {
          const low = products.filter(p => p.stock <= (p.stock_minimo || 5))
          respond(low.length === 0 ? 'Sin stock bajo. Todo en orden.' : `${low.length} con stock bajo: ${low.map(p => `${p.nombre} (${p.stock})`).join(', ')}.`)
        } else if (result.action.type === 'list') {
          if (products.length === 0) respond('Inventario vacío. ¿Agregar algo?')
          else { const l = products.slice(0, 10).map(p => `${p.nombre}: ${p.stock} uds a $${p.precio}`).join('; '); respond(`${products.length} productos: ${l}${products.length > 10 ? '...' : '.'}`) }
        } else { respond(result.response) }
      } else { respond(result.response) }
    },
    [products, addMessage, chatHistory, pendingAction, pendingContext, executeAction, respond]
  )

  const stopWakeListener = useCallback(() => {
    if (wakeRecognitionRef.current) { try { wakeRecognitionRef.current.abort() } catch (e) {} wakeRecognitionRef.current = null }
    setWakeListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { addMessage('assistant', 'Navegador sin soporte de voz. Use Chrome.'); return }
    stopWakeListener()
    setTimeout(() => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const r = new SR(); r.lang = 'es-MX'; r.interimResults = true; r.continuous = false
      r.onstart = () => { setIsListening(true); setLiveTranscript('') }
      r.onresult = (e) => { let interim = '', final = ''; for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) final += e.results[i][0].transcript; else interim += e.results[i][0].transcript }; setLiveTranscript(final || interim); if (final) processCommand(final) }
      r.onerror = (e) => { setIsListening(false); setLiveTranscript(''); if (e.error !== 'no-speech' && e.error !== 'aborted') addMessage('assistant', 'No escuché. ¿Podría repetir?') }
      r.onend = () => { setIsListening(false); setLiveTranscript('') }
      recognitionRef.current = r; r.start()
    }, 350)
  }, [addMessage, processCommand, stopWakeListener])

  useEffect(() => {
    if (!isOpen) return
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    let active = true, rt = null
    const startWake = () => {
      if (!active || isListening || isSpeaking || isProcessing || recognitionRef.current) return
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const r = new SR(); r.lang = 'es-MX'; r.interimResults = false; r.continuous = true
      r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal && checkWakeWord(e.results[i][0].transcript)) { r.abort(); wakeRecognitionRef.current = null; setWakeListening(false); setTimeout(() => { if (active) startListening() }, 500) } } }
      r.onend = () => { setWakeListening(false); if (active && !isListening && !isSpeaking && !isProcessing) rt = setTimeout(startWake, 1000) }
      r.onerror = () => { setWakeListening(false); wakeRecognitionRef.current = null; if (active) rt = setTimeout(startWake, 1500) }
      wakeRecognitionRef.current = r; try { r.start(); setWakeListening(true) } catch (e) {}
    }
    const t = setTimeout(startWake, 1500)
    return () => { active = false; clearTimeout(t); if (rt) clearTimeout(rt); try { wakeRecognitionRef.current?.abort() } catch (e) {}; wakeRecognitionRef.current = null }
  }, [isOpen, isListening, isSpeaking, isProcessing, startListening])

  const quickActions = [
    { label: '📦 Agregar', command: 'Agrega un producto' },
    { label: '🛒 Vender', command: 'Quiero registrar una venta' },
    { label: '📋 Inventario', command: 'Muéstrame el inventario' },
    { label: '⚠️ Alertas', command: '¿Hay stock bajo?' },
  ]

  const formatTime = (d) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const hintText = isListening ? 'Escuchando...' : isSpeaking ? 'Respondiendo...' : isProcessing ? 'Pensando...' : pendingAction ? '"Sí" o "No"' : pendingContext ? 'Completando datos...' : 'Toque para hablar'

  return (
    <>
      <button className={`sketch-fab${lowStockProducts.length > 0 ? ' has-alerts' : ''}`} data-alerts={lowStockProducts.length} onClick={() => setIsOpen(!isOpen)} title="Sketch">
        {isOpen ? <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>}
      </button>

      <div className={`sketch-panel${isOpen ? ' open' : ''}`}>
        <div className="sketch-header">
          <div className="sketch-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0f1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg></div>
          <div className="sketch-header-info">
            <h3>SKETCH <span style={{ fontSize: 10, color: aiMode === 'claude' ? '#34D8E8' : '#8A9BBF', fontWeight: 400 }}>{aiMode === 'claude' ? '● Claude AI' : '● Local'}</span></h3>
            <div className="sketch-header-status">
              {isListening ? '🔴 Escuchando...' : isSpeaking ? '🔊 Hablando...' : isProcessing ? '🧠 Pensando...' : wakeListening ? '🎤 "Hey Sketch"' : pendingAction ? '⏳ Confirmación' : '✅ Listo'}
            </div>
          </div>
          <button className="sketch-close" onClick={() => setIsOpen(false)}><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 4L4 14M4 4l10 10" /></svg></button>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="sketch-alerts-bar" onClick={() => { const t = `${lowStockProducts.length} con stock bajo: ${lowStockProducts.map(p => `${p.nombre} (${p.stock})`).join(', ')}`; addMessage('assistant', t); setIsSpeaking(true); speak(`Atención. ${t}`, () => setIsSpeaking(false)) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
            <span>{lowStockProducts.length} con stock bajo</span>
          </div>
        )}

        <div className="sketch-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`sketch-msg ${msg.role}`}>
              {msg.role === 'assistant' && pendingAction && i === messages.length - 1 && <div className="sketch-pending-badge">⏳ Confirmar</div>}
              {msg.text}
              <div className="sketch-msg-time">{formatTime(msg.time)}</div>
            </div>
          ))}
          {isProcessing && <div className="sketch-msg assistant" style={{ opacity: 0.6 }}><div className="sketch-thinking-dots"><span></span><span></span><span></span></div>Pensando...</div>}
          <div ref={messagesEndRef} />
        </div>

        {isListening && liveTranscript && <div className="sketch-live"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /></svg>{liveTranscript}</div>}

        {!pendingAction && !pendingContext && !isListening && !isProcessing && !isSpeaking && messages.length <= 2 && (
          <div className="sketch-quick-actions">
            {quickActions.map((a, i) => <button key={i} className="sketch-quick-chip" onClick={() => { if (!isProcessing && !isSpeaking) processCommand(a.command) }}>{a.label}</button>)}
          </div>
        )}

        {pendingAction && !isProcessing && !isSpeaking && !isListening && (
          <div className="sketch-confirm-bar">
            <button className="sketch-confirm-btn yes" onClick={() => processCommand('Sí, confirmo')}>✓ Confirmar</button>
            <button className="sketch-confirm-btn no" onClick={() => processCommand('No, cancela')}>✗ Cancelar</button>
          </div>
        )}

        <div className="sketch-controls">
          <div className="sketch-controls-inner">
            <button className={`sketch-mic-btn${isListening ? ' listening' : ''}${pendingAction ? ' pending' : ''}`} onClick={startListening} disabled={isListening || isSpeaking || isProcessing}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
            </button>
            <span className="sketch-hint">{hintText}</span>
            {wakeListening && !isListening && !isSpeaking && !isProcessing && <span className="sketch-wake-badge">🎤 "Hey Sketch"</span>}
          </div>
        </div>
      </div>
    </>
  )
}