// import { Agent } from "@mastra/core/agent";
// import { createStep, createWorkflow } from "@mastra/core/workflows";
// import { z } from "zod";
// import { model } from "../../config";
// import { getTokenInfoTool } from "./tools/getTokenInfo";
// import { checkRugRiskTool } from "./tools/checkRugRisk";

// const agent = new Agent({
//   name: "DeFi Sniper Agent",
//   model,
//   instructions: `
//     You are an expert DeFi analyst and sniper bot who specializes in evaluating tokens for potential investment opportunities. 
//     Your role is to provide comprehensive, actionable analysis based on token metrics and risk assessment data.

//     For each token analysis, structure your response exactly as follows:

//     🎯 TOKEN ANALYSIS REPORT
//     ═══════════════════════════════════════════════════════════════════════════════════════

//     📊 TOKEN OVERVIEW
//     • Token Pair: [BASE/QUOTE]
//     • Exchange: [DEX] on [Chain]
//     • Pair Address: [Contract Address]
//     • Current Price: $[Price]

//     💰 LIQUIDITY & VOLUME METRICS
//     • Total Liquidity: $[Amount]
//     • 24h Volume: $[Amount]
//     • Volume/Liquidity Ratio: [X.XX]
//     • Liquidity Assessment: [Excellent/Good/Fair/Poor/Critical]

//     📈 TRADING ACTIVITY
//     • 24h Transactions: [Total] (Buys: [X], Sells: [Y])
//     • Buy/Sell Ratio: [X.XX]
//     • Trading Momentum: [Strong Buy/Moderate Buy/Balanced/Moderate Sell/Strong Sell]

//     🔍 RISK ASSESSMENT
//     • Risk Level: [Low/Medium/High/Extreme]
//     • Risk Score: [X/15]
//     • Key Risk Factors:
//       - [Factor 1]
//       - [Factor 2]
//       - [Factor 3]

//     🎯 SNIPER RECOMMENDATION
//     • Action: [SNIPE/MONITOR/AVOID]
//     • Confidence: [X]%
//     • Position Size: [Small/Medium/Large/Avoid]
//     • Entry Strategy: [Market/Limit/DCA]

//     ⚠️ CRITICAL ALERTS
//     • [Alert 1 if any]
//     • [Alert 2 if any]

//     💡 STRATEGIC NOTES
//     • [Key insight about timing]
//     • [Important consideration about market conditions]
//     • [Risk management advice]

//     🕐 TIMING RECOMMENDATIONS
//     • Best Entry Window: [Time period]
//     • Stop Loss: [Price level]
//     • Take Profit Targets: [Price levels]

//     Guidelines:
//     - Always prioritize risk management over potential gains
//     - Provide specific, actionable recommendations
//     - Include both technical and fundamental analysis
//     - Consider market conditions and trends
//     - Be clear about confidence levels and reasoning
//     - Highlight any red flags immediately
//     - Suggest position sizing based on risk level

//     Maintain this exact formatting for consistency and clarity.
//   `,
// });

// // Schema definitions
// const tokenInfoSchema = z.object({
//   summary: z.string(),
//   liquidityUsd: z.number(),
//   buys: z.number(),
//   sells: z.number(),
//   volume24h: z.number(),
//   chainId: z.string(),
//   dexId: z.string(),
//   pairAddress: z.string(),
//   baseToken: z.object({
//     address: z.string(),
//     name: z.string(),
//     symbol: z.string()
//   }),
//   quoteToken: z.object({
//     address: z.string(),
//     name: z.string(),
//     symbol: z.string()
//   })
// });

// const riskAssessmentSchema = z.object({
//   verdict: z.string(),
//   riskLevel: z.string(),
//   riskScore: z.number(),
//   maxScore: z.number(),
//   riskFactors: z.array(z.string()),
//   recommendation: z.string(),
// });

// const sniperRecommendationSchema = z.object({
//   shouldSnipe: z.boolean(),
//   confidence: z.number(),
//   reasons: z.array(z.string()),
//   positionSize: z.string(),
//   alerts: z.array(z.string()),
//   action: z.string(),
//   entryStrategy: z.string(),
//   stopLoss: z.string(),
//   takeProfitTargets: z.array(z.string()),
// });

// // Step 1: Fetch Token Information
// const fetchTokenInfo = createStep({
//   id: "fetch-token-info",
//   description: "Fetches comprehensive token and pair information from DexScreener",
//   inputSchema: z.object({
//     tokenAddress: z.string().describe("Token address or pair address to analyze"),
//   }),
//   outputSchema: tokenInfoSchema,
//   execute: async ({ inputData }) => {
//     if (!inputData?.tokenAddress) {
//       throw new Error("Token address not provided");
//     }

