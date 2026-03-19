// src/components/BarcodeScanner.jsx
// Escáner de código de barras con cámara — Sketch Innovation
import { useState, useEffect, useRef, useCallback } from 'react'

const scannerStyles = `
  .scanner-overlay {
    position: fixed; inset: 0; background: rgba(10,22,40,0.92);
    backdrop-filter: blur(8px); z-index: 300;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
    padding: 20px;
  }

  .scanner-container {
    width: 100%; max-width: 400px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 20px; overflow: hidden;
  }

  .scanner-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .scanner-header h3 {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--white);
  }
  .scanner-close {
    background: none; border: none; color: var(--gray); font-size: 20px;
    cursor: pointer; padding: 4px 8px; border-radius: 6px;
    transition: all 0.15s;
  }
  .scanner-close:hover { color: var(--red); background: rgba(248,113,113,0.1); }

  .scanner-video-wrap {
    position: relative; width: 100%; aspect-ratio: 4/3;
    background: #000; overflow: hidden;
  }
  .scanner-video-wrap video {
    width: 100%; height: 100%; object-fit: cover;
  }

  .scanner-crosshair {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 220px; height: 100px;
    border: 2px solid var(--sky);
    border-radius: 12px;
    box-shadow: 0 0 0 3000px rgba(0,0,0,0.4);
    animation: scanPulse 2s infinite;
  }
  @keyframes scanPulse {
    0%, 100% { border-color: var(--sky); box-shadow: 0 0 0 3000px rgba(0,0,0,0.4), 0 0 20px rgba(91,184,245,0.3); }
    50% { border-color: var(--cyan); box-shadow: 0 0 0 3000px rgba(0,0,0,0.4), 0 0 30px rgba(52,216,232,0.5); }
  }

  .scanner-line {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 200px; height: 2px;
    background: linear-gradient(90deg, transparent, var(--sky), transparent);
    animation: scanLine 1.5s ease-in-out infinite;
  }
  @keyframes scanLine {
    0% { transform: translate(-50%, -60px); }
    50% { transform: translate(-50%, 60px); }
    100% { transform: translate(-50%, -60px); }
  }

  .scanner-status {
    padding: 16px 20px; text-align: center;
    font-size: 13px; color: var(--gray);
  }
  .scanner-status.found {
    color: var(--green); font-weight: 600;
  }
  .scanner-status.not-found {
    color: var(--orange);
  }

  .scanner-result {
    padding: 0 20px 20px; display: flex; flex-direction: column; gap: 10px;
  }
  .scanner-result-item {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--card2); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 16px;
  }
  .scanner-result-name { font-size: 14px; font-weight: 500; color: var(--light); }
  .scanner-result-price { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: var(--sky); }
  .scanner-result-stock { font-size: 12px; color: var(--gray); }

  .scanner-add-btn {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, var(--blue), var(--sky));
    border: none; border-radius: 10px;
    color: white; font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  }
  .scanner-add-btn:hover { transform: translateY(-1px); }

  .scanner-manual {
    padding: 12px 20px 20px; display: flex; gap: 8px;
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
    font-family: 'DM Sans', sans-serif; cursor: pointer;
  }
`

