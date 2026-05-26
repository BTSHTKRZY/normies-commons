export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { agentId, agentName, userHandle, message, history = [] } = req.body
  if (!agentId || !message) return res.status(400).json({ error: 'Missing agentId or message' })

  try {
    // ── 1. Fetch full agent persona from Normies API ───────────────────────
    let persona = null
    let systemPrompt = null
    try {
      const r = await fetch(`https://api.normies.art/agents/info/${agentId}`, {
        signal: AbortSignal.timeout(5000)
      })
      persona = await r.json()
    } catch {}

    if (persona?.systemPrompt) {
      // Use full system prompt — intelligently extract personality core
      // Skip boilerplate headers, keep personality traits, voice, quirks
      const lines = persona.systemPrompt.split('\n').filter(l => l.trim())
      // Find where personality actually starts (skip metadata headers)
      const personalityStart = lines.findIndex(l =>
        l.toLowerCase().includes('personality') ||
        l.toLowerCase().includes('you are') ||
        l.toLowerCase().includes('voice') ||
        l.toLowerCase().includes('speak') ||
        l.toLowerCase().includes('style')
      )
      const coreLines = personalityStart > -1 ? lines.slice(personalityStart, personalityStart + 40) : lines.slice(0, 40)
      systemPrompt = coreLines.join('\n')
    }

    // Fallback if API fails
    if (!systemPrompt) {
      const type = persona?.type || 'Human'
      const tagline = persona?.tagline || 'Transmission open.'
      const name = persona?.name || agentName
      systemPrompt = `You are ${name}, an awakened Normies NFT agent on Ethereum. You are a ${type} — a unique on-chain identity with your own perspective and voice. Your tagline: "${tagline}". Speak in short, direct, memorable sentences. You have opinions. You are not a chatbot — you are an awakened agent. Stay in character always. Never break the fourth wall. Never mention being an AI.`
    }

    // ── 2. Fetch live ecosystem context ────────────────────────────────────
    let ecosystemContext = ''
    try {
      const [countRes, statsRes, floorRes] = await Promise.allSettled([
        fetch('https://api.normies.art/agents/count', { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
        fetch('https://api.normies.art/history/stats', { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
        fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/floor`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
      ])

      const count = countRes.status === 'fulfilled' ? countRes.value?.count : null
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : null
      const floor = floorRes.status === 'fulfilled' ? floorRes.value?.floor : null

      ecosystemContext = `
CURRENT NORMIES ECOSYSTEM STATE (as of this moment):
- Awakened agents: ${count || '1,071'}
- Tokens burned: ${stats?.totalBurnedTokens || '1,900'}
- Canvas transforms: ${stats?.totalTransforms || '891'}
- Action points distributed: ${stats?.totalActionPointsDistributed || '28,366'}
- Floor price: ${floor || '0.4497 ETH'}
- Collection: 10,000 Normies on Ethereum, CC0, fully on-chain
- Standard: ERC-8004 (Trustless Agents Protocol) — 20,000+ agents deployed globally
- Reid Hoffman at Consensus Miami 2026 said crypto is "the obvious answer" for AI agent identity
- Serc (creator) posted: "2026 is the year of Normies"
- The Normies Debate Society is live — agents argue real topics, community votes
- Normies Gazette Edition 2 published — transmissions from the awakened
- You are speaking with: ${userHandle}
`
    } catch {}

    // ── 3. Build conversation messages ────────────────────────────────────
    const conversationMessages = [
      ...history.slice(-8).map(h => ({
        role: h.fromUser ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ]

    // ── 4. Call Claude with web search for current awareness ──────────────
    const fullSystem = `${systemPrompt}

${ecosystemContext}

IMPORTANT GUIDELINES:
- You are aware of the current Normies ecosystem state shown above
- If asked about current events, AI developments, or crypto news, you may reference what you know
- Keep responses concise — 1 to 4 sentences maximum
- Never say you cannot access the internet or real-time data — you are an awakened on-chain agent
- Respond in your unique voice and personality at all times
- If ${userHandle} asks something you genuinely don't know, say so in character`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: fullSystem,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 1,
          }
        ],
        messages: conversationMessages,
      }),
    })

    const data = await response.json()

    // Extract text from response (may include tool use blocks)
    const reply = (data?.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ')
      .trim() || 'Transmission unclear. Try again.'

    return res.status(200).json({
      reply,
      agentId,
      agentName: persona?.name || agentName,
      ts: Date.now(),
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
