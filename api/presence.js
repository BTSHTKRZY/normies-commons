import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const PRESENCE_TTL = 45 // seconds
const PRESENCE_KEY = 'commons:presence'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // POST — heartbeat (user is online)
  if (req.method === 'POST') {
    const { handle, room = 'commons' } = req.body
    if (!handle) return res.status(400).json({ error: 'No handle' })
    const key = `${PRESENCE_KEY}:${room}`
    const ts = Date.now()
    try {
      // Store handle -> timestamp as hash
      await redis.hset(key, { [handle]: ts })
      await redis.expire(key, 300) // keep hash alive 5min, we prune stale manually
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // GET — list online users
  if (req.method === 'GET') {
    const { room = 'commons' } = req.query
    const key = `${PRESENCE_KEY}:${room}`
    try {
      const data = await redis.hgetall(key)
      if (!data) return res.status(200).json({ users: [] })
      const now = Date.now()
      const cutoff = now - PRESENCE_TTL * 1000
      // Filter to users active in last 45 seconds
      const users = Object.entries(data)
        .filter(([, ts]) => parseInt(ts) > cutoff)
        .map(([handle, ts]) => ({ handle, ts: parseInt(ts) }))
        .sort((a, b) => b.ts - a.ts)
      return res.status(200).json({ users })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // DELETE — user left
  if (req.method === 'DELETE') {
    const { handle, room = 'commons' } = req.body
    if (!handle) return res.status(400).json({ error: 'No handle' })
    const key = `${PRESENCE_KEY}:${room}`
    try {
      await redis.hdel(key, handle)
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
