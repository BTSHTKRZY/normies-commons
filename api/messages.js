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

  // GET — fetch messages for a room
  if (req.method === 'GET') {
    const { room = 'commons' } = req.query
    try {
      const msgs = await redis.lrange(`messages:${room}`, 0, 49)
      const parsed = msgs.map(m => typeof m === 'string' ? JSON.parse(m) : m)
      return res.status(200).json(parsed.reverse())
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // POST — save a new message
  if (req.method === 'POST') {
    const { room = 'commons', agentId, text, handle } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'No text' })

    const msg = {
      id: Date.now(),
      agentId,
      handle,
      room,
      text: text.trim(),
      ts: Date.now(),
      ap: 0,
    }

    try {
      await redis.lpush(`messages:${room}`, JSON.stringify(msg))
      await redis.ltrim(`messages:${room}`, 0, 99)
      return res.status(200).json(msg)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
