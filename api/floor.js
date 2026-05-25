export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Try multiple sources in order
  const sources = [
    // Source 1: Reservoir with correct slug
    async () => {
      const r = await fetch(
        'https://api.reservoir.tools/collections/v7?slug=normies&includeTopBid=false',
        { headers: { 'x-api-key': 'demo-api-key' }, signal: AbortSignal.timeout(4000) }
      )
      const d = await r.json()
      const fp = d?.collections?.[0]?.floorAsk?.price?.amount?.decimal
      if (fp) return `${parseFloat(fp).toFixed(4)} ETH`
      return null
    },
    // Source 2: Reservoir by contract address
    async () => {
      // Normies contract address on Ethereum
      const contract = '0x4c9a2d72e4c33ea6b9e51c6d5be8c1b6e8e9a2d7'
      const r = await fetch(
        `https://api.reservoir.tools/collections/v7?contract=${contract}&includeTopBid=false`,
        { headers: { 'x-api-key': 'demo-api-key' }, signal: AbortSignal.timeout(4000) }
      )
      const d = await r.json()
      const fp = d?.collections?.[0]?.floorAsk?.price?.amount?.decimal
      if (fp) return `${parseFloat(fp).toFixed(4)} ETH`
      return null
    },
    // Source 3: OpenSea API v2 (no key required for public stats)
    async () => {
      const r = await fetch(
        'https://api.opensea.io/api/v2/collections/normies/stats',
        {
          headers: { 'accept': 'application/json' },
          signal: AbortSignal.timeout(4000)
        }
      )
      const d = await r.json()
      const fp = d?.total?.floor_price
      if (fp) return `${parseFloat(fp).toFixed(4)} ETH`
      return null
    },
    // Source 4: Normies own API stats if available
    async () => {
      const r = await fetch(
        'https://api.normies.art/history/stats',
        { signal: AbortSignal.timeout(4000) }
      )
      const d = await r.json()
      if (d?.floorPrice) return `${parseFloat(d.floorPrice).toFixed(4)} ETH`
      return null
    },
  ]

  for (const source of sources) {
    try {
      const result = await source()
      if (result) {
        return res.status(200).json({ floor: result, source: 'live' })
      }
    } catch {
      // try next source
    }
  }

  // All sources failed — return null so frontend keeps last known value
  return res.status(200).json({ floor: null, source: 'fallback' })
}
