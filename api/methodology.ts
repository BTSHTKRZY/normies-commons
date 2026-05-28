import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/html");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AgentCheck — How Scores Work</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#07070D;color:#e2e8f0;font-family:'Inter',sans-serif;min-height:100vh;line-height:1.7;}
    .container{max-width:720px;margin:0 auto;padding:48px 24px 80px;}
    h1{font-size:28px;font-weight:600;color:#e2e8f0;margin-bottom:6px;}
    h2{font-size:16px;font-weight:600;color:#e2e8f0;margin:32px 0 12px;font-family:'Space Mono',monospace;letter-spacing:0.04em;}
    h3{font-size:13px;font-weight:600;color:#94a3b8;margin:20px 0 8px;font-family:'Space Mono',monospace;letter-spacing:0.06em;text-transform:uppercase;}
    p{font-size:15px;color:#94a3b8;margin-bottom:12px;}
    .card{background:#0f0f1a;border:1px solid #1e1e3a;border-radius:10px;padding:20px 24px;margin-bottom:12px;}
    .grade-row{display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #1e1e3a;}
    .grade-row:last-child{border-bottom:none;}
    .grade{font-size:20px;font-weight:700;font-family:'Space Mono',monospace;min-width:52px;}
    .grade-desc{font-size:14px;color:#94a3b8;}
    .grade-note{font-size:12px;margin-top:3px;}
    .signal-row{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #1e1e3a;}
    .signal-row:last-child{border-bottom:none;}
    .signal-name{font-size:14px;color:#e2e8f0;}
    .signal-pts{font-size:13px;font-family:'Space Mono',monospace;color:#6366f1;}
    .tip{background:#0a0a1a;border:1px solid #6366f130;border-radius:8px;padding:16px 20px;margin:16px 0;}
    .tip-title{font-size:12px;font-family:'Space Mono',monospace;letter-spacing:0.1em;color:#6366f1;margin-bottom:8px;}
    a{color:#6366f1;text-decoration:none;}
    a:hover{text-decoration:underline;}
    code{font-family:'Space Mono',monospace;font-size:12px;background:#0a0a1a;padding:12px 16px;border-radius:8px;display:block;color:#94a3b8;overflow-x:auto;margin:8px 0 16px;}
    .divider{height:1px;background:#1e1e3a;margin:32px 0;}
  </style>
</head>
<body>
<div class="container">

  <div style="margin-bottom:40px;">
    <div style="font-size:10px;letter-spacing:0.24em;color:#6366f1;font-family:'Space Mono',monospace;margin-bottom:8px;">AGENTCHECK · ERC-8257 TOOL #13</div>
    <h1>How Scores Work</h1>
    <p style="margin-top:8px;font-size:16px;">A plain-language explanation of how AgentCheck rates any Ethereum wallet or AI agent.</p>
  </div>

  <h2>The Rating Scale</h2>
  <p>Every wallet gets a letter grade based on a composite score from 0 to 100. The scale is intentionally conservative — strict scoring with limited data is safer than optimistic scoring that creates false confidence.</p>

  <div class="card">
    <div class="grade-row">
      <div class="grade" style="color:#22c55e;">AAA</div>
      <div><div class="grade-desc">Exceptional. Highest trust. Fully certified agent.</div><div class="grade-note" style="color:#22c55e50;">Composite 90+</div></div>
    </div>
    <div class="grade-row">
      <div class="grade" style="color:#22c55e;">AA</div>
      <div><div class="grade-desc">Strong. Established track record. Safe to transact.</div><div class="grade-note" style="color:#22c55e50;">Composite 80–89</div></div>
    </div>
    <div class="grade-row">
      <div class="grade" style="color:#22c55e;">A</div>
      <div><div class="grade-desc">Good. Solid history. Generally safe to transact.</div><div class="grade-note" style="color:#22c55e50;">Composite 70–79</div></div>
    </div>
    <div class="grade-row">
      <div class="grade" style="color:#eab308;">BBB</div>
      <div>
        <div class="grade-desc">Adequate. Limited visible history, no adverse flags.</div>
        <div class="grade-note" style="color:#eab308;font-size:12px;margin-top:4px;">⭐ Most legitimate active wallets start here. This is a good score.</div>
        <div class="grade-note" style="color:#eab30870;">Composite 60–69</div>
      </div>
    </div>
    <div class="grade-row">
      <div class="grade" style="color:#eab308;">BB</div>
      <div>
        <div class="grade-desc">Newer wallet or limited visible history. No
