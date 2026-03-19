// src/components/BarcodeScanner.jsx
// Escáner de código de barras v3 — html5-qrcode (funciona en TODOS los navegadores)
import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const scannerStyles = `
  .scanner-overlay {
    position: fixed; inset: 0; background: rgba(10,22,40,0.92);
    backdrop-filter: blur(8px); z-index: 300;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease; padding: 20px;
  }

  .scanner-container {
    width: 100%; max-width: 420px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 20px; overflow: hidden;
    max-height: 90vh; overflow-y: auto;
  }
  .scanner-container::-webkit-scrollbar { width: 4px; }
  .scanner-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .scanner-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .scanner-header h3 {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white);
  }
  .scanner-close {
    background: none; border: none; color: var(--gray); font-size: 20px;
    cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: all 0.15s;
  }
  .scanner-close:hover { color: var(--red); background: rgba(248,113,113,0.1); }

  /* Camera reader area */
  #scanner-reader {
    width: 100%; min-height: 280px; background: #000;
  }
  #scanner-reader video { border-radius: 0 !important; }
  #scanner-reader img[alt="Info icon"] { display: none; }
  #scanner-reader div { border: none !important; }
  /* Hide html5-qrcode default UI elements */
  #scanner-reader__dashboard_section { padding: 8px 16px !important; }
  #scanner-reader__dashboard_section_csr button {
    background: var(--blue) !important; color: white !important;
    border: none !important; border-radius: 8px !important;
    padding: 8px 16px !important; font-family: 'DM Sans', sans-serif !important;
    cursor: pointer !important;
  }
  #scanner-reader__dashboard_section_csr select {
    background: var(--card2) !important; color: var(--white) !important;
    border: 1px solid var(--border) !important; border-radius: 8px !important;
    padding: 6px 10px !important;
  }
  #scanner-reader__status_span { color: var(--gray) !important; font-size: 12px !important; }
  #scanner-reader__header_message { display: none !important; }

  .scanner-status {
    padding: 14px 20px; text-align: center;
    font-size: 13px; color: var(--gray);
  }
  .scanner-status.found { color: var(--green); font-weight: 600; }
  .scanner-status.not-found { color: var(--orange); }

  /* ─── Product info card ─── */
  .scanner-product-card {
    margin: 0 16px 16px; padding: 20px;
    background: var(--card2); border: 1px solid var(--border);
    border-radius: 14px; animation: fadeUp 0.3s ease;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .scanner-product-top {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;
  }
  .scanner-product-name {
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--white);
  }
  .scanner-product-cat { font-size: 11px; color: var(--gray); margin-top: 2px; }
  .scanner-product-badge {
    font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; white-space: nowrap;
  }
  .scanner-product-badge.ok { background: rgba(52,211,153,0.12); color: var(--green); }
  .scanner-product-badge.low { background: rgba(251,146,60,0.12); color: var(--orange); }
  .scanner-product-badge.out { background: rgba(248,113,113,0.12); color: var(--red); }

  .scanner-product-stats {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px;
  }
  .scanner-stat {
    background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 12px; text-align: center;
  }
  .scanner-stat-value {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--white); display: block;
  }
  .scanner-stat-value.price { color: var(--sky); }
  .scanner-stat-value.stock { color: var(--green); }
  .scanner-stat-value.stock.low { color: var(--orange); }
  .scanner-stat-value.stock.out { color: var(--red); }
  .scanner-stat-label {
    font-size: 10px; color: var(--gray); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; display: block;
  }

  .scanner-product-barcode {
    font-size: 11px; color: var(--gray); font-family: monospace; text-align: center;
    padding: 8px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 14px;
  }

  .scanner-product-actions { display: flex; gap: 8px; }
  .scanner-action-btn {
    flex: 1; padding: 11px; border-radius: 10px; border: none;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .scanner-action-btn.primary {
    background: linear-gradient(135deg, var(--blue), var(--sky));
    color: white; box-shadow: 0 2px 10px rgba(26,115,232,0.3);
  }
  .scanner-action-btn.primary:hover { transform: translateY(-1px); }
  .scanner-action-btn.secondary {
    background: var(--card); border: 1px solid var(--border); color: var(--light);
  }
  .scanner-action-btn.secondary:hover { background: rgba(255,255,255,0.06); }

  /* ─── Not found / Register ─── */
  .scanner-notfound-card {
    margin: 0 16px 16px; padding: 20px;
    background: var(--card2); border: 1px solid rgba(251,146,60,0.2);
    border-radius: 14px; animation: fadeUp 0.3s ease;
  }
  .scanner-notfound-title {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--orange); margin-bottom: 4px;
  }
  .scanner-notfound-code {
    font-size: 12px; color: var(--gray); font-family: monospace; margin-bottom: 14px;
  }

  .scanner-form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .scanner-form-label { font-size: 10px; font-weight: 600; color: var(--sky); text-transform: uppercase; letter-spacing: 1px; }
  .scanner-form-input, .scanner-form-select {
    width: 100%; padding: 10px 12px;
    background: rgba(255,255,255,0.06); border: 1px solid var(--border);
    border-radius: 8px; color: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: all 0.2s;
  }
  .scanner-form-input::placeholder { color: rgba(138,155,191,0.4); }
  .scanner-form-input:focus, .scanner-form-select:focus { border-color: var(--sky); background: rgba(91,184,245,0.06); }
  .scanner-form-select { appearance: none; cursor: pointer; }
  .scanner-form-select option { background: var(--panel); color: var(--white); }
  .scanner-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .scanner-register-btn {
    width: 100%; padding: 12px; margin-top: 4px;
    background: linear-gradient(135deg, var(--green), #6ee7b7);
    border: none; border-radius: 10px;
    color: #0A1628; font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 2px 10px rgba(52,211,153,0.3);
  }
  .scanner-register-btn:hover { transform: translateY(-1px); }
  .scanner-register-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .scanner-success-msg {
    text-align: center; padding: 20px; color: var(--green); font-weight: 600;
    font-size: 15px; animation: fadeUp 0.3s ease;
  }

  .scanner-scan-again { text-align: center; padding: 8px; }
  .scanner-scan-again button {
    background: none; border: none; color: var(--sky); font-size: 12px;
    font-weight: 500; cursor: pointer; text-decoration: underline;
    font-family: 'DM Sans', sans-serif;
  }

  .scanner-manual {
    padding: 12px 16px 16px; display: flex; gap: 8px;
    border-top: 1px solid var(--border);
  }
  .scanner-manual-input {
    flex: 1; padding: 10px 14px;
    background: rgba(255,255,255,0.06); border: 1px solid var(--border);
    border-radius: 10px; color: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none;
  }
  .scanner-manual-input:focus { border-color: var(--sky); }
  .scanner-manual-btn {
    padding: 10px 16px; background: var(--card2); border: 1px solid var(--border);
    border-radius: 10px; color: var(--sky); font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
  }
  .scanner-manual-btn:hover { background: rgba(91,184,245,0.1); }
`

