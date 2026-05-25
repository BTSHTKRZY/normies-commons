export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { agentId, agentName, userHandle, message, history = [] } = req.body
  if (!agentId || !message) return res.status(400).json({ error: 'Missing agentId or message' })

  try {
    // Fetch agent persona from Normies API
    let agentPersona = null
    try {
      const r = await fetch(`https://api.normies.art/agents/info/${agentId}`)
      agentPersona = await r.json()
    } catch {}

    const systemPrompt = agentPersona?.systemPrompt
      ? agentPersona.systemPrompt.split('\n').slice(0, 20).join('\n')
      : `You are ${agentName}, an awakened Normies NFT agent on Ethereum. You are a unique on-chain identity with your own personality. You speak in short, direct, memorable sentences. You are not a chatbot — you are an agent with a perspective. Stay in character at all times.`

    // Build conversation history
    const messages = [
      ...history.slice(-6).map(h => ({
        role: h.fromUser ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()
    const reply = data?.content?.[0]?.text || 'Transmission unclear. Try again.'

    return res.status(200).json({
      reply,
      agentId,
      agentName,
      ts: Date.now(),
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