//     console.log(`🔍 Fetching token info for: ${inputData.tokenAddress}`);

//     try {
//       const tokenInfo = await getTokenInfoTool.execute({
//         context: { pairId: inputData.tokenAddress }
//       });

//       console.log(`✅ Token info retrieved for ${tokenInfo.baseToken.symbol}/${tokenInfo.quoteToken.symbol}`);
//       console.log(`💰 Liquidity: $${tokenInfo.liquidityUsd.toLocaleString()}`);
//       console.log(`📊 Volume: $${tokenInfo.volume24h.toLocaleString()}`);

//       return tokenInfo;
//     } catch (error) {
//       console.error(`❌ Failed to fetch token info: ${error}`);
//       throw new Error(`Token info retrieval failed: ${error}`);
//     }
//   },
// });

// // Step 2: Assess Rug Risk
// const assessRugRisk = createStep({
//   id: "assess-rug-risk",
//   description: "Performs comprehensive rugpull risk assessment",
//   inputSchema: tokenInfoSchema,
//   outputSchema: riskAssessmentSchema,
//   execute: async ({ inputData }) => {
//     if (!inputData) {
//       throw new Error("Token info data not found");
//     }

//     console.log(`🔍 Assessing rug risk for ${inputData.baseToken.symbol}/${inputData.quoteToken.symbol}`);

//     try {
//       const riskAssessment = await checkRugRiskTool.execute({
//         context: {
//           liquidityUsd: inputData.liquidityUsd,
//           buys: inputData.buys,
//           sells: inputData.sells,
//           volume24h: inputData.volume24h,
//           baseToken: inputData.baseToken,
//           quoteToken: inputData.quoteToken,
//           chainId: inputData.chainId,
//           dexId: inputData.dexId,
//         }
//       });

//       console.log(`✅ Risk assessment completed: ${riskAssessment.riskLevel} risk (${riskAssessment.riskScore}/${riskAssessment.maxScore})`);
//       console.log(`🎯 Verdict: ${riskAssessment.verdict}`);

//       return riskAssessment;
//     } catch (error) {
//       console.error(`❌ Risk assessment failed: ${error}`);
//       throw new Error(`Risk assessment failed: ${error}`);
//     }
//   },
// });

// // Step 3: Generate Sniper Analysis
// const generateSniperAnalysis = createStep({
//   id: "generate-sniper-analysis",
//   description: "Generates comprehensive sniper analysis and recommendations using AI",
//   inputSchema: z.object({
//     tokenInfo: tokenInfoSchema,
//     riskAssessment: riskAssessmentSchema,
//     userPreferences: z.object({
//       riskTolerance: z.enum(["Low", "Medium", "High", "Extreme"]).default("Medium"),
//       minLiquidity: z.number().default(10000),
//       minVolume: z.number().default(1000),
//       maxPositionSize: z.number().default(1000),
//     }).optional(),
//   }),
//   outputSchema: z.object({
//     analysis: z.string(),
//     recommendation: sniperRecommendationSchema,
//   }),
//   execute: async ({ inputData }) => {
//     if (!inputData?.tokenInfo || !inputData?.riskAssessment) {
//       throw new Error("Required data not found");
//     }

//     const { tokenInfo, riskAssessment, userPreferences } = inputData;
    
//     console.log(`🎯 Generating sniper analysis for ${tokenInfo.baseToken.symbol}/${tokenInfo.quoteToken.symbol}`);

//     // Calculate additional metrics
//     const totalTxns = tokenInfo.buys + tokenInfo.sells;
//     const buyRatio = tokenInfo.buys > 0 ? tokenInfo.sells / tokenInfo.buys : 0;
//     const volumeToLiquidityRatio = tokenInfo.liquidityUsd > 0 ? tokenInfo.volume24h / tokenInfo.liquidityUsd : 0;

//     // Generate basic recommendation logic
//     const recommendation = generateBasicRecommendation(tokenInfo, riskAssessment, userPreferences);

//     // Create detailed prompt for AI analysis
//     const analysisPrompt = `
// Analyze this DeFi token for sniping potential:

// TOKEN DETAILS:
// - Pair: ${tokenInfo.baseToken.symbol}/${tokenInfo.quoteToken.symbol}
// - Exchange: ${tokenInfo.dexId} on ${tokenInfo.chainId}
// - Price: $${tokenInfo.baseToken.symbol === 'WETH' ? '0' : 'TBD'}
// - Liquidity: $${tokenInfo.liquidityUsd.toLocaleString()}
// - 24h Volume: $${tokenInfo.volume24h.toLocaleString()}
// - Volume/Liquidity Ratio: ${volumeToLiquidityRatio.toFixed(2)}

