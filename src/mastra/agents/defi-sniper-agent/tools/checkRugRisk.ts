import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Basic rug-risk logic
const checkRisk = ({
  liquidityUsd,
  buys,
  sells,
  volume24h,
}: {
  liquidityUsd: number;
  buys: number;
  sells: number;
  volume24h: number;
}) => {
  let risk = 0;
  if (liquidityUsd < 5000) risk++;
  if (sells > buys * 2) risk++;
  if (volume24h < 1000) risk++;

  if (risk === 0) return "🟢 Low rug risk – metrics look solid.";
  if (risk === 1) return "🟡 Medium rug risk – keep an eye.";
  return "🔴 High rug risk – proceed with caution!";
};

export const checkRugRiskTool = createTool({
  id: "checkRugRiskTool",
  description: "Assesses rugpull risk using liquidity, txns, and volume.",
  inputSchema: z.object({
    liquidityUsd: z.number().describe("Total USD liquidity"),
    buys: z.number().describe("Number of buys in 24h"),
    sells: z.number().describe("Number of sells in 24h"),
    volume24h: z.number().describe("24h trading volume in USD"),
  }),
  outputSchema: z.object({
    verdict: z.string(),
  }),
  execute: async ({ context }) => {
    const verdict = checkRisk(context);
    return { verdict };
  },
});
