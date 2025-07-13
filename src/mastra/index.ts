import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { defiWorkflow } from "./agents/defi-sniper-agent/defiWorkflow";
import { defiSniperAgent } from "./agents/defi-sniper-agent/defi-agent";

export const mastra = new Mastra({
	workflows: { defiWorkflow }, 
	agents: { defiSniperAgent },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
