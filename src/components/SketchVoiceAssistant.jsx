// src/components/SketchVoiceAssistant.jsx
// Asistente de voz para Sketch v4 — Motor NLP LOCAL (SIN API)
// Funciona 100% offline, sin backend, sin CORS
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
// ─── MOTOR NLP LOCAL — Sin API, sin backend ───
// ═══════════════════════════════════════════════════════

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Corrección de nombres comunes mal captados por voz
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

// Categoría automática por producto
const CATEGORY_MAP = {
  'Bebidas': ['coca-cola', 'pepsi', 'fanta', 'mirinda', 'sprite', 'ciel', 'bonafont', 'tang', 'jumex', 'boing', 'jarritos', 'manzanita', 'squirt', 'fresca', 'sidral', 'agua', 'refresco', 'jugo', 'limonada'],
  'Botanas': ['sabritas', 'doritos', 'cheetos', 'ruffles', 'takis', 'cacahuates', 'papas', 'chicharrones', 'palomitas', 'totis', 'barcel'],
  'Panadería': ['bimbo', 'marinela', 'gansito', 'chokis', 'pan', 'galletas', 'gamesa', 'tortillas', 'wonder', 'pingüinos', 'mantecadas'],
  'Lácteos': ['lala', 'alpura', 'leche', 'queso', 'yogurt', 'crema', 'mantequilla', 'danonino'],
  'Abarrotes': ['maruchan', 'atún', 'arroz', 'frijol', 'frijoles', 'aceite', 'azúcar', 'azucar', 'sal', 'harina', 'sopa', 'pasta', 'nescafé', 'café', 'avena', 'cereal', 'zucaritas', 'mayonesa'],
  'Limpieza': ['pinol', 'fabuloso', 'cloralex', 'jabón', 'jabon', 'detergente', 'cloro', 'papel', 'servilletas', 'escoba', 'trapeador'],
  'Dulcería': ['dulce', 'chicle', 'paleta', 'mazapán', 'chocolate', 'gomitas', 'luneta', 'carlos v', 'pulparindo', 'pelon', 'vero'],
  'Farmacia': ['aspirina', 'paracetamol', 'alcohol', 'curitas', 'algodón', 'pepto'],
  'Cerveza': ['modelo', 'corona', 'tecate', 'victoria', 'indio', 'pacifico', 'cerveza', 'michelob', 'heineken'],
  'Tabaco': ['cigarro', 'cigarros', 'marlboro', 'camel', 'pall mall', 'encendedor'],
}

function detectCategory(productName) {
  const lower = productName.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return cat
  }
  return 'General'
}

function correctProductName(raw) {
  const lower = raw.toLowerCase().trim()
  for (const [wrong, correct] of Object.entries(VOICE_CORRECTIONS)) {
    if (lower === wrong || lower.includes(wrong)) {
      const remaining = lower.replace(wrong, '').trim()
      return remaining ? `${correct} ${remaining}` : correct
    }
  }
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase())
}

// Extract presentation/size from text
function extractPresentation(text) {
  const t = text.toLowerCase()
  const patterns = [
    /(\d+)\s*ml/i,
    /(\d+(?:\.\d+)?)\s*(?:litros?|lt?|lts)/i,
    /(\d+)\s*(?:gramos?|gr?|gs)/i,
    /(\d+)\s*(?:kilos?|kg)/i,
    /(\d+)\s*(?:piezas?|pzs?|pz)/i,
    /(\d+)\s*(?:pack|paquete)/i,
  ]
  for (const pat of patterns) {
    const m = t.match(pat)
    if (m) {
      if (/litros?|lt|lts/i.test(m[0])) return `${m[1]}L`
      if (/ml/i.test(m[0])) return `${m[1]}ml`
      if (/gramos?|gr?|gs/i.test(m[0])) return `${m[1]}g`
      if (/kilos?|kg/i.test(m[0])) return `${m[1]}kg`
      if (/piezas?|pzs?|pz/i.test(m[0])) return `${m[1]}pz`
      if (/pack|paquete/i.test(m[0])) return `Pack ${m[1]}`
      return m[0]
    }
  }
  if (/\blata\b/i.test(t)) return 'Lata'
  if (/\bbotella\b/i.test(t)) return 'Botella'
  if (/\bsobr(?:e|es?)\b/i.test(t)) return 'Sobre'
  if (/\bbolsa\b/i.test(t)) return 'Bolsa'
  if (/\bcaja\b/i.test(t)) return 'Caja'
  if (/\bfrasco\b/i.test(t)) return 'Frasco'
  if (/\bchico\b/i.test(t)) return 'Chico'
  if (/\bmediano\b/i.test(t)) return 'Mediano'
  if (/\bgrande\b/i.test(t)) return 'Grande'
  if (/\bfamiliar\b/i.test(t)) return 'Familiar'
  if (/\bpersonal\b/i.test(t)) return 'Personal'
  return null
}

// Extract price from text
function extractPrice(text) {
  const t = text.toLowerCase()
  const patterns = [
    /(?:a|por|precio(?:\s+de)?|cuesta|vale|de|en|con(?:\s+un)?(?:\s+precio)?(?:\s+de)?)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:pesos|varos|bolas)?/i,
    /\$\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:pesos|varos|bolas)/i,
  ]
  for (const pat of patterns) {
    const m = t.match(pat)
    if (m) return parseFloat(m[1])
  }
  return null
}