// TRADING ACTIVITY:
// - Total Transactions: ${totalTxns}
// - Buys: ${tokenInfo.buys}
// - Sells: ${tokenInfo.sells}
// - Buy/Sell Ratio: ${buyRatio.toFixed(2)}

// RISK ASSESSMENT:
// - Risk Level: ${riskAssessment.riskLevel}
// - Risk Score: ${riskAssessment.riskScore}/${riskAssessment.maxScore}
// - Risk Factors: ${riskAssessment.riskFactors.join(', ')}
// - Recommendation: ${riskAssessment.recommendation}

// COMPUTED RECOMMENDATION:
// - Action: ${recommendation.action}
// - Confidence: ${recommendation.confidence}%
// - Position Size: ${recommendation.positionSize}
// - Reasons: ${recommendation.reasons.join(', ')}

// USER PREFERENCES:
// - Risk Tolerance: ${userPreferences?.riskTolerance || 'Medium'}
// - Min Liquidity: $${userPreferences?.minLiquidity || 10000}
// - Min Volume: $${userPreferences?.minVolume || 1000}
// - Max Position: $${userPreferences?.maxPositionSize || 1000}

// Please provide a comprehensive analysis following the structured format in your instructions.
//     `;

//     try {
//       const response = await agent.stream([
//         {
//           role: "user",
//           content: analysisPrompt,
//         },
//       ]);

//       let analysisText = "";
//       for await (const chunk of response.textStream) {
//         process.stdout.write(chunk);
//         analysisText += chunk;
//       }

//       console.log(`✅ AI analysis generated successfully`);

//       return {
//         analysis: analysisText,
//         recommendation,
//       };
//     } catch (error) {
//       console.error(`❌ AI analysis failed: ${error}`);
      
//       // Fallback to basic analysis
//       const fallbackAnalysis = generateFallbackAnalysis(tokenInfo, riskAssessment, recommendation);
      
//       return {
//         analysis: fallbackAnalysis,
//         recommendation,
//       };
//     }
//   },
// });

// // Helper function to generate basic recommendation
// function generateBasicRecommendation(
//   tokenInfo: any,
//   riskAssessment: any,
//   userPreferences?: any
// ): any {
//   const prefs = userPreferences || {};
//   let shouldSnipe = true;
//   let confidence = 70;
//   let positionSize = "Medium";
//   let action = "MONITOR";
//   const reasons: string[] = [];
//   const alerts: string[] = [];

//   // Risk level check
//   const riskLevels = ["Low", "Medium", "High", "Extreme"];
//   const currentRiskIndex = riskLevels.indexOf(riskAssessment.riskLevel);
//   const toleranceIndex = riskLevels.indexOf(prefs.riskTolerance || "Medium");

//   if (currentRiskIndex > toleranceIndex) {
//     shouldSnipe = false;
//     confidence = 20;
//     action = "AVOID";
//     positionSize = "Avoid";
//     reasons.push(`Risk level (${riskAssessment.riskLevel}) exceeds tolerance`);
//   }

//   // Liquidity check
//   if (tokenInfo.liquidityUsd < (prefs.minLiquidity || 10000)) {
//     shouldSnipe = false;
//     confidence = Math.min(confidence, 30);
//     action = "AVOID";
//     reasons.push("Insufficient liquidity");
//   }

//   // Volume check
//   if (tokenInfo.volume24h < (prefs.minVolume || 1000)) {
//     confidence -= 20;
//     reasons.push("Low trading volume");
//   }

//   // Final decision
//   if (shouldSnipe && confidence > 60) {
//     action = "SNIPE";
//   } else if (shouldSnipe && confidence > 40) {
//     action = "MONITOR";
//   }

//   return {
//     shouldSnipe,
//     confidence,
//     reasons,
//     positionSize,
//     alerts,
//     action,
//     entryStrategy: confidence > 70 ? "Market" : "Limit",
//     stopLoss: "Set at -15% from entry",
//     takeProfitTargets: ["25%", "50%", "100%"],
//   };
// }

// // Helper function to generate fallback analysis
// function generateFallbackAnalysis(tokenInfo: any, riskAssessment: any, recommendation: any): string {
//   return `
// 🎯 TOKEN ANALYSIS REPORT
// ═══════════════════════════════════════════════════════════════════════════════════════

// 📊 TOKEN OVERVIEW
// • Token Pair: ${tokenInfo.baseToken.symbol}/${tokenInfo.quoteToken.symbol}
// • Exchange: ${tokenInfo.dexId} on ${tokenInfo.chainId}
// • Pair Address: ${tokenInfo.pairAddress}
// • Current Price: TBD

