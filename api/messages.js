import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { room = 'commons' } = req.query
    try {
      const msgs = await redis.lrange(`commons:messages:${room}`, 0, 99)
      const parsed = msgs
        .map(m => { try { return typeof m === 'string' ? JSON.parse(m) : m } catch { return null } })
        .filter(Boolean)
      return res.status(200).json(parsed.reverse())
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'POST') {
    const { room = 'commons', senderName, agentId, text, type = 'text', mediaUrl, linkPreview } = req.body
    if (!text?.trim() && !mediaUrl) return res.status(400).json({ error: 'No content' })

    const msg = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      agentId: agentId || null,
      senderName,
      room,
      text: text?.trim() || '',
      type,
      mediaUrl: mediaUrl || null,
      linkPreview: linkPreview || null,
      ts: Date.now(),
      ap: 0,
    }

    try {
      await redis.lpush(`commons:messages:${room}`, JSON.stringify(msg))
      await redis.ltrim(`commons:messages:${room}`, 0, 199)
      return res.status(200).json(msg)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
