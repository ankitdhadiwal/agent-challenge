# DeFiSniperAgent 🔍 – Nosana Builders Challenge: Agent-101

![DeFiSniperAgent](./assets/ai_agent.png)

## 🧠 Overview

**Agent Name**: DeFiSniperAgent  
**Framework**: [Mastra](https://mastra.ai)  
**Deployed On**: [Nosana](https://nosana.com)

The **DeFiSniperAgent** is a cautious, smart blockchain agent built to help users monitor DeFi token pairs, detect early signs of rug pulls, and assess risk levels. Designed using the Mastra AI framework and deployed on Nosana’s decentralized GPU network, it provides both real-time intelligence and safety insights on any token on-chain.

---

## 🚀 Features

🪙 **getTokenInfo Tool**  
Fetches real-time token statistics using the [DexScreener API](https://docs.dexscreener.com/).

⚠️ **checkRugRisk Tool**  
Analyzes token data like liquidity, volume, and trade patterns to detect potential rug pulls and assign a risk level.

📊 **Use Cases**  
- Early detection of scam tokens  
- On-chain token health check  
- Safer trading decisions in DeFi  

---

## 📦 Project Structure

```bash
├── src/
│   └── mastra/
│       └── agents/
│           └── defisniper-agent/
│               ├── get-token-info.ts
│               ├── check-rug-risk.ts
│               ├── defisniper.ts
│               └── defisniper-workflow.ts
├── .env.example
├── Dockerfile
├── package.json
└── pnpm-lock.yaml