export default function BarcodeScanner({ products, onProductFound, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('starting')
  const [scannedCode, setScannedCode] = useState('')
  const [foundProduct, setFoundProduct] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const scanIntervalRef = useRef(null)

  // ─── Known barcode → product mapping (Mexican products) ───
  const BARCODE_DB = {
    '7501055303182': 'Coca-Cola 600ml',
    '7501055303311': 'Coca-Cola 1L',
    '7501055303069': 'Coca-Cola 2L',
    '7501055363391': 'Sprite 600ml',
    '7501055305346': 'Fanta 600ml',
    '7501000611072': 'Pepsi 600ml',
    '7501011167063': 'Sabritas Original',
    '7501011143210': 'Doritos Nacho',
    '7501011143258': 'Cheetos Torciditos',
    '7501011143319': 'Ruffles Queso',
    '7501000108008': 'Bimbo Pan Blanco',
    '7501000109005': 'Bimbo Pan Integral',
    '7500435019811': 'Marinela Gansito',
    '7501055304769': 'Ciel 1L',
    '7501055304899': 'Ciel 1.5L',
    '7501005110013': 'Leche Lala 1L',
    '7501005115018': 'Leche Alpura 1L',
    '7501011160934': 'Takis Fuego',
    '7501008005012': 'Maruchan Pollo',
    '7501008005029': 'Maruchan Camarón',
    '7501035910102': 'Nescafé Clásico',
    '7506195113011': 'Tang Naranja',
  }

  // ─── Start camera ───
  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setStatus('scanning')
        startScanning()
      } catch (err) {
        console.error('Camera error:', err)
        setStatus('no-camera')
      }
    }

    startCamera()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  // ─── Simple barcode detection using BarcodeDetector API ───
  const startScanning = () => {
    // Try native BarcodeDetector API (Chrome 83+, Android)
    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] })
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue
            handleBarcode(code)
          }
        } catch (e) { /* ignore frame errors */ }
      }, 300)
    } else {
      setStatus('manual-only')
    }
  }

  // ─── Handle detected barcode ───
  const handleBarcode = useCallback((code) => {
    if (scannedCode === code) return // Avoid duplicates
    setScannedCode(code)

    // 1. Check known barcode DB
    const knownName = BARCODE_DB[code]
    if (knownName) {
      const found = products.find(p => p.nombre.toLowerCase().includes(knownName.toLowerCase()))
      if (found) {
        setFoundProduct(found)
        setStatus('found')
        return
      }
    }

    // 2. Search products by barcode field (if exists in DB)
    const byBarcode = products.find(p => p.codigo_barras === code || p.barcode === code)
    if (byBarcode) {
      setFoundProduct(byBarcode)
      setStatus('found')
      return
    }

    // 3. Not found
    setFoundProduct(null)
    setStatus('not-found')
  }, [products, scannedCode])

  const handleManualSearch = () => {
    if (manualCode.trim()) handleBarcode(manualCode.trim())
  }

  const handleAddToCart = () => {
    if (foundProduct) {
      onProductFound(foundProduct)
      setFoundProduct(null)
      setScannedCode('')
      setStatus('scanning')
    }
  }

  return (
    <>
      <style>{scannerStyles}</style>
      <div className="scanner-overlay" onClick={onClose}>
        <div className="scanner-container" onClick={e => e.stopPropagation()}>
          <div className="scanner-header">
            <h3>📷 Escáner de código de barras</h3>
            <button className="scanner-close" onClick={onClose}>✕</button>
          </div>

          <div className="scanner-video-wrap">
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {status === 'scanning' && (
              <>
                <div className="scanner-crosshair" />
                <div className="scanner-line" />
              </>
            )}
          </div>

          <div className={`scanner-status ${status}`}>
            {status === 'starting' && '⏳ Iniciando cámara...'}
            {status === 'scanning' && '📷 Apunte al código de barras del producto'}
            {status === 'found' && `✅ Producto encontrado: ${scannedCode}`}
            {status === 'not-found' && `⚠️ Código ${scannedCode} no encontrado en inventario`}
            {status === 'no-camera' && '❌ No se pudo acceder a la cámara. Use el campo manual.'}
            {status === 'manual-only' && '📝 Su navegador no soporta escaneo. Use el campo manual.'}
          </div>

          {foundProduct && (
            <div className="scanner-result">
              <div className="scanner-result-item">
                <div>
                  <div className="scanner-result-name">{foundProduct.nombre}</div>
                  <div className="scanner-result-stock">{foundProduct.stock} uds en stock</div>
                </div>
                <span className="scanner-result-price">${foundProduct.precio?.toFixed(2)}</span>
              </div>
              <button className="scanner-add-btn" onClick={handleAddToCart}>
                + Agregar al carrito
              </button>
            </div>
          )}

          <div className="scanner-manual">
            <input
              className="scanner-manual-input"
              placeholder="Código manual..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            />
            <button className="scanner-manual-btn" onClick={handleManualSearch}>Buscar</button>
          </div>
        </div>
      </div>
    </>
  )
}