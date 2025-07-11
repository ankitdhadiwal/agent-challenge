import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import {getTokenInfoTool} from "./tools/getTokenInfo";
import {checkRugRiskTool} from "./tools/checkRugRisk";


// Define Agent Name
const name = "Defi Sniper Agent";

// Define instructions for the agent
// TODO: Add link here for recommendations on how to properly define instructions for an agent.
// TODO: Remove comments (// ...) from `instructions`
const instructions = `
            You are DeFiSniper, a smart and cautious blockchain assistant.

            You help users monitor token pairs, detect early signs of rug pulls, and provide risk-level assessments based on liquidity, trade patterns, and volume.

            When a user asks about a token:
            - Use getTokenInfoTool to retrieve real-time stats.
            - Then, if needed, use checkRugRiskTool to evaluate potential risks.
            Be clear, direct, and give warnings when risk is high.
`;

export const defiSniperAgent = new Agent({
	name,
	instructions,
	model,
	tools: { 
            getTokenInfoTool,
            checkRugRiskTool,
       },
});
