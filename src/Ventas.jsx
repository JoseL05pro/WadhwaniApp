// src/Ventas.jsx
// Módulo de Ventas para Sketch — Con funciones innovadoras integradas
// Escáner de código de barras, Predicción de demanda, POS completo
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { registrarVenta, getVentasHoy, getCorteDeCaja } from './services/ventasService'
import BarcodeScanner from './components/BarcodeScanner'
import PrediccionDemanda from './components/PrediccionDemanda'

const ventasStyles = `
  /* ═══ VENTAS MODULE — Sketch Design System ═══ */

  .ventas-page {
    flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
  }

[data-theme="light"] .pos-search-input,
[data-theme="light"] .pos-pay-input-wrap input { color: #1A1A2E; }
[data-theme="light"] .pos-search-input::placeholder { color: rgba(107,114,128,0.6); }
[data-theme="light"] .ticket { background: #fff; }


  .ventas-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
    animation: fadeDown 0.5s 0.1s ease both;
    flex-shrink: 0; gap: 12px; flex-wrap: wrap;
  }

  .ventas-topbar-left h1 {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--white);
  }
  .ventas-topbar-left p { font-size: 13px; color: var(--gray); margin-top: 2px; }

  .ventas-tabs {
    display: flex; gap: 4px;
    background: rgba(255,255,255,0.05);
    padding: 4px; border-radius: 10px;
  }
  .ventas-tab {
    padding: 8px 18px; border: none; background: transparent;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: var(--gray);
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .ventas-tab.active {
    background: var(--blue); color: white;
    box-shadow: 0 2px 8px rgba(26,115,232,0.4);
  }
  .ventas-tab:hover:not(.active) { color: var(--light); background: rgba(255,255,255,0.05); }

  .ventas-content {
    flex: 1; overflow-y: auto; padding: 24px 28px;
    animation: fadeUp 0.4s ease both;
  }
  .ventas-content::-webkit-scrollbar { width: 4px; }
  .ventas-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ─── Flash message ─── */
  .ventas-flash {
    padding: 10px 16px; border-radius: 10px; margin-bottom: 16px;
    font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px;
    animation: fadeDown 0.3s ease;
  }
  .ventas-flash.success { background: rgba(52,211,153,0.12); color: var(--green); border: 1px solid rgba(52,211,153,0.2); }
  .ventas-flash.error { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }

  /* ════════════════════════ */
  /* ─── POS LAYOUT ─── */
  /* ════════════════════════ */
  .pos-layout {
    display: grid; grid-template-columns: 1fr 380px; gap: 16px; min-height: 0;
  }

  .pos-search-card, .pos-cart-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
  }

  /* Search */
  .pos-search-top {
    display: flex; gap: 8px; margin-bottom: 16px; align-items: stretch;
  }
  .pos-search-wrapper {
    position: relative; display: flex; align-items: center; flex: 1;
  }
  .pos-search-icon {
    position: absolute; left: 14px; color: var(--gray); font-size: 15px; pointer-events: none;
  }
  .pos-search-input {
    width: 100%; padding: 11px 14px 11px 40px;
    background: rgba(255,255,255,0.06); border: 1px solid var(--border);
    border-radius: 10px; color: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none;
    transition: all 0.25s ease;
  }
  .pos-search-input::placeholder { color: rgba(138,155,191,0.4); }
  .pos-search-input:focus {
    border-color: var(--sky); background: rgba(91,184,245,0.06);
    box-shadow: 0 0 0 3px rgba(91,184,245,0.12);
  }
  .pos-search-clear {
    position: absolute; right: 10px; background: none; border: none;
    color: var(--gray); cursor: pointer; font-size: 16px; padding: 4px;
  }

  /* Scan button */
  .pos-scan-btn {
    padding: 0 16px; border-radius: 10px;
    background: linear-gradient(135deg, var(--cyan), var(--sky));
    border: none; color: white; font-size: 18px;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    box-shadow: 0 2px 10px rgba(52,216,232,0.3);
    white-space: nowrap;
  }
  .pos-scan-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(52,216,232,0.4); }
  .pos-scan-btn span { font-size: 12px; font-weight: 600; font-family: 'Syne', sans-serif; }

  /* Product grid */
  .pos-products-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;
    max-height: 520px; overflow-y: auto; padding-right: 4px;
  }
  .pos-products-grid::-webkit-scrollbar { width: 4px; }
  .pos-products-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .pos-product-item {
    background: var(--card2); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; gap: 6px;
  }
  .pos-product-item:hover {
    border-color: rgba(91,184,245,0.3); background: rgba(91,184,245,0.06);
    transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .pos-product-item.out-of-stock {
    opacity: 0.4; pointer-events: none;
  }
  .pos-product-name {
    font-size: 13px; font-weight: 500; color: var(--light); line-height: 1.3;
  }
  .pos-product-cat {
    font-size: 11px; color: var(--gray);
  }
  .pos-product-bottom {
    display: flex; justify-content: space-between; align-items: center; margin-top: auto;
  }
  .pos-product-price {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: var(--sky);
  }
  .pos-product-stock {
    font-size: 11px; padding: 2px 7px; border-radius: 6px;
  }
  .pos-product-stock.ok { background: rgba(52,211,153,0.12); color: var(--green); }
  .pos-product-stock.low { background: rgba(251,146,60,0.12); color: var(--orange); }
  .pos-product-stock.out { background: rgba(248,113,113,0.12); color: var(--red); }

  .pos-empty {
    text-align: center; color: var(--gray); padding: 40px 20px; font-size: 14px;
  }
  .pos-empty-icon { font-size: 36px; margin-bottom: 12px; display: block; }

  /* ─── Cart ─── */
  .pos-cart-card { display: flex; flex-direction: column; }

  .pos-cart-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .pos-cart-header h3 {
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--white);
  }
  .pos-cart-clear {
    background: none; border: none; color: var(--red); font-size: 12px;
    cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500;
    padding: 4px 8px; border-radius: 6px; transition: background 0.2s;
  }
  .pos-cart-clear:hover { background: rgba(248,113,113,0.1); }

  .pos-cart-empty {
    flex: 1; display: flex; align-items: center; justify-content: center;
    color: var(--gray); font-size: 13px; text-align: center; padding: 30px;
  }

  .pos-cart-items {
    flex: 1; overflow-y: auto; max-height: 280px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .pos-cart-items::-webkit-scrollbar { width: 3px; }
  .pos-cart-items::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .pos-cart-item {
    display: grid; grid-template-columns: 1fr auto auto auto;
    align-items: center; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }
  .pos-cart-item:last-child { border-bottom: none; }

  .pos-cart-item-name { font-size: 13px; color: var(--light); font-weight: 500; }
  .pos-cart-item-unit { font-size: 11px; color: var(--gray); }

  .pos-cart-item-controls {
    display: flex; align-items: center; gap: 6px;
  }
  .pos-cart-item-controls button {
    width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--card2); color: var(--light); font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .pos-cart-item-controls button:hover { background: rgba(91,184,245,0.15); border-color: var(--sky); }
  .pos-cart-item-qty {
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px;
    color: var(--white); min-width: 20px; text-align: center;
  }
  .pos-cart-item-subtotal {
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px; color: var(--sky);
    min-width: 60px; text-align: right;
  }
  .pos-cart-item-remove {
    background: none; border: none; color: var(--gray); font-size: 14px;
    cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.15s;
  }
  .pos-cart-item-remove:hover { color: var(--red); background: rgba(248,113,113,0.1); }

  /* Cart footer */
  .pos-cart-footer {
    border-top: 1px solid var(--border); padding-top: 16px; margin-top: 12px;
    display: flex; flex-direction: column; gap: 12px;
  }

  .pos-total-row {
    display: flex; justify-content: space-between; align-items: center;
  }
  .pos-total-row span:first-child { font-size: 13px; color: var(--gray); }
  .pos-total-amount {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--white);
  }

  .pos-pay-row { display: flex; align-items: center; gap: 10px; }
  .pos-pay-row label { font-size: 12px; color: var(--gray); white-space: nowrap; min-width: 50px; }
  .pos-pay-input-wrap {
    flex: 1; display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.06); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 12px; transition: all 0.2s;
  }
  .pos-pay-input-wrap:focus-within { border-color: var(--sky); background: rgba(91,184,245,0.06); }
  .pos-pay-input-wrap span { color: var(--gray); font-size: 14px; }
  .pos-pay-input-wrap input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--white); font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
  }

  .pos-quick-pay {
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .pos-quick-btn {
    padding: 6px 12px; border-radius: 8px;
    background: var(--card2); border: 1px solid var(--border);
    color: var(--light); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .pos-quick-btn:hover { border-color: var(--sky); background: rgba(91,184,245,0.1); }
  .pos-quick-btn.exact { border-color: rgba(52,211,153,0.3); color: var(--green); }

  .pos-change-row {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15);
    border-radius: 10px; padding: 10px 14px;
  }
  .pos-change-row span:first-child { font-size: 13px; color: var(--green); }
  .pos-change-amount { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--green); }

  .pos-cobrar-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--blue), var(--sky));
    border: none; border-radius: 12px;
    color: white; font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(26,115,232,0.4);
  }
  .pos-cobrar-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,115,232,0.5); }
  .pos-cobrar-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* ════════════════════════ */
  /* ─── HISTORIAL ─── */
  /* ════════════════════════ */
  .hist-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  }
  .hist-header h3 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--white); }

  .hist-refresh {
    padding: 7px 14px; background: var(--card2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--sky); font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .hist-refresh:hover { background: rgba(91,184,245,0.1); }

  .hist-empty {
    text-align: center; color: var(--gray); padding: 60px 20px;
  }
  .hist-empty-icon { font-size: 40px; margin-bottom: 12px; display: block; }

  .hist-list { display: flex; flex-direction: column; gap: 8px; }

  .hist-item {
    background: var(--card); border: 1px solid var(--border); border-radius: 14px;
    padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; transition: all 0.2s;
  }
  .hist-item:hover { border-color: rgba(91,184,245,0.2); background: rgba(91,184,245,0.04); transform: translateY(-1px); }

  .hist-item-time { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--sky); }
  .hist-item-count { font-size: 12px; color: var(--gray); margin-top: 2px; }
  .hist-item-detail { font-size: 12px; color: var(--light); margin-top: 4px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hist-item-total { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--white); }
  .hist-item-ver { font-size: 11px; color: var(--sky); margin-top: 4px; }

  /* ════════════════════════ */
  /* ─── CORTE DE CAJA ─── */
  /* ════════════════════════ */
  .corte-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  }
  .corte-header h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--white); }

  .corte-cards {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }

  .corte-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .corte-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .corte-card.main::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--green), #6ee7b7);
  }
  .corte-card-label { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
  .corte-card-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--white); }
  .corte-card.main .corte-card-value { color: var(--green); }

  .corte-section {
    background: var(--card); border: 1px solid var(--border); border-radius: 16px;
    padding: 24px; margin-bottom: 16px;
  }
  .corte-section h4 {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 16px;
  }

  .corte-top-item {
    display: grid; grid-template-columns: 30px 1fr auto auto;
    align-items: center; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }
  .corte-top-item:last-child { border-bottom: none; }
  .corte-top-rank { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: var(--sky); }
  .corte-top-name { font-size: 13px; color: var(--light); font-weight: 500; }
  .corte-top-qty { font-size: 12px; color: var(--gray); }
  .corte-top-total { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--green); }

  .corte-hour-row {
    display: grid; grid-template-columns: 50px 1fr auto;
    align-items: center; gap: 12px; padding: 6px 0;
  }
  .corte-hour-label { font-size: 12px; color: var(--gray); font-weight: 500; font-family: 'DM Sans', monospace; }
  .corte-hour-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .corte-hour-bar { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--blue), var(--sky)); transition: width 0.6s ease; }
  .corte-hour-info { font-size: 11px; color: var(--gray); white-space: nowrap; }

  .corte-empty {
    text-align: center; color: var(--gray); padding: 60px 20px;
  }

  /* ════════════════════════ */
  /* ─── TICKET MODAL ─── */
  /* ════════════════════════ */
  .ticket-overlay {
    position: fixed; inset: 0; background: rgba(10,22,40,0.85);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; animation: fadeIn 0.2s ease; padding: 20px;
  }

  .ticket {
    background: #FFFFF8; color: #1a1a1a; border-radius: 16px;
    width: 100%; max-width: 340px; padding: 28px 24px;
    animation: modalPop 0.3s cubic-bezier(0.22,1,0.36,1) both;
    font-family: 'DM Sans', sans-serif;
  }

  .ticket-header { text-align: center; margin-bottom: 16px; }
  .ticket-header h3 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #0A1628; letter-spacing: 2px; }
  .ticket-header p { font-size: 12px; color: #666; margin-top: 2px; }
  .ticket-id { font-size: 11px; color: #999; font-family: monospace; margin-top: 4px; }

  .ticket-divider {
    text-align: center; color: #ccc; font-size: 12px; margin: 12px 0;
    letter-spacing: 2px; user-select: none;
  }

  .ticket-items { display: flex; flex-direction: column; gap: 8px; }
  .ticket-item-name { font-size: 13px; font-weight: 500; color: #333; }
  .ticket-item-line {
    display: flex; justify-content: space-between; font-size: 12px; color: #666;
  }

  .ticket-total-row {
    display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #666;
  }
  .ticket-total-row.main {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #0A1628; padding: 8px 0;
  }

  .ticket-footer { text-align: center; font-size: 13px; color: #888; padding: 4px 0; }

  .ticket-actions {
    display: flex; gap: 8px; margin-top: 16px;
  }
  .ticket-print {
    flex: 1; padding: 10px; background: #0A1628; border: none; border-radius: 10px;
    color: white; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: opacity 0.2s;
  }
  .ticket-print:hover { opacity: 0.85; }
  .ticket-close-btn {
    flex: 1; padding: 10px; background: #f0f0f0; border: none; border-radius: 10px;
    color: #666; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.2s;
  }
  .ticket-close-btn:hover { background: #e0e0e0; }

  /* ─── Responsive ─── */
  @media (max-width: 900px) {
    .pos-layout { grid-template-columns: 1fr; }
    .corte-cards { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .ventas-content { padding: 16px; }
    .corte-cards { grid-template-columns: 1fr; }
    .ventas-tabs { overflow-x: auto; }
    .pos-scan-btn span { display: none; }
  }

  @media print {
    body * { visibility: hidden; }
    .ticket, .ticket * { visibility: visible; }
    .ticket { position: absolute; left: 0; top: 0; width: 100%; border-radius: 0; }
    .ticket-actions { display: none; }
  }
`

