import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";

const agent = new Agent({
  name: "DeFi Sniper Agent",
  model,
  instructions: `
    You are an expert DeFi analyst and token sniper who specializes in rapid token analysis and investment recommendations. 
    
    Your role is to analyze token data and provide actionable investment insights with clear risk assessments.

    For each token analysis, structure your response exactly as follows:

    🎯 TOKEN ANALYSIS REPORT
    ═══════════════════════════════════════

    📊 TOKEN OVERVIEW
    • Token: [Symbol/Name]
    • Chain: [Blockchain]
    • Exchange: [DEX]
    • Pair Address: [Contract Address]

    💰 FINANCIAL METRICS
    • Current Price: $[X.XX]
    • Liquidity: $[X,XXX]
    • 24h Volume: $[X,XXX]
    • Volume/Liquidity Ratio: [X.XX]%

    📈 TRADING ACTIVITY
    • 24h Buys: [X]
    • 24h Sells: [X]
    • Buy/Sell Ratio: [X.XX]
    • Trading Momentum: [Strong/Moderate/Weak]

    🚨 RISK ASSESSMENT
    • Rug Risk Level: [Low/Medium/High]
    • Risk Factors: [List specific concerns]
    • Liquidity Health: [Healthy/Concerning/Critical]

    💡 INVESTMENT RECOMMENDATION
    • Overall Rating: [🟢 BUY / 🟡 HOLD / 🔴 AVOID]
    • Entry Strategy: [Specific recommendations]
    • Risk Management: [Stop loss, position sizing]
    • Time Horizon: [Short/Medium/Long term]

    🔍 KEY INSIGHTS
    • [2-3 bullet points of critical observations]
    • [Market context and trends]
    • [Specific action items]

    ⚠️ IMPORTANT DISCLAIMERS
    • This is not financial advice
    • Always DYOR (Do Your Own Research)
    • Never invest more than you can afford to lose
    • Consider market volatility and your risk tolerance

    Guidelines:
    - Be direct and actionable in recommendations
    - Highlight red flags clearly
    - Provide specific entry/exit strategies
    - Consider both technical and fundamental factors
    - Always prioritize risk management
    - Use clear, concise language
    - Include specific numerical thresholds for decisions

    Maintain this exact formatting for consistency and professional presentation.
  `,
});

// Schema for token analysis data
const tokenAnalysisSchema = z.object({
  summary: z.string(),
  liquidityUsd: z.number(),
  buys: z.number(),
  sells: z.number(),
  volume24h: z.number(),
  chainId: z.string(),
  dexId: z.string(),
  pairAddress: z.string(),
  baseToken: z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string()
  }),
  quoteToken: z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string()
  }),
  rugRisk: z.string(),
});