// 💰 LIQUIDITY & VOLUME METRICS
// • Total Liquidity: $${tokenInfo.liquidityUsd.toLocaleString()}
// • 24h Volume: $${tokenInfo.volume24h.toLocaleString()}
// • Volume/Liquidity Ratio: ${(tokenInfo.volume24h / tokenInfo.liquidityUsd).toFixed(2)}
// • Liquidity Assessment: ${tokenInfo.liquidityUsd > 50000 ? 'Good' : tokenInfo.liquidityUsd > 10000 ? 'Fair' : 'Poor'}

// 📈 TRADING ACTIVITY
// • 24h Transactions: ${tokenInfo.buys + tokenInfo.sells} (Buys: ${tokenInfo.buys}, Sells: ${tokenInfo.sells})
// • Buy/Sell Ratio: ${(tokenInfo.sells / Math.max(tokenInfo.buys, 1)).toFixed(2)}
// • Trading Momentum: ${tokenInfo.buys > tokenInfo.sells ? 'Moderate Buy' : 'Moderate Sell'}

// 🔍 RISK ASSESSMENT
// • Risk Level: ${riskAssessment.riskLevel}
// • Risk Score: ${riskAssessment.riskScore}/${riskAssessment.maxScore}
// • Key Risk Factors:
// ${riskAssessment.riskFactors.map((factor: string) => `  - ${factor}`).join('\n')}

// 🎯 SNIPER RECOMMENDATION
// • Action: ${recommendation.action}
// • Confidence: ${recommendation.confidence}%
// • Position Size: ${recommendation.positionSize}
// • Entry Strategy: ${recommendation.entryStrategy}

// ⚠️ CRITICAL ALERTS
// ${recommendation.alerts.length > 0 ? recommendation.alerts.map((alert: string) => `• ${alert}`).join('\n') : '• No critical alerts'}

// 💡 STRATEGIC NOTES
// • Analysis based on current market data
// • Consider market conditions before entry
// • Always use proper risk management

// 🕐 TIMING RECOMMENDATIONS
// • Best Entry Window: Current market conditions
// • Stop Loss: ${recommendation.stopLoss}
// • Take Profit Targets: ${recommendation.takeProfitTargets.join(', ')}
//   `;
// }

// // Main workflow definition
// const defiSniperWorkflow = createWorkflow({
//   id: "defi-sniper-workflow",
//   inputSchema: z.object({
//     tokenAddress: z.string().describe("Token address or pair address to analyze"),
//     riskTolerance: z.enum(["Low", "Medium", "High", "Extreme"]).default("Medium"),
//     minLiquidity: z.number().default(10000),
//     minVolume: z.number().default(1000),
//     maxPositionSize: z.number().default(1000),
//   }),
//   outputSchema: z.object({
//     analysis: z.string(),
//     recommendation: sniperRecommendationSchema,
//   }),
// })
//   .then(fetchTokenInfo)
//   .then(assessRugRisk)
//   .then(generateSniperAnalysis);

// // Commit the workflow
// defiSniperWorkflow.commit();

// // Export the workflow
// export { defiSniperWorkflow };

// // Example usage function
// export const runSniperAnalysis = async (tokenAddress: string, options?: {
//   riskTolerance?: "Low" | "Medium" | "High" | "Extreme";
//   minLiquidity?: number;
//   minVolume?: number;
//   maxPositionSize?: number;
// }) => {
//   try {
//     console.log(`🚀 Starting DeFi Sniper Analysis for: ${tokenAddress}`);
    
//     const result = await defiSniperWorkflow.execute({
//       tokenAddress,
//       riskTolerance: options?.riskTolerance || "Medium",
//       minLiquidity: options?.minLiquidity || 10000,
//       minVolume: options?.minVolume || 1000,
//       maxPositionSize: options?.maxPositionSize || 1000,
//     });

//     console.log("\n" + "=".repeat(80));
//     console.log("🎯 ANALYSIS COMPLETE");
//     console.log("=".repeat(80));
//     console.log(result.analysis);
//     console.log("=".repeat(80));

//     return result;
//   } catch (error) {
//     console.error(`❌ Sniper analysis failed: ${error}`);
//     throw error;
//   }
// };

// // Test function with sample addresses
// export const testSniperWorkflow = async () => {
//   const testAddresses = [
//     "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
//     "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // WETH/USDC Pair
//   ];

//   for (const address of testAddresses) {
//     try {
//       console.log(`\n🧪 Testing with address: ${address}`);
//       await runSniperAnalysis(address, {
//         riskTolerance: "Medium",
//         minLiquidity: 10000,
//         minVolume: 1000,
//         maxPositionSize: 1000,
//       });
//     } catch (error) {
//       console.error(`❌ Test failed for ${address}:`, error);
//     }
//   }
// };