// Extract stock/quantity from text
function extractStock(text) {
  const t = text.toLowerCase()
  const patterns = [
    /(?:con|stock(?:\s+de)?|cantidad(?:\s+de)?|existencia(?:\s+de)?|tengo|hay|inicio(?:\s+con)?|empiezo(?:\s+con)?)\s+(\d+)\s*(?:unidades|piezas|en\s+stock|en\s+existencia)?/i,
    /(\d+)\s*(?:unidades|piezas|en\s+stock|en\s+existencia|de\s+stock)/i,
  ]
  for (const pat of patterns) {
    const m = t.match(pat)
    if (m) return parseInt(m[1])
  }
  return null
}

// Extract the product name from an "add" command
function extractProductNameFromAdd(text) {
  const t = text.toLowerCase()
  let cleaned = t
    .replace(/^(?:agrega|agregar|añade|añadir|registra|registrar|mete|meter|pon|poner|da de alta|nuevo producto|quiero agregar|agrega un|agrega una|agregar un|agregar una|registra un|registra una|añade un|añade una|mete un|mete una|quiero agregar un|quiero agregar una)\s*/i, '')
    .trim()
  
  // Remove price, stock info to isolate the product name
  cleaned = cleaned
    .replace(/(?:a|por|precio(?:\s+de)?|cuesta|vale|con(?:\s+un)?(?:\s+precio)?(?:\s+de)?)\s+\$?\s*\d+(?:\.\d{1,2})?\s*(?:pesos|varos|bolas)?/gi, '')
    .replace(/\$\s*\d+(?:\.\d{1,2})?/g, '')
    .replace(/\d+(?:\.\d{1,2})?\s*(?:pesos|varos|bolas)/gi, '')
    .replace(/(?:con|stock(?:\s+de)?|cantidad(?:\s+de)?|existencia(?:\s+de)?|tengo|hay)\s+\d+\s*(?:unidades|piezas|en\s+stock|en\s+existencia)?/gi, '')
    .replace(/\d+\s*(?:unidades|piezas|en\s+stock|en\s+existencia|de\s+stock)/gi, '')
    .replace(/\s*,\s*/g, ' ')
    .replace(/\s+y\s+$/g, '')
    .replace(/\s+con\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned || null
}

// Find a product in inventory by partial name match
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

// Products that typically need a presentation specified
const NEEDS_PRESENTATION = ['coca-cola', 'pepsi', 'fanta', 'sprite', 'mirinda', 'ciel', 'bonafont', 'modelo', 'corona', 'tecate', 'victoria', 'sabritas', 'doritos', 'cheetos', 'ruffles', 'takis', 'bimbo', 'marinela', 'maruchan', 'leche', 'lala', 'alpura', 'jumex', 'boing', 'jarritos', 'tang', 'nescafé']

function needsPresentation(productName) {
  const lower = productName.toLowerCase()
  return NEEDS_PRESENTATION.some(p => lower.includes(p))
}

// ─── Main NLP Processor ───
function processLocalNLP(transcript, products, pendingCtx) {
  const t = transcript.toLowerCase().replace(/[.!?]+$/, '').trim()

  // ─── GREETING ───
  if (/^(hola|hey|buenas?|qué onda|que onda|qué tal|que tal|buenos días|buenas tardes|buenas noches|saludos|qué hay|que hay|ey|oye)(\s|$)/i.test(t) && t.length < 40) {
    const greeting = getGreeting()
    const hour = new Date().getHours()
    let extra = ''
    if (hour >= 5 && hour < 9) extra = ' ¿Listo para empezar el día? Dígame en qué le ayudo.'
    else if (hour >= 9 && hour < 14) extra = ' ¿En qué le puedo ayudar hoy?'
    else if (hour >= 14 && hour < 19) extra = ' ¿Cómo va la tienda? Dígame en qué le ayudo.'
    else extra = ' ¿En qué le ayudo? ¿Hacemos corte o revisamos algo?'
    return { response: `¡${greeting}! Aquí Sketch a sus órdenes.${extra}`, action: null, needs_confirmation: false }
  }

  // ─── HELP ───
  if (/^(ayuda|qué puedes hacer|que puedes hacer|cómo funciona|como funciona|opciones|comandos|qué sabes hacer|que sabes hacer|ayúdame)$/i.test(t)) {
    return {
      response: 'Puedo ayudarle con su inventario. Diga por ejemplo: "Agrega una Coca-Cola de 600 ml a 18 pesos con 24 en stock", o "Cuánto cuesta la leche", o "Qué productos tienen stock bajo", o "Muéstrame el inventario".',
      action: null, needs_confirmation: false
    }
  }

  // ─── THANKS ───
  if (/^(gracias|muchas gracias|te agradezco|chido|buena onda|genial|excelente|perfecto|bien hecho)/i.test(t)) {
    const responses = [
      '¡Para servirle! ¿Algo más en que le ayude?',
      '¡Con gusto! Aquí estoy si necesita algo más.',
      '¡De nada! Dígame si necesita otra cosa.',
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], action: null, needs_confirmation: false }
  }

  // ─── PENDING CONTEXT: Waiting for missing data ───
  if (pendingCtx) {
    const ctx = { ...pendingCtx }

    // Waiting for product name
    if (ctx.waitingFor === 'name') {
      // The user just said the product name (and maybe more data too)
      const presentation = extractPresentation(t)
      const price = extractPrice(t)
      const stock = extractStock(t)
      let correctedName = correctProductName(t
        .replace(/(?:a|por|precio(?:\s+de)?|cuesta|vale|con(?:\s+un)?(?:\s+precio)?(?:\s+de)?)\s+\$?\s*\d+(?:\.\d{1,2})?\s*(?:pesos|varos|bolas)?/gi, '')
        .replace(/\$\s*\d+(?:\.\d{1,2})?/g, '')
        .replace(/\d+(?:\.\d{1,2})?\s*(?:pesos|varos|bolas)/gi, '')
        .replace(/(?:con|stock(?:\s+de)?|cantidad(?:\s+de)?|existencia(?:\s+de)?|tengo|hay)\s+\d+\s*(?:unidades|piezas|en\s+stock|en\s+existencia)?/gi, '')
        .replace(/\d+\s*(?:unidades|piezas|en\s+stock|en\s+existencia|de\s+stock)/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      )
      if (!correctedName || correctedName.length < 2) {
        return { response: 'No capté el nombre. Dígame el producto, por ejemplo: Coca-Cola, Sabritas, Maruchan...', action: null, needs_confirmation: false, pendingContext: ctx }
      }
      const categoria = detectCategory(correctedName)

      if (presentation && !correctedName.toLowerCase().includes(presentation.toLowerCase())) {
        correctedName = `${correctedName} ${presentation}`
      }

      if (!presentation && needsPresentation(correctedName)) {
        return {
          response: `${correctedName}, perfecto. ¿De qué presentación? Por ejemplo: 600 ml, 1 litro, lata, botella...`,
          action: null, needs_confirmation: false,
          pendingContext: { waitingFor: 'presentation', baseName: correctedName, nombre: correctedName, precio: price, stock, categoria, stock_minimo: 5 }
        }
      }
      if (!price) {
        return {
          response: `${correctedName}, entendido. ¿A cómo lo va a vender?`,
          action: null, needs_confirmation: false,
          pendingContext: { waitingFor: 'price', nombre: correctedName, precio: null, stock, categoria, stock_minimo: 5 }
        }
      }
      if (stock == null) {
        return {
          response: `${correctedName} a $${price}. ¿Cuántas unidades tiene en existencia?`,
          action: null, needs_confirmation: false,
          pendingContext: { waitingFor: 'stock', nombre: correctedName, precio: price, stock: null, categoria, stock_minimo: 5 }
        }
      }
      return {
        response: `Voy a registrar ${correctedName} a $${price}, con ${stock} unidades, categoría ${categoria}. ¿Confirmo?`,
        action: { type: 'add', data: { nombre: correctedName, precio: price, stock, stock_minimo: 5, categoria } },
        needs_confirmation: true, pendingContext: null
      }
    }

    // Waiting for presentation
    if (ctx.waitingFor === 'presentation') {
      const pres = extractPresentation(t)
      if (pres) {
        ctx.nombre = `${ctx.baseName} ${pres}`
        if (!ctx.precio) {
          ctx.waitingFor = 'price'
          return { response: `Perfecto, ${ctx.nombre}. ¿A cómo lo va a vender?`, action: null, needs_confirmation: false, pendingContext: ctx }
        }
        if (ctx.stock == null) {
          ctx.waitingFor = 'stock'
          return { response: `${ctx.nombre} a $${ctx.precio}. ¿Cuántas unidades tiene en existencia?`, action: null, needs_confirmation: false, pendingContext: ctx }
        }
        return {
          response: `Voy a registrar ${ctx.nombre} a $${ctx.precio}, con ${ctx.stock} unidades, categoría ${ctx.categoria}. ¿Confirmo?`,
          action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock: ctx.stock, stock_minimo: ctx.stock_minimo || 5, categoria: ctx.categoria } },
          needs_confirmation: true, pendingContext: null
        }
      }
      const raw = t.trim()
      if (raw.length > 0 && raw.length < 30) {
        ctx.nombre = `${ctx.baseName} ${correctProductName(raw)}`
        if (!ctx.precio) {
          ctx.waitingFor = 'price'
          return { response: `Entendido, ${ctx.nombre}. ¿A qué precio lo vende?`, action: null, needs_confirmation: false, pendingContext: ctx }
        }
        if (ctx.stock == null) {
          ctx.waitingFor = 'stock'
          return { response: `${ctx.nombre} a $${ctx.precio}. ¿Con cuántas unidades empieza?`, action: null, needs_confirmation: false, pendingContext: ctx }
        }
        return {
          response: `Voy a registrar ${ctx.nombre} a $${ctx.precio}, con ${ctx.stock} unidades, categoría ${ctx.categoria}. ¿Confirmo?`,
          action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock: ctx.stock, stock_minimo: ctx.stock_minimo || 5, categoria: ctx.categoria } },
          needs_confirmation: true, pendingContext: null
        }
      }
      return { response: 'No entendí la presentación. Dígame por ejemplo: 600 ml, 1 litro, lata, botella...', action: null, needs_confirmation: false, pendingContext: ctx }
    }

    // Waiting for price
    if (ctx.waitingFor === 'price') {
      const price = extractPrice(t) || parseFloat(t.replace(/[^0-9.]/g, ''))
      if (price && price > 0) {
        ctx.precio = price
        if (ctx.stock == null) {
          ctx.waitingFor = 'stock'
          return { response: `$${price}, anotado. ¿Cuántas unidades tiene en existencia?`, action: null, needs_confirmation: false, pendingContext: ctx }
        }
        return {
          response: `Voy a registrar ${ctx.nombre} a $${ctx.precio}, con ${ctx.stock} unidades, categoría ${ctx.categoria}. ¿Confirmo?`,
          action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock: ctx.stock, stock_minimo: ctx.stock_minimo || 5, categoria: ctx.categoria } },
          needs_confirmation: true, pendingContext: null
        }
      }
      return { response: 'No capté el precio. Dígame solo el número, por ejemplo: 18 pesos o 25.50', action: null, needs_confirmation: false, pendingContext: ctx }
    }

    // Waiting for stock
    if (ctx.waitingFor === 'stock') {
      const stock = extractStock(t) || parseInt(t.replace(/[^0-9]/g, ''))
      if (stock >= 0 && !isNaN(stock)) {
        ctx.stock = stock
        return {
          response: `Voy a registrar ${ctx.nombre} a $${ctx.precio}, con ${ctx.stock} unidades, categoría ${ctx.categoria}. ¿Confirmo?`,
          action: { type: 'add', data: { nombre: ctx.nombre, precio: ctx.precio, stock: ctx.stock, stock_minimo: ctx.stock_minimo || 5, categoria: ctx.categoria } },
          needs_confirmation: true, pendingContext: null
        }
      }
      return { response: 'No entendí la cantidad. Dígame solo el número, por ejemplo: 24', action: null, needs_confirmation: false, pendingContext: ctx }
    }

    // Waiting for which product (multiple matches)
    if (ctx.waitingFor === 'which_product') {
      const match = ctx.options.find(p => t.includes(p.nombre.toLowerCase()) || p.nombre.toLowerCase().includes(t))
      if (match) {
        if (ctx.originalAction === 'price_query') {
          return { response: `${match.nombre} tiene un precio de $${match.precio}.`, action: null, needs_confirmation: false }
        }
        if (ctx.originalAction === 'stock_query') {
          return { response: `${match.nombre} tiene ${match.stock} unidades en stock.`, action: null, needs_confirmation: false }
        }
        if (ctx.originalAction === 'delete') {
          return {
            response: `Voy a eliminar "${match.nombre}" del inventario. ¿Confirmo?`,
            action: { type: 'delete', data: { id: match.id, nombre: match.nombre } },
            needs_confirmation: true, pendingContext: null
          }
        }
      }
      const num = parseInt(t.replace(/[^0-9]/g, ''))
      if (num >= 1 && num <= ctx.options.length) {
        const selected = ctx.options[num - 1]
        if (ctx.originalAction === 'price_query') return { response: `${selected.nombre} tiene un precio de $${selected.precio}.`, action: null, needs_confirmation: false }
        if (ctx.originalAction === 'stock_query') return { response: `${selected.nombre} tiene ${selected.stock} unidades en stock.`, action: null, needs_confirmation: false }
      }
      return { response: 'No identifiqué cuál. Dígame el nombre completo o el número de la opción.', action: null, needs_confirmation: false, pendingContext: ctx }
    }
  }

  // ─── ADD PRODUCT ───
  if (/(?:agrega|agregar|añade|añadir|registra|registrar|mete|meter|pon|poner|da de alta|nuevo producto|quiero agregar)/i.test(t)) {
    const rawName = extractProductNameFromAdd(transcript)
    if (!rawName || /^(un|una|el|la|los|las|producto|un producto|una producto)$/i.test(rawName.trim())) {
      return {
        response: '¿Qué producto quiere agregar? Dígame el nombre, por ejemplo: Coca-Cola de 600 ml.',
        action: null, needs_confirmation: false,
        pendingContext: { waitingFor: 'name' }
      }
    }

    const presentation = extractPresentation(t)
    const price = extractPrice(t)
    const stock = extractStock(t)
    let correctedName = correctProductName(rawName)
    const categoria = detectCategory(correctedName)
    
    if (presentation && !correctedName.toLowerCase().includes(presentation.toLowerCase())) {
      correctedName = `${correctedName} ${presentation}`
    }

    // If product typically needs presentation and none given
    if (!presentation && needsPresentation(correctedName)) {
      return {
        response: `${correctedName}, perfecto. ¿De qué presentación? Por ejemplo: 600 ml, 1 litro, lata, botella...`,
        action: null, needs_confirmation: false,
        pendingContext: { waitingFor: 'presentation', baseName: correctedName, nombre: correctedName, precio: price, stock, categoria, stock_minimo: 5 }
      }
    }

    if (!price) {
      return {
        response: `${correctedName}, entendido. ¿A cómo lo va a vender?`,
        action: null, needs_confirmation: false,
        pendingContext: { waitingFor: 'price', nombre: correctedName, precio: null, stock, categoria, stock_minimo: 5 }
      }
    }

    if (stock == null) {
      return {
        response: `${correctedName} a $${price}. ¿Cuántas unidades tiene en existencia?`,
        action: null, needs_confirmation: false,
        pendingContext: { waitingFor: 'stock', nombre: correctedName, precio: price, stock: null, categoria, stock_minimo: 5 }
      }
    }

    return {
      response: `Voy a registrar ${correctedName} a $${price}, con ${stock} unidades, categoría ${categoria}. ¿Confirmo?`,
      action: { type: 'add', data: { nombre: correctedName, precio: price, stock, stock_minimo: 5, categoria } },
      needs_confirmation: true, pendingContext: null
    }
  }

  // ─── DELETE PRODUCT ───
  if (/(?:elimina|eliminar|borra|borrar|quita|quitar|saca|sacar|da de baja)/i.test(t)) {
    const nameRaw = t.replace(/(?:elimina|eliminar|borra|borrar|quita|quitar|saca|sacar|da de baja)\s*/i, '').replace(/^(el|la|los|las|un|una|del|de la)\s+/i, '').trim()
    if (!nameRaw) return { response: '¿Qué producto quiere eliminar?', action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      return { response: `Voy a eliminar "${p.nombre}" del inventario. ¿Confirmo?`, action: { type: 'delete', data: { id: p.id, nombre: p.nombre } }, needs_confirmation: true }
    }
    const list = result.products.map((p, i) => `${i + 1}. ${p.nombre}`).join(', ')
    return { response: `Encontré varios: ${list}. ¿Cuál quiere eliminar?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'which_product', options: result.products, originalAction: 'delete' } }
  }

  // ─── EDIT PRICE ───
  if (/(?:cambia|cambiar|actualiza|actualizar|modifica|modificar|pon|poner)\s.*(?:precio)/i.test(t) || /precio.*(?:a|de)\s+\$?\d/i.test(t)) {
    const newPrice = extractPrice(t)
    let nameRaw = t.replace(/(?:cambia|cambiar|actualiza|actualizar|modifica|modificar|pon|poner)\s*(el\s+)?precio\s*(de\s*(la|el|los|las)?\s*)?/i, '')
      .replace(/\s*(?:a|por|en)\s+\$?\s*\d+(?:\.\d{1,2})?\s*(?:pesos|varos)?/gi, '')
      .replace(/^\s*(de\s*(la|el)?\s*)?/i, '')
      .trim()
    
    if (!nameRaw) return { response: '¿A qué producto le cambio el precio?', action: null, needs_confirmation: false }
    if (!newPrice) return { response: `¿A cuánto quiere el nuevo precio de ${nameRaw}?`, action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      return { response: `Cambiar precio de "${p.nombre}" de $${p.precio} a $${newPrice}. ¿Confirmo?`, action: { type: 'editPrice', data: { id: p.id, nombre: p.nombre, nuevoPrecio: newPrice } }, needs_confirmation: true }
    }
    return { response: `Encontré varios: ${result.products.map(p => p.nombre).join(', ')}. ¿A cuál?`, action: null, needs_confirmation: false }
  }

  // ─── ADD STOCK (restock) ───
  if (/(?:llegaron|llegó|recibí|entrada|surtieron|surtir|sumar|suma)\s+\d+/i.test(t) || /\d+\s+(?:más|mas)\s+de/i.test(t)) {
    const qtyMatch = t.match(/(\d+)/)
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : null
    let nameRaw = t.replace(/(?:llegaron|llegó|recibí|entrada de|surtieron|sumar|suma)\s*/i, '')
      .replace(/\d+\s*(unidades|piezas|más|mas)?\s*(de\s*(la|el|los|las)?\s*)?/gi, '')
      .replace(/^(de\s*(la|el)?\s*)/i, '')
      .trim()
    
    if (!qty || !nameRaw) return { response: 'Dígame cuántas unidades y de qué producto. Ejemplo: "Llegaron 24 de Coca-Cola".', action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      return { response: `Sumar ${qty} unidades a "${p.nombre}" (actualmente ${p.stock}). ¿Confirmo?`, action: { type: 'addStock', data: { id: p.id, nombre: p.nombre, cantidad: qty } }, needs_confirmation: true }
    }
    return { response: `Encontré varios: ${result.products.map(p => p.nombre).join(', ')}. ¿A cuál le sumo?`, action: null, needs_confirmation: false }
  }

  // ─── EDIT STOCK ───
  if (/(?:cambia|cambiar|actualiza|actualizar|pon|poner)\s.*(?:stock|existencia|inventario|unidades)/i.test(t)) {
    const newStock = extractStock(t) || parseInt((t.match(/(\d+)\s*(?:unidades|piezas)?/i) || [])[1])
    let nameRaw = t.replace(/(?:cambia|cambiar|actualiza|actualizar|pon|poner)\s*(el\s+)?(?:stock|existencia|inventario|unidades)\s*(de\s*(la|el|los|las)?\s*)?/i, '')
      .replace(/\s*(?:a|en|con)\s+\d+\s*(?:unidades|piezas)?/gi, '')
      .trim()
    
    if (!nameRaw) return { response: '¿A qué producto le cambio el stock?', action: null, needs_confirmation: false }
    if (!newStock && newStock !== 0) return { response: `¿Cuántas unidades debe tener ${nameRaw}?`, action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      return { response: `Cambiar stock de "${p.nombre}" de ${p.stock} a ${newStock}. ¿Confirmo?`, action: { type: 'editStock', data: { id: p.id, nombre: p.nombre, nuevoStock: newStock } }, needs_confirmation: true }
    }
    return { response: `Encontré varios: ${result.products.map(p => p.nombre).join(', ')}. ¿A cuál?`, action: null, needs_confirmation: false }
  }

  // ─── PRICE QUERY ───
  if (/(?:cuánto|cuanto|qué precio|que precio|a cómo|a como|precio de|cuánto cuesta|cuanto cuesta|cuánto vale|cuanto vale)/i.test(t)) {
    let nameRaw = t.replace(/(?:cuánto|cuanto|qué precio|que precio|a cómo|a como)\s*(cuesta|vale|está|tiene|es)?\s*(la|el|los|las|de la|del|de el)?\s*/i, '')
      .replace(/^(?:precio\s+de\s*(la|el)?\s*)/i, '')
      .replace(/\?/g, '')
      .trim()
    if (!nameRaw) return { response: '¿De qué producto quiere saber el precio?', action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      return { response: `${p.nombre} tiene un precio de $${p.precio}.`, action: null, needs_confirmation: false }
    }
    const list = result.products.map((p, i) => `${i + 1}. ${p.nombre} a $${p.precio}`).join(', ')
    return { response: `Encontré varios: ${list}. ¿De cuál?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'which_product', options: result.products, originalAction: 'price_query' } }
  }

  // ─── STOCK QUERY ───
  if (/(?:cuántos?|cuantos?|qué stock|que stock|stock de|existencia|hay de|cuántos? (?:hay|tiene|queda))/i.test(t)) {
    let nameRaw = t.replace(/(?:cuántos?|cuantos?|qué stock|que stock)\s*(hay|tiene|queda|quedan)?\s*(de\s*(la|el|los|las)?\s*)?/i, '')
      .replace(/^(?:stock|existencia)\s*(de\s*(la|el)?\s*)?/i, '')
      .replace(/^(?:hay\s+de\s*(la|el)?\s*)/i, '')
      .replace(/\?/g, '')
      .trim()
    if (!nameRaw) return { response: '¿De qué producto quiere saber el stock?', action: null, needs_confirmation: false }
    
    const result = findProduct(products, nameRaw)
    if (result.products.length === 0) return { response: `No encontré "${nameRaw}" en el inventario.`, action: null, needs_confirmation: false }
    if (result.products.length === 1) {
      const p = result.products[0]
      const status = p.stock <= p.stock_minimo ? ' Atención, stock bajo.' : ''
      return { response: `${p.nombre} tiene ${p.stock} unidades en stock.${status}`, action: null, needs_confirmation: false }
    }
    const list = result.products.map((p, i) => `${i + 1}. ${p.nombre} con ${p.stock}`).join(', ')
    return { response: `Encontré varios: ${list}. ¿De cuál?`, action: null, needs_confirmation: false, pendingContext: { waitingFor: 'which_product', options: result.products, originalAction: 'stock_query' } }
  }

  // ─── ALERTS ───
  if (/(?:alertas?|stock bajo|productos? bajo|falta|faltan|que falta|reponer|reorden|mínimo)/i.test(t)) {
    return { response: '', action: { type: 'alerts' }, needs_confirmation: false }
  }

  // ─── LIST ───
  if (/(?:inventario|lista|listar|todos los productos|muéstrame|muestrame|ver productos|qué tengo|que tengo|qué hay|que hay)/i.test(t)) {
    return { response: '', action: { type: 'list' }, needs_confirmation: false }
  }

  // ─── FALLBACK ───
  return {
    response: 'Disculpe, no entendí. Puede decir: "Agrega una Coca de 600 ml a 18 pesos con 24 en stock", "Cuánto cuesta la leche", "Stock bajo", o diga "Ayuda".',
    action: null, needs_confirmation: false
  }
}


