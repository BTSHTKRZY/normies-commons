export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { type = 'all' } = req.query
  const results = {}

  // ── SALES / ACTIVITY from Reservoir ────────────────────────────────────────
  if (type === 'all' || type === 'sales') {
    try {
      // Normies contract address
      const contract = '0x9Eb6E2025B64f340691e424b7fe7022fFDE12438'
      const r = await fetch(
        `https://api.reservoir.tools/collections/activity/v6?collection=${contract}&limit=20&types[]=sale&types[]=transfer`,
        {
          headers: { 'x-api-key': 'demo-api-key' },
          signal: AbortSignal.timeout(5000),
        }
      )
      const data = await r.json()
      const activities = (data?.activities || []).map(a => ({
        type: a.type,
        tokenId: a.token?.tokenId,
        name: a.token?.tokenName || `Normie #${a.token?.tokenId}`,
        price: a.price?.amount?.decimal ? `${parseFloat(a.price.amount.decimal).toFixed(4)} ETH` : null,
        from: a.fromAddress ? `${a.fromAddress.slice(0,6)}...${a.fromAddress.slice(-4)}` : null,
        to: a.toAddress ? `${a.toAddress.slice(0,6)}...${a.toAddress.slice(-4)}` : null,
        ts: a.timestamp ? a.timestamp * 1000 : Date.now(),
      })).filter(a => a.tokenId)
      results.sales = activities
    } catch {
      results.sales = []
    }
  }

  // ── FLOOR PRICE ─────────────────────────────────────────────────────────────
  if (type === 'all' || type === 'floor') {
    try {
      const r = await fetch(
        'https://api.reservoir.tools/collections/v7?slug=normies&includeTopBid=false',
        { headers: { 'x-api-key': 'demo-api-key' }, signal: AbortSignal.timeout(4000) }
      )
      const d = await r.json()
      const fp = d?.collections?.[0]?.floorAsk?.price?.amount?.decimal
      const vol = d?.collections?.[0]?.volume?.['1day']
      results.floor = fp ? `${parseFloat(fp).toFixed(4)} ETH` : null
      results.volume24h = vol ? `${parseFloat(vol).toFixed(2)} ETH` : null
    } catch {
      // Try OpenSea fallback
      try {
        const r = await fetch('https://api.opensea.io/api/v2/collections/normies/stats', { signal: AbortSignal.timeout(4000) })
        const d = await r.json()
        results.floor = d?.total?.floor_price ? `${parseFloat(d.total.floor_price).toFixed(4)} ETH` : null
      } catch {
        results.floor = null
      }
    }
  }

  // ── AI / AGENTIC NEWS from RSS feeds ────────────────────────────────────────
  if (type === 'all' || type === 'news') {
    const RSS_FEEDS = [
      'https://feeds.feedburner.com/TheHackersNews',
      'https://techcrunch.com/feed/',
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      'https://decrypt.co/feed',
    ]
    const AI_KEYWORDS = ['agent', 'agentic', 'AI agent', 'ERC-8004', 'onchain AI', 'NFT identity', 'autonomous agent', 'web3 AI', 'crypto AI']

    const newsItems = []
    for (const feedUrl of RSS_FEEDS) {
      try {
        const r = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`,
          { signal: AbortSignal.timeout(4000) }
        )
        const d = await r.json()
        const items = d?.items || []
        for (const item of items) {
          const text = `${item.title} ${item.description || ''}`.toLowerCase()
          const matches = AI_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))
          if (matches) {
            newsItems.push({
              title: item.title,
              url: item.link,
              source: new URL(feedUrl).hostname.replace('www.', '').replace('feeds.feedburner.com/', ''),
              ts: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
            })
          }
        }
      } catch { /* continue to next feed */ }
    }

    // Sort by newest, deduplicate by title
    const seen = new Set()
    results.news = newsItems
      .filter(n => { if (seen.has(n.title)) return false; seen.add(n.title); return true; })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
  }

  return res.status(200).json(results)
}