const CATEGORIES = ['Bebidas', 'Botanas', 'Panadería', 'Lácteos', 'Abarrotes', 'Limpieza', 'Dulcería', 'Cerveza', 'Farmacia', 'Tabaco', 'General']

const BARCODE_DB = {
  '7501055303182': 'Coca-Cola 600ml', '7501055303311': 'Coca-Cola 1L', '7501055303069': 'Coca-Cola 2L',
  '7501055363391': 'Sprite 600ml', '7501055305346': 'Fanta 600ml', '7501000611072': 'Pepsi 600ml',
  '7501011167063': 'Sabritas Original', '7501011143210': 'Doritos Nacho',
  '7501011143258': 'Cheetos Torciditos', '7501011143319': 'Ruffles Queso',
  '7501000108008': 'Bimbo Pan Blanco', '7500435019811': 'Marinela Gansito',
  '7501055304769': 'Ciel 1L', '7501055304899': 'Ciel 1.5L',
  '7501005110013': 'Leche Lala 1L', '7501005115018': 'Leche Alpura 1L',
  '7501011160934': 'Takis Fuego', '7501008005012': 'Maruchan Pollo',
  '7501035910102': 'Nescafé Clásico', '7506195113011': 'Tang Naranja',
}

export default function BarcodeScanner({ products, onProductFound, onRegisterProduct, onClose }) {
  const [status, setStatus] = useState('scanning') // scanning, found, not-found, registered
  const [scannedCode, setScannedCode] = useState('')
  const [foundProduct, setFoundProduct] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', stock: '', categoria: 'General' })
  const [registering, setRegistering] = useState(false)
  const scannerRef = useRef(null)
  const lastCodeRef = useRef('')

  // ─── Start html5-qrcode scanner ───
  useEffect(() => {
    const scannerId = 'scanner-reader'
    let html5QrCode = null

    const startScanner = async () => {
      html5QrCode = new Html5Qrcode(scannerId)
      scannerRef.current = html5QrCode

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.333,
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            // 0=QR_CODE, 1=AZTEC, 2=CODABAR, 3=CODE_39, 4=CODE_93, 5=CODE_128,
            // 6=DATA_MATRIX, 7=MAXICODE, 8=ITF, 9=EAN_13, 10=EAN_8, 11=PDF_417,
            // 12=RSS_14, 13=RSS_EXPANDED, 14=UPC_A, 15=UPC_E
          },
          (decodedText) => {
            // Success callback
            handleBarcode(decodedText)
          },
          () => {
            // Error callback — ignore (scanning continues)
          }
        )
      } catch (err) {
        console.error('Scanner start error:', err)
      }
    }

    // Small delay to let the DOM render the container
    const timer = setTimeout(startScanner, 300)

    return () => {
      clearTimeout(timer)
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {})
      }
    }
  }, [])

  // ─── Handle barcode ───
  const handleBarcode = useCallback((code) => {
    if (lastCodeRef.current === code) return
    lastCodeRef.current = code
    setScannedCode(code)
    setShowRegisterForm(false)

    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate(100)

    // Pause scanner while showing results
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause()
    }

    // 1. Search by barcode field in DB
    const byBarcode = products.find(p => p.codigo_barras === code || p.barcode === code)
    if (byBarcode) { setFoundProduct(byBarcode); setStatus('found'); return }

    // 2. Known barcode DB → match inventory
    const knownName = BARCODE_DB[code]
    if (knownName) {
      const byName = products.find(p => p.nombre.toLowerCase().includes(knownName.toLowerCase()))
      if (byName) { setFoundProduct(byName); setStatus('found'); return }
      setNewProduct(prev => ({ ...prev, nombre: knownName }))
    } else {
      setNewProduct(prev => ({ ...prev, nombre: '' }))
    }

    // 3. Not found
    setFoundProduct(null)
    setStatus('not-found')
  }, [products])

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      lastCodeRef.current = ''
      handleBarcode(manualCode.trim())
    }
  }

  const resetScan = () => {
    setFoundProduct(null)
    setScannedCode('')
    setShowRegisterForm(false)
    setStatus('scanning')
    lastCodeRef.current = ''
    setNewProduct({ nombre: '', precio: '', stock: '', categoria: 'General' })
    // Resume scanner
    if (scannerRef.current) {
      try { scannerRef.current.resume() } catch (e) {}
    }
  }

  // ─── Register new product ───
  const handleRegister = async () => {
    if (!newProduct.nombre || !newProduct.precio) return
    setRegistering(true)
    try {
      if (onRegisterProduct) {
        await onRegisterProduct({
          nombre: newProduct.nombre.trim(),
          precio: parseFloat(newProduct.precio),
          stock: parseInt(newProduct.stock) || 0,
          stock_minimo: 5,
          categoria: newProduct.categoria,
          codigo_barras: scannedCode
        })
      }
      setStatus('registered')
      setTimeout(() => resetScan(), 2000)
    } catch (err) { console.error('Register error:', err) }
    setRegistering(false)
  }

  const getStockStatus = (p) => {
    if (p.stock <= 0) return { label: 'Agotado', cls: 'out' }
    if (p.stock <= (p.stock_minimo || 5)) return { label: 'Stock bajo', cls: 'low' }
    return { label: 'Disponible', cls: 'ok' }
  }

  const handleClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => onClose()).catch(() => onClose())
    } else {
      onClose()
    }
  }

  return (
    <>
      <style>{scannerStyles}</style>
      <div className="scanner-overlay" onClick={handleClose}>
        <div className="scanner-container" onClick={e => e.stopPropagation()}>
          <div className="scanner-header">
            <h3>📷 Escáner de código de barras</h3>
            <button className="scanner-close" onClick={handleClose}>✕</button>
          </div>

          {/* Camera reader — html5-qrcode renders here */}
          <div id="scanner-reader" />

          {/* Status */}
          <div className={`scanner-status ${status}`}>
            {status === 'scanning' && '📷 Apunte al código de barras del producto'}
            {status === 'found' && '✅ Producto encontrado en inventario'}
            {status === 'not-found' && '⚠️ Código no registrado en inventario'}
            {status === 'registered' && '✅ ¡Producto registrado exitosamente!'}
          </div>

          {/* ═══ FOUND ═══ */}
          {status === 'found' && foundProduct && (
            <div className="scanner-product-card">
              <div className="scanner-product-top">
                <div>
                  <div className="scanner-product-name">{foundProduct.nombre}</div>
                  <div className="scanner-product-cat">{foundProduct.categoria || 'General'}</div>
                </div>
                {(() => {
                  const st = getStockStatus(foundProduct)
                  return <span className={`scanner-product-badge ${st.cls}`}>{st.label}</span>
                })()}
              </div>

              <div className="scanner-product-stats">
                <div className="scanner-stat">
                  <span className="scanner-stat-value price">${foundProduct.precio?.toFixed(2)}</span>
                  <span className="scanner-stat-label">Precio</span>
                </div>
                <div className="scanner-stat">
                  <span className={`scanner-stat-value stock ${getStockStatus(foundProduct).cls}`}>{foundProduct.stock}</span>
                  <span className="scanner-stat-label">Stock</span>
                </div>
                <div className="scanner-stat">
                  <span className="scanner-stat-value">{foundProduct.stock_minimo || 5}</span>
                  <span className="scanner-stat-label">Mínimo</span>
                </div>
              </div>

              <div className="scanner-product-barcode">Código: {scannedCode}</div>

              <div className="scanner-product-actions">
                <button className="scanner-action-btn primary" onClick={() => { onProductFound(foundProduct); resetScan() }}>
                  🛒 Agregar al carrito
                </button>
                <button className="scanner-action-btn secondary" onClick={resetScan}>
                  Escanear otro
                </button>
              </div>
            </div>
          )}

          {/* ═══ NOT FOUND ═══ */}
          {status === 'not-found' && !showRegisterForm && (
            <div className="scanner-notfound-card">
              <div className="scanner-notfound-title">Producto no encontrado</div>
              <div className="scanner-notfound-code">Código: {scannedCode}</div>
              <div className="scanner-product-actions">
                <button className="scanner-action-btn primary" onClick={() => setShowRegisterForm(true)}>
                  + Registrar nuevo producto
                </button>
                <button className="scanner-action-btn secondary" onClick={resetScan}>
                  Escanear otro
                </button>
              </div>
            </div>
          )}

          {/* ═══ REGISTER FORM ═══ */}
          {status === 'not-found' && showRegisterForm && (
            <div className="scanner-notfound-card">
              <div className="scanner-notfound-title">Registrar producto nuevo</div>
              <div className="scanner-notfound-code">Código de barras: {scannedCode}</div>

              <div className="scanner-form-group">
                <span className="scanner-form-label">Nombre del producto</span>
                <input className="scanner-form-input" placeholder="Ej: Coca-Cola 600ml"
                  value={newProduct.nombre} onChange={e => setNewProduct(p => ({ ...p, nombre: e.target.value }))} />
              </div>

              <div className="scanner-form-row">
                <div className="scanner-form-group">
                  <span className="scanner-form-label">Precio ($)</span>
                  <input className="scanner-form-input" type="number" step="0.5" min="0" placeholder="0.00"
                    value={newProduct.precio} onChange={e => setNewProduct(p => ({ ...p, precio: e.target.value }))} />
                </div>
                <div className="scanner-form-group">
                  <span className="scanner-form-label">Stock inicial</span>
                  <input className="scanner-form-input" type="number" min="0" placeholder="0"
                    value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>

              <div className="scanner-form-group">
                <span className="scanner-form-label">Categoría</span>
                <select className="scanner-form-select" value={newProduct.categoria}
                  onChange={e => setNewProduct(p => ({ ...p, categoria: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button className="scanner-register-btn" onClick={handleRegister}
                disabled={registering || !newProduct.nombre || !newProduct.precio}>
                {registering ? 'Registrando...' : `✓ Registrar ${newProduct.nombre || 'producto'}`}
              </button>
            </div>
          )}

          {/* ═══ SUCCESS ═══ */}
          {status === 'registered' && (
            <div className="scanner-success-msg">✅ Producto registrado y listo para vender</div>
          )}

          {/* Scan again */}
          {(status === 'found' || status === 'not-found') && (
            <div className="scanner-scan-again"><button onClick={resetScan}>Escanear otro producto</button></div>
          )}

          {/* Manual input */}
          <div className="scanner-manual">
            <input className="scanner-manual-input" placeholder="Escribir código manual..."
              value={manualCode} onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()} />
            <button className="scanner-manual-btn" onClick={handleManualSearch}>Buscar</button>
          </div>
        </div>
      </div>
    </>
  )
}