// ═══════════════════════════════════════════════════════
// ─── Text-to-Speech ───
// ═══════════════════════════════════════════════════════
function speak(text, onEnd) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'es-MX'
    utter.rate = 1.05
    utter.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const mxVoice = voices.find(v => v.lang === 'es-MX') || voices.find(v => v.lang.startsWith('es'))
    if (mxVoice) utter.voice = mxVoice
    if (onEnd) utter.onend = onEnd
    window.speechSynthesis.speak(utter)
  }
}

function checkWakeWord(transcript) {
  const t = transcript.toLowerCase()
  return t.includes('hey sketch') || t.includes('oye sketch') || t.includes('sketch') || t.includes('ella sketch') || t.includes('el sketch')
}


// ═══════════════════════════════════════════════════════
// ─── COMPONENTE PRINCIPAL ───
// ═══════════════════════════════════════════════════════
export default function SketchVoiceAssistant() {
  const [products, setProducts] = useState([])
  const [messages, setMessages] = useState([])
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
  const recognitionRef = useRef(null)
  const wakeRecognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  // ─── Smart greeting on first open ───
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting = getGreeting()
      const hour = new Date().getHours()
      let timeContext = ''
      if (hour >= 5 && hour < 9) timeContext = ' ¿Listo para abrir la tienda?'
      else if (hour >= 9 && hour < 14) timeContext = ' ¿En qué le ayudo hoy?'
      else if (hour >= 14 && hour < 19) timeContext = ' ¿Cómo va el día en la tienda?'
      else timeContext = ' ¿Hacemos el corte o en qué le ayudo?'

      const welcomeText = `¡${greeting}! Soy Sketch, su asistente de inventario.${timeContext} Toque el micrófono o diga "Hey Sketch".`
      setMessages([{ role: 'assistant', text: welcomeText, time: new Date() }])
      setHasGreeted(true)
      setIsSpeaking(true)
      speak(welcomeText, () => setIsSpeaking(false))
    }
  }, [isOpen, hasGreeted])

  // ─── Load products ───
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

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const addMessage = useCallback((role, text) => {
    setMessages(prev => [...prev, { role, text, time: new Date() }])
  }, [])

  const reloadProducts = useCallback(async () => {
    try {
      const data = await getProductos()
      setProducts(data)
      setLowStockProducts(data.filter(p => p.stock <= p.stock_minimo))
      return data
    } catch (err) { console.error(err); return products }
  }, [products])

  const respond = useCallback((text) => {
    setIsProcessing(false)
    addMessage('assistant', text)
    setIsSpeaking(true)
    speak(text, () => setIsSpeaking(false))
  }, [addMessage])

  // ─── Execute a confirmed action ───
  const executeAction = useCallback(async (action) => {
    try {
      const { type, data } = action
      switch (type) {
        case 'add': {
          const nuevo = await agregarProducto({
            nombre: data.nombre, precio: data.precio || 0, stock: data.stock || 0,
            stock_minimo: data.stock_minimo || 5, categoria: data.categoria || 'General'
          })
          await reloadProducts()
          return `Listo, registré "${nuevo.nombre}" a $${nuevo.precio}, con ${nuevo.stock} unidades. Categoría: ${nuevo.categoria}. ¿Algo más?`
        }
        case 'delete': {
          await eliminarProducto(data.id)
          await reloadProducts()
          return `"${data.nombre}" eliminado del inventario. ¿Algo más?`
        }
        case 'editPrice': {
          await actualizarPrecio(data.id, data.nuevoPrecio)
          await reloadProducts()
          return `Precio de "${data.nombre}" actualizado a $${data.nuevoPrecio}. ¿Algo más?`
        }
        case 'editStock': {
          await actualizarStock(data.id, data.nuevoStock)
          await reloadProducts()
          return `Stock de "${data.nombre}" actualizado a ${data.nuevoStock} unidades. ¿Algo más?`
        }
        case 'addStock': {
          const updated = await sumarStock(data.id, data.cantidad)
          await reloadProducts()
          return `Se sumaron ${data.cantidad} a "${data.nombre}". Ahora tiene ${updated.stock} en total. ¿Algo más?`
        }
        default: return 'Acción completada. ¿Algo más?'
      }
    } catch (err) {
      console.error('Error ejecutando acción:', err)
      return 'Hubo un error al ejecutar la operación. Intente de nuevo.'
    }
  }, [reloadProducts])

  // ─── Process voice command (LOCAL — sin API) ───
  const processCommand = useCallback(
    async (transcript) => {
      addMessage('user', transcript)
      setIsProcessing(true)

      const t = transcript.toLowerCase().replace(/[.!?]+$/, '').trim()

      // ─── Handle confirmation of pending action ───
      if (pendingAction) {
        const isYes = /^(sí|si|dale|ok|okey|claro|confirmo|afirmativo|está bien|adelante|por favor|ándale|ándele|va|sale|perfecto|de acuerdo|órale|arre|hazlo|jalo)$/i.test(t) ||
                      t.includes('sí') || t.includes('confirmo') || t.includes('dale') || t.includes('adelante')
        const isNo = /^(no|cancela|cancelar|mejor no|déjalo|dejalo|olvídalo|olvidalo|nel|nada|descarta|ya no|no gracias)$/i.test(t) ||
                     t.includes('cancela') || t.includes('no lo') || t.includes('mejor no')

        if (isYes) {
          const result = await executeAction(pendingAction)
          setPendingAction(null)
          setPendingContext(null)
          respond(result)
          return
        } else if (isNo) {
          setPendingAction(null)
          setPendingContext(null)
          respond('Operación cancelada. ¿En qué más le ayudo?')
          return
        }
      }

      // ─── Process with LOCAL NLP (no API!) ───
      const result = processLocalNLP(transcript, products, pendingContext)

      if (result.pendingContext !== undefined) {
        setPendingContext(result.pendingContext)
      }

      if (result.action && result.needs_confirmation) {
        setPendingAction(result.action)
        respond(result.response)
      } else if (result.action && !result.needs_confirmation) {
        if (result.action.type === 'alerts') {
          const low = products.filter(p => p.stock <= p.stock_minimo)
          if (low.length === 0) respond('No hay productos con stock bajo. Todo en orden.')
          else respond(`Hay ${low.length} producto${low.length > 1 ? 's' : ''} con stock bajo: ${low.map(p => `${p.nombre} con ${p.stock}`).join(', ')}.`)
        } else if (result.action.type === 'list') {
          if (products.length === 0) respond('El inventario está vacío. ¿Desea agregar un producto?')
          else {
            const list = products.slice(0, 10).map(p => `${p.nombre}, ${p.stock} unidades a $${p.precio}`).join('; ')
            respond(`Tiene ${products.length} productos: ${list}${products.length > 10 ? `, y ${products.length - 10} más.` : '.'}`)
          }
        } else {
          respond(result.response)
        }
      } else {
        respond(result.response)
      }
    },
    [products, addMessage, pendingAction, pendingContext, executeAction, respond]
  )

  // ─── Stop wake listener ───
  const stopWakeListener = useCallback(() => {
    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.abort() } catch (e) {}
      wakeRecognitionRef.current = null
    }
    setWakeListening(false)
  }, [])

  // ─── Start command listening ───
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addMessage('assistant', 'Su navegador no soporta reconocimiento de voz. Use Chrome o Edge.')
      return
    }
    stopWakeListener()
    setTimeout(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.onstart = () => { setIsListening(true); setLiveTranscript('') }
      recognition.onresult = (event) => {
        let interim = '', final = ''
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript
          else interim += event.results[i][0].transcript
        }
        setLiveTranscript(final || interim)
        if (final) processCommand(final)
      }
      recognition.onerror = (event) => {
        setIsListening(false); setLiveTranscript('')
        if (event.error !== 'no-speech' && event.error !== 'aborted') addMessage('assistant', 'No pude escucharlo bien. ¿Podría repetirlo?')
      }
      recognition.onend = () => { setIsListening(false); setLiveTranscript('') }
      recognitionRef.current = recognition
      recognition.start()
    }, 350)
  }, [addMessage, processCommand, stopWakeListener])

  // ─── Wake word listener ───
  useEffect(() => {
    if (!isOpen) return
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    let active = true, restartTimer = null
    const startWakeListener = () => {
      if (!active || isListening || isSpeaking || isProcessing) return
      if (recognitionRef.current) return
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'; recognition.interimResults = false; recognition.continuous = true
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && checkWakeWord(event.results[i][0].transcript)) {
            recognition.abort(); wakeRecognitionRef.current = null; setWakeListening(false)
            setTimeout(() => { if (active) startListening() }, 500)
          }
        }
      }
      recognition.onend = () => { setWakeListening(false); if (active && !isListening && !isSpeaking && !isProcessing) restartTimer = setTimeout(() => startWakeListener(), 1000) }
      recognition.onerror = () => { setWakeListening(false); wakeRecognitionRef.current = null; if (active) restartTimer = setTimeout(() => startWakeListener(), 1500) }
      wakeRecognitionRef.current = recognition
      try { recognition.start(); setWakeListening(true) } catch (e) {}
    }
    const timer = setTimeout(startWakeListener, 1500)
    return () => {
      active = false; clearTimeout(timer)
      if (restartTimer) clearTimeout(restartTimer)
      try { wakeRecognitionRef.current?.abort() } catch (e) {}
      wakeRecognitionRef.current = null
    }
  }, [isOpen, isListening, isSpeaking, isProcessing, startListening])

  // ─── Quick actions ───
  const quickActions = [
    { label: '📦 Agregar producto', command: 'Agrega un producto' },
    { label: '📋 Ver inventario', command: 'Muéstrame el inventario' },
    { label: '⚠️ Stock bajo', command: '¿Hay alertas de stock bajo?' },
    { label: '❓ Ayuda', command: 'Ayuda' },
  ]

  const formatTime = (d) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const hintText = isListening ? 'Escuchando...'
    : isSpeaking ? 'Respondiendo...'
    : isProcessing ? 'Procesando...'
    : pendingAction ? 'Diga "sí" para confirmar o "no" para cancelar'
    : pendingContext ? `Esperando: ${pendingContext.waitingFor === 'presentation' ? 'presentación' : pendingContext.waitingFor === 'price' ? 'precio' : 'stock'}`
    : 'Toque para hablar'

  return (
    <>
      <button
        className={`sketch-fab${lowStockProducts.length > 0 ? ' has-alerts' : ''}`}
        data-alerts={lowStockProducts.length}
        onClick={() => setIsOpen(!isOpen)}
        title="Sketch Voice Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      <div className={`sketch-panel${isOpen ? ' open' : ''}`}>
        <div className="sketch-header">
          <div className="sketch-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0f1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
          <div className="sketch-header-info">
            <h3>SKETCH</h3>
            <div className="sketch-header-status">
              {isListening ? '🔴 Escuchando...' : isSpeaking ? '🔊 Hablando...' : isProcessing ? '⏳ Procesando...' : wakeListening ? '🎤 "Hey Sketch" activo' : pendingAction ? '⏳ Confirmación' : pendingContext ? '📝 Completando datos...' : '✅ Listo'}
            </div>
          </div>
          <button className="sketch-close" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 4L4 14M4 4l10 10" /></svg>
          </button>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="sketch-alerts-bar" onClick={() => {
            const text = `${lowStockProducts.length} producto${lowStockProducts.length > 1 ? 's' : ''} con stock bajo: ${lowStockProducts.map(p => `${p.nombre} (${p.stock})`).join(', ')}`
            addMessage('assistant', text)
            setIsSpeaking(true)
            speak(`Atención. ${text}`, () => setIsSpeaking(false))
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
            <span>{lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo</span>
          </div>
        )}

        <div className="sketch-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`sketch-msg ${msg.role}`}>
              {msg.role === 'assistant' && pendingAction && i === messages.length - 1 && (
                <div className="sketch-pending-badge">⏳ Esperando confirmación</div>
              )}
              {msg.text}
              <div className="sketch-msg-time">{formatTime(msg.time)}</div>
            </div>
          ))}
          {isProcessing && (
            <div className="sketch-msg assistant" style={{ opacity: 0.6 }}>
              <div className="sketch-thinking-dots"><span></span><span></span><span></span></div>
              Procesando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {isListening && liveTranscript && (
          <div className="sketch-live">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /></svg>
            {liveTranscript}
          </div>
        )}

        {/* Quick action chips */}
        {!pendingAction && !pendingContext && !isListening && !isProcessing && !isSpeaking && messages.length <= 2 && (
          <div className="sketch-quick-actions">
            {quickActions.map((action, i) => (
              <button key={i} className="sketch-quick-chip" onClick={() => { if (!isProcessing && !isSpeaking) processCommand(action.command) }}>
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Confirmation buttons */}
        {pendingAction && !isProcessing && !isSpeaking && !isListening && (
          <div className="sketch-confirm-bar">
            <button className="sketch-confirm-btn yes" onClick={() => processCommand('Sí, confirmo')}>✓ Confirmar</button>
            <button className="sketch-confirm-btn no" onClick={() => processCommand('No, cancela')}>✗ Cancelar</button>
          </div>
        )}

        <div className="sketch-controls">
          <div className="sketch-controls-inner">
            <button
              className={`sketch-mic-btn${isListening ? ' listening' : ''}${pendingAction ? ' pending' : ''}`}
              onClick={startListening}
              disabled={isListening || isSpeaking || isProcessing}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
            <span className="sketch-hint">{hintText}</span>
            {wakeListening && !isListening && !isSpeaking && !isProcessing && (
              <span className="sketch-wake-badge">🎤 "Hey Sketch"</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}