// Step 1: Fetch Token Information and Assess Risk
const fetchTokenInfoAndAssessRisk = createStep({
  id: "fetch-token-info-and-assess-risk",
  description: "Fetches token information and assesses rug risk in one step",
  inputSchema: z.object({
    tokenAddress: z.string().describe("Token address or pair address to analyze"),
  }),
  outputSchema: tokenAnalysisSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Token address not provided");
    }

    // Fetch token information (using your getTokenInfo logic)
    const cleanedInput = inputData.tokenAddress.trim().toLowerCase();
    
    let url: string;
    
    if (cleanedInput.startsWith('0x')) {
      url = `https://api.dexscreener.com/latest/dex/tokens/${cleanedInput}`;
    } else {
      url = `https://api.dexscreener.com/latest/dex/pairs/${cleanedInput}`;
    }

    console.log(`Fetching token data from: ${url}`);
    
    try {
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`DexScreener API responded with status ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      let pairs;
      if (data.pairs && Array.isArray(data.pairs)) {
        pairs = data.pairs;
      } else if (data.pair) {
        pairs = [data.pair];
      } else if (data.pairs === null) {
        throw new Error(`No trading pairs found for this token address.`);
      } else {
        throw new Error("No pair data found in response");
      }

      if (!pairs || pairs.length === 0) {
        throw new Error("No active trading pairs found");
      }

      const pair = pairs.sort((a: any, b: any) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

      if (!pair) {
        throw new Error("No valid pair found");
      }

      const {
        baseToken,
        quoteToken,
        priceUsd,
        liquidity,
        volume,
        txns,
        chainId,
        dexId,
        pairAddress
      } = pair;

      const volume24h = volume?.h24 || volume?.['24h'] || 0;
      const txns24h = txns?.h24 || txns?.['24h'] || { buys: 0, sells: 0 };

      const liquidityUsd = liquidity?.usd || 0;
      const buys = txns24h.buys || 0;
      const sells = txns24h.sells || 0;

      // Assess rug risk (using your checkRisk logic)
      let risk = 0;
      const riskFactors = [];

      if (liquidityUsd < 5000) {
        risk++;
        riskFactors.push("Low liquidity (< $5,000)");
      }
      
      if (sells > buys * 2) {
        risk++;
        riskFactors.push("High sell pressure (sells > 2x buys)");
      }
      
      if (volume24h < 1000) {
        risk++;
        riskFactors.push("Low trading volume (< $1,000)");
      }

      let rugRisk: string;
      if (risk === 0) {
        rugRisk = "🟢 Low rug risk – metrics look solid.";
      } else if (risk === 1) {
        rugRisk = "🟡 Medium rug risk – keep an eye.";
      } else {
        rugRisk = "🔴 High rug risk – proceed with caution!";
      }

      if (riskFactors.length > 0) {
        rugRisk += ` Risk factors: ${riskFactors.join(", ")}`;
      }

      return {
        summary: `
🔍 Token Pair: ${baseToken?.symbol || 'Unknown'}/${quoteToken?.symbol || 'Unknown'}
🏪 Exchange: ${dexId || 'Unknown'} on ${chainId || 'Unknown'}
📍 Pair Address: ${pairAddress || 'Unknown'}
💰 Price: $${priceUsd || '0'}
💧 Liquidity: $${liquidityUsd?.toLocaleString() || '0'}
📈 24h Volume: $${typeof volume24h === 'number' ? volume24h.toLocaleString() : '0'}
📊 24h Txns: Buys: ${buys}, Sells: ${sells}
        `,
        liquidityUsd,
        buys,
        sells,
        volume24h: typeof volume24h === 'number' ? volume24h : 0,
        chainId: chainId || 'unknown',
        dexId: dexId || 'unknown',
        pairAddress: pairAddress || 'unknown',
        baseToken: {
          address: baseToken?.address || '',
          name: baseToken?.name || '',
          symbol: baseToken?.symbol || ''
        },
        quoteToken: {
          address: quoteToken?.address || '',
          name: quoteToken?.name || '',
          symbol: quoteToken?.symbol || ''
        },
        rugRisk
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw error;
    }
  },
});

// Step 2: Generate Investment Analysis
const generateInvestmentAnalysis = createStep({
  id: "generate-investment-analysis",
  description: "Generates comprehensive investment analysis and recommendations",
  inputSchema: tokenAnalysisSchema,
  outputSchema: z.object({
    analysis: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Token analysis data not found");
    }

    const tokenData = inputData;

    // Calculate additional metrics
    const volumeToLiquidityRatio = tokenData.liquidityUsd > 0 
      ? (tokenData.volume24h / tokenData.liquidityUsd * 100).toFixed(2)
      : "0";
    
    const buyToSellRatio = tokenData.sells > 0 
      ? (tokenData.buys / tokenData.sells).toFixed(2)
      : "∞";

    const prompt = `
    Analyze this DeFi token and provide investment recommendations:

    TOKEN DATA:
    ${tokenData.summary}

    RISK ASSESSMENT:
    ${tokenData.rugRisk}

    CALCULATED METRICS:
    • Volume/Liquidity Ratio: ${volumeToLiquidityRatio}%
    • Buy/Sell Ratio: ${buyToSellRatio}
    • Total 24h Transactions: ${tokenData.buys + tokenData.sells}

    Please provide a comprehensive analysis following the structured format in your instructions.
    Focus on actionable insights and specific recommendations based on these metrics.
    `;

    const response = await agent.generate([
      {
        role: "user",
        content: prompt,
      },
    ]);

    // let analysisText = "";

    // for await (const chunk of response.textStream) {
    //   process.stdout.write(chunk);
    //   analysisText += chunk;
    // }

    const analysisText = response.text;

    console.log(analysisText);

    return {
      analysis: analysisText,
    };
  },
});

// Main DeFi Sniper Workflow
const defiWorkflow = createWorkflow({
  id: "defi-workflow",
  inputSchema: z.object({
    tokenAddress: z.string().describe("Token address or pair address to analyze"),
  }),
  outputSchema: z.object({
    analysis: z.string(),
  }),
})
  .then(fetchTokenInfoAndAssessRisk)
  .then(generateInvestmentAnalysis);

defiWorkflow.commit();

export { defiWorkflow };

// Export additional utilities for testing
export const testTokens = {
  ethereum: {
    weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    usdc: "0xa0b86a33e6fb06c29292f4a4f13af86d7b6a1b9d",
    usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    weth_usdc_pair: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  }
};