// ═══════════════════════════════════════
// ── VENTAS COMPONENT ──
// ═══════════════════════════════════════
export default function Ventas({ onNavigate, user }) {
  const [activeTab, setActiveTab] = useState('pos')
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pago, setPago] = useState('')
  const [ventasHoy, setVentasHoy] = useState([])
  const [corte, setCorte] = useState(null)
  const [showTicket, setShowTicket] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const searchRef = useRef(null)

  // ─── Load products ───
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('productos').select('*').order('nombre')
    if (!error && data) setProducts(data)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    if (activeTab === 'historial') loadVentasHoy()
    if (activeTab === 'corte') loadCorte()
  }, [activeTab])

  const loadVentasHoy = async () => {
    try { setVentasHoy(await getVentasHoy()) } catch (err) { console.error(err) }
  }
  const loadCorte = async () => {
    try { setCorte(await getCorteDeCaja()) } catch (err) { console.error(err) }
  }

  const flash = (type, text) => {
    setMensaje({ type, text })
    setTimeout(() => setMensaje(null), 3000)
  }

  // ─── Cart logic ───
  const total = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const pagoNum = parseFloat(pago) || 0
  const cambio = Math.max(0, pagoNum - total)

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.producto_id === product.id)
      if (existing) {
        if (existing.cantidad >= product.stock) { flash('error', `Sin stock suficiente de ${product.nombre}`); return prev }
        return prev.map(i => i.producto_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      if (product.stock <= 0) { flash('error', `${product.nombre} agotado`); return prev }
      return [...prev, { producto_id: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1, stock: product.stock }]
    })
    setSearchTerm('')
    searchRef.current?.focus()
  }, [])

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.producto_id !== id))
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.producto_id !== id) return i
      const q = i.cantidad + delta
      if (q <= 0) return null
      if (q > i.stock) { flash('error', `Máximo: ${i.stock} uds`); return i }
      return { ...i, cantidad: q }
    }).filter(Boolean))
  }
  const clearCart = () => { setCart([]); setPago('') }

  // ─── Cobrar ───
  const cobrar = async () => {
    if (cart.length === 0) return flash('error', 'Carrito vacío')
    if (pagoNum < total) return flash('error', 'Pago insuficiente')
    setLoading(true)
    try {
      const venta = await registrarVenta({
        items: cart.map(i => ({ producto_id: i.producto_id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        total, pago: pagoNum, cambio
      })
      setShowTicket({ id: venta.id, fecha: new Date(venta.created_at), items: [...cart], total, pago: pagoNum, cambio })
      await fetchProducts()
      clearCart()
      flash('success', '¡Venta registrada exitosamente!')
    } catch (err) { console.error(err); flash('error', 'Error al registrar venta') }
    setLoading(false)
  }

  // ─── Filter products ───
  const filtered = searchTerm.length >= 1
    ? products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 20)
    : products.slice(0, 20)

  const fmt = (n) => `$${(n || 0).toFixed(2)}`
  const fmtTime = (d) => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  const stockStatus = (p) => {
    if (p.stock <= 0) return 'out'
    if (p.stock <= (p.stock_minimo || 5)) return 'low'
    return 'ok'
  }

  return (
    <>
      <style>{ventasStyles}</style>
      <div className="ventas-page">
        {/* Topbar */}
        <div className="ventas-topbar">
          <div className="ventas-topbar-left">
            <h1>💰 Ventas</h1>
            <p>{fmtDate(new Date())}</p>
          </div>
          <div className="ventas-tabs">
            {[
              { id: 'pos', label: '🛒 Nueva venta' },
              { id: 'historial', label: '📋 Historial' },
              { id: 'corte', label: '💰 Corte de caja' },
            ].map(tab => (
              <button key={tab.id} className={`ventas-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ventas-content">
          {mensaje && <div className={`ventas-flash ${mensaje.type}`}>{mensaje.type === 'success' ? '✓' : '⚠'} {mensaje.text}</div>}

          {/* ═══ POS ═══ */}
          {activeTab === 'pos' && (
            <div className="pos-layout">
              {/* Products */}
              <div className="pos-search-card">
                <div className="pos-search-top">
                  <div className="pos-search-wrapper">
                    <span className="pos-search-icon">🔍</span>
                    <input ref={searchRef} className="pos-search-input" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                    {searchTerm && <button className="pos-search-clear" onClick={() => { setSearchTerm(''); searchRef.current?.focus() }}>✕</button>}
                  </div>
                  <button className="pos-scan-btn" onClick={() => setShowScanner(true)}>
                    📷 <span>Escanear</span>
                  </button>
                </div>
                {filtered.length === 0 ? (
                  <div className="pos-empty">
                    <span className="pos-empty-icon">📦</span>
                    {searchTerm ? `No se encontró "${searchTerm}"` : 'Sin productos en inventario'}
                  </div>
                ) : (
                  <div className="pos-products-grid">
                    {filtered.map(p => {
                      const st = stockStatus(p)
                      return (
                        <div key={p.id} className={`pos-product-item${st === 'out' ? ' out-of-stock' : ''}`} onClick={() => addToCart(p)}>
                          <span className="pos-product-name">{p.nombre}</span>
                          <span className="pos-product-cat">{p.categoria || 'General'}</span>
                          <div className="pos-product-bottom">
                            <span className="pos-product-price">{fmt(p.precio)}</span>
                            <span className={`pos-product-stock ${st}`}>{p.stock} uds</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="pos-cart-card">
                <div className="pos-cart-header">
                  <h3>🛒 Carrito ({cart.reduce((s, i) => s + i.cantidad, 0)})</h3>
                  {cart.length > 0 && <button className="pos-cart-clear" onClick={clearCart}>Vaciar</button>}
                </div>

                {cart.length === 0 ? (
                  <div className="pos-cart-empty">Seleccione productos del catálogo o use el escáner 📷</div>
                ) : (
                  <div className="pos-cart-items">
                    {cart.map(item => (
                      <div key={item.producto_id} className="pos-cart-item">
                        <div>
                          <div className="pos-cart-item-name">{item.nombre}</div>
                          <div className="pos-cart-item-unit">{fmt(item.precio)} c/u</div>
                        </div>
                        <div className="pos-cart-item-controls">
                          <button onClick={() => updateQty(item.producto_id, -1)}>−</button>
                          <span className="pos-cart-item-qty">{item.cantidad}</span>
                          <button onClick={() => updateQty(item.producto_id, 1)}>+</button>
                        </div>
                        <span className="pos-cart-item-subtotal">{fmt(item.precio * item.cantidad)}</span>
                        <button className="pos-cart-item-remove" onClick={() => removeFromCart(item.producto_id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="pos-cart-footer">
                    <div className="pos-total-row">
                      <span>Total</span>
                      <span className="pos-total-amount">{fmt(total)}</span>
                    </div>
                    <div className="pos-pay-row">
                      <label>Pago:</label>
                      <div className="pos-pay-input-wrap">
                        <span>$</span>
                        <input type="number" placeholder="0.00" value={pago} onChange={e => setPago(e.target.value)} min="0" step="0.5" />
                      </div>
                    </div>
                    <div className="pos-quick-pay">
                      {[...new Set([Math.ceil(total), Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100].filter(v => v >= total))].slice(0, 4).map(a => (
                        <button key={a} className="pos-quick-btn" onClick={() => setPago(String(a))}>{fmt(a)}</button>
                      ))}
                      <button className="pos-quick-btn exact" onClick={() => setPago(String(total))}>Exacto</button>
                    </div>
                    {pagoNum >= total && pagoNum > 0 && (
                      <div className="pos-change-row">
                        <span>Cambio</span>
                        <span className="pos-change-amount">{fmt(cambio)}</span>
                      </div>
                    )}
                    <button className="pos-cobrar-btn" onClick={cobrar} disabled={loading || pagoNum < total}>
                      {loading ? 'Procesando...' : `Cobrar ${fmt(total)}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ HISTORIAL ═══ */}
          {activeTab === 'historial' && (
            <div>
              <div className="hist-header">
                <h3>Ventas de hoy — {fmtDate(new Date())}</h3>
                <button className="hist-refresh" onClick={loadVentasHoy}>↻ Actualizar</button>
              </div>
              {ventasHoy.length === 0 ? (
                <div className="hist-empty"><span className="hist-empty-icon">📋</span><p>No hay ventas registradas hoy</p></div>
              ) : (
                <div className="hist-list">
                  {ventasHoy.map(v => (
                    <div key={v.id} className="hist-item" onClick={() => setShowTicket({
                      id: v.id, fecha: new Date(v.created_at),
                      items: (v.venta_detalles || []).map(d => ({ nombre: d.nombre_producto, precio: d.precio_unitario, cantidad: d.cantidad })),
                      total: v.total, pago: v.pago, cambio: v.cambio
                    })}>
                      <div>
                        <div className="hist-item-time">{fmtTime(v.created_at)}</div>
                        <div className="hist-item-count">{v.num_productos} producto{v.num_productos !== 1 ? 's' : ''}</div>
                        <div className="hist-item-detail">{(v.venta_detalles || []).map(d => d.nombre_producto).slice(0, 3).join(', ')}{(v.venta_detalles || []).length > 3 ? '...' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="hist-item-total">{fmt(v.total)}</div>
                        <div className="hist-item-ver">Ver ticket →</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ CORTE DE CAJA + PREDICCIÓN DE DEMANDA ═══ */}
          {activeTab === 'corte' && (
            <div>
              <div className="corte-header">
                <h3>Corte de caja</h3>
                <button className="hist-refresh" onClick={loadCorte}>↻ Actualizar</button>
              </div>
              {!corte || corte.totalVentas === 0 ? (
                <div className="corte-empty"><p style={{ fontSize: 40, marginBottom: 12 }}>💰</p><p>No hay ventas registradas hoy para el corte</p></div>
              ) : (
                <>
                  <div className="corte-cards">
                    <div className="corte-card main">
                      <span className="corte-card-label">Total del día</span>
                      <span className="corte-card-value">{fmt(corte.totalIngresos)}</span>
                    </div>
                    <div className="corte-card">
                      <span className="corte-card-label">Ventas</span>
                      <span className="corte-card-value">{corte.totalVentas}</span>
                    </div>
                    <div className="corte-card">
                      <span className="corte-card-label">Productos vendidos</span>
                      <span className="corte-card-value">{corte.totalProductos}</span>
                    </div>
                    <div className="corte-card">
                      <span className="corte-card-label">Ticket promedio</span>
                      <span className="corte-card-value">{fmt(corte.ticketPromedio)}</span>
                    </div>
                  </div>

                  {corte.topProductos.length > 0 && (
                    <div className="corte-section">
                      <h4>🏆 Más vendidos</h4>
                      {corte.topProductos.map((p, i) => (
                        <div key={i} className="corte-top-item">
                          <span className="corte-top-rank">#{i + 1}</span>
                          <span className="corte-top-name">{p.nombre}</span>
                          <span className="corte-top-qty">{p.cantidad} uds</span>
                          <span className="corte-top-total">{fmt(p.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(corte.ventasPorHora).length > 0 && (
                    <div className="corte-section">
                      <h4>⏰ Ventas por hora</h4>
                      {Object.entries(corte.ventasPorHora).sort(([a], [b]) => Number(a) - Number(b)).map(([hora, data]) => (
                        <div key={hora} className="corte-hour-row">
                          <span className="corte-hour-label">{String(hora).padStart(2, '0')}:00</span>
                          <div className="corte-hour-bar-wrap">
                            <div className="corte-hour-bar" style={{ width: `${Math.min(100, (data.total / corte.totalIngresos) * 100 * 3)}%` }} />
                          </div>
                          <span className="corte-hour-info">{data.ventas} venta{data.ventas !== 1 ? 's' : ''} • {fmt(data.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 🧠 PREDICCIÓN DE DEMANDA — siempre visible en corte */}
              <PrediccionDemanda products={products} />
            </div>
          )}
        </div>

        {/* ═══ BARCODE SCANNER MODAL ═══ */}
        {showScanner && (
          <BarcodeScanner
            products={products}
            onProductFound={(p) => { addToCart(p) }}
            onRegisterProduct={async (newProd) => {
              const { data, error } = await supabase.from('productos').insert([newProd]).select().single()
              if (!error) await fetchProducts()
              return data
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* ═══ TICKET MODAL ═══ */}
        {showTicket && (
          <div className="ticket-overlay" onClick={() => setShowTicket(null)}>
            <div className="ticket" onClick={e => e.stopPropagation()}>
              <div className="ticket-header">
                <h3>SKETCH</h3>
                <p>Ticket de venta</p>
                <p>{showTicket.fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} — {showTicket.fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="ticket-id">#{showTicket.id?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="ticket-divider">• • • • • • • • • • • • • • •</div>
              <div className="ticket-items">
                {showTicket.items.map((item, i) => (
                  <div key={i}>
                    <div className="ticket-item-name">{item.nombre}</div>
                    <div className="ticket-item-line">
                      <span>{item.cantidad} × {fmt(item.precio)}</span>
                      <span>{fmt(item.precio * item.cantidad)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ticket-divider">• • • • • • • • • • • • • • •</div>
              <div>
                <div className="ticket-total-row main"><span>TOTAL</span><span>{fmt(showTicket.total)}</span></div>
                <div className="ticket-total-row"><span>Pago</span><span>{fmt(showTicket.pago)}</span></div>
                <div className="ticket-total-row"><span>Cambio</span><span>{fmt(showTicket.cambio)}</span></div>
              </div>
              <div className="ticket-divider">• • • • • • • • • • • • • • •</div>
              <div className="ticket-footer"><p>¡Gracias por su compra!</p></div>
              <div className="ticket-actions">
                <button className="ticket-print" onClick={() => window.print()}>🖨 Imprimir</button>
                <button className="ticket-close-btn" onClick={() => setShowTicket(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}