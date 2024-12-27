import { config } from "dotenv";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "../utils/logger.js";

const envPath = join(process.cwd(), ".env");

if (!existsSync(envPath)) {
  logger.error("No .env file found");
} else {
  config();
}

export const ENV = {
  MNEMONIC: process.env.MNEMONIC || "",
  MANAGER_URL: process.env.MANAGER_URL || "ws://localhost",
  MANAGER_PORT: parseInt(process.env.MANAGER_PORT || "6677", 10),
  HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL || "5000", 10),
};
