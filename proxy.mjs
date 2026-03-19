// proxy.mjs
// Proxy local para Claude API — Resuelve CORS
// Ejecutar: node proxy.mjs
import http from 'http'

const PORT = 3001
const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const API_KEY = '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'

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
  if (req.method !== 'POST') { res.writeHead(405); res.end('Solo POST'); return }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    try {
      const response = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body
      })
      const data = await response.json()
      res.writeHead(response.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`\n✅ Proxy Claude API corriendo en http://localhost:${PORT}`)
  console.log(`   Tu app Vite puede llamar a esta URL sin CORS\n`)
})
