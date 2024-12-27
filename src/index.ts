#!/usr/bin/env node
import { Command } from "commander";
import { registerHelloCommand } from "./commands/hello.js";
import { registerRegisterCommand } from "./commands/register.js";
import WebSocket from "ws";
import { logger } from "./utils/logger.js";
import { WorkReport } from "./types/work.js";
import { Message } from "./types/ws.js";
import { validateConfig } from "./config/validate.js";
import WebTorrent from "webtorrent";

const program = new Command();

let ws: WebSocket | null = null;
let heartbeatInterval: NodeJS.Timer | null = null;

function uploadWorkReport(peerId: string, interval: number = 20000) {
  if (heartbeatInterval) {
    // @ts-ignore
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const startTime = Math.floor(Date.now() / 1000);
        const wr: WorkReport = {
          peerId,
          start_time: startTime,
          end_time: startTime + 60,
          upload_volume: 1000,
          download_volume: 1000,
          upload_time: 3600,
          download_time: 3600,
        };
        const msg: Message<WorkReport> = {
          type: "upload_work_report",
          message: wr,
        };
        ws.send(JSON.stringify(msg));
        logger.info("Status report sent");
      } catch (error) {
        logger.error(`Failed to send status report: ${error}`);
      }
    }
  }, interval);
}

async function connectToManager(url: string) {
  ws = new WebSocket(url);

  ws.on("open", () => {
    logger.success("Connected to manager");
    uploadWorkReport("enreach159g9gm93y84cawdkpnlaqvyew4gddspalujug7");
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`Received message: ${JSON.stringify(message)}`);
    } catch (error) {
      logger.error(`Failed to parse message: ${error}`);
    }
  });

  ws.on("error", (error) => {
    logger.error(`WebSocket error: ${error}`);
  });

  ws.on("close", () => {
    logger.warning("Disconnected from manager, attempting to reconnect...");
    setTimeout(() => connectToManager(url), 5000);
  });
}

program
  .name("miner")
  .description("CLI application built with Commander.js")
  .version("0.0.1")
  .action(async () => {
    await validateConfig();
    logger.success("Started webtorrent client");
    const client = new WebTorrent();
    await connectToManager("http://localhost:6677");
  });

registerHelloCommand(program);
registerRegisterCommand(program);

program.parse();
