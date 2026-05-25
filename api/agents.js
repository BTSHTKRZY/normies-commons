export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { tokenId } = req.query

  try {
    if (tokenId) {
      // Fetch single agent
      const response = await fetch(`https://api.normies.art/agents/info/${tokenId}`)
      const data = await response.json()
      return res.status(200).json(data)
    } else {
      // Fetch all awakened agents
      const response = await fetch('https://api.normies.art/agents/list')
      const data = await response.json()
      return res.status(200).json(data)
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
