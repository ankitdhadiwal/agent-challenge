import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";

import { defiWorkflow } from "./agents/defiSniperAgent/defiWorkflow";
import { defiSniperAgent } from "./agents/defiSniperAgent/defiagent";

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


