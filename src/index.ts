#!/usr/bin/env node
import {Command} from "commander";
import {registerHelloCommand} from "./commands/hello.js";
import {registerRegisterCommand} from "./commands/register.js";
import WebSocket from "ws";
import {logger} from "./utils/logger.js";
import {validateConfig} from "./config/validate.js";
import {registerAddCommand} from "./commands/add.js";
import {uploadWorkReport} from "./work-report.js";
import {startTaskProcessor} from "./task.js";
import {startWebTorrentClient} from "./webtorrent.js";
import TorrentManager from "./torrent-manager.js";

const program = new Command();

let ws: WebSocket | null = null;

async function connectToManager(url: string) {
  ws = new WebSocket(url);

  ws.on("open", () => {
    logger.success("Connected to manager");
    if (ws) {
      uploadWorkReport(ws, "enreach159g9gm93y84cawdkpnlaqvyew4gddspalujug7");
    }
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
    console.log(22222222222222222)
    await validateConfig();
    // await connectToManager("http://localhost:6677");
    const client = await startWebTorrentClient()
    const torrentManager = new TorrentManager(client);
    await startTaskProcessor(torrentManager);

    await torrentManager.loadState();

    setInterval(() => {
      torrentManager.saveState();
    },  60 * 1000);

    setInterval(() => {
      const report = torrentManager.generateReport();
      console.log(report);
    }, 60 * 1000);

    // client.on('torrent', (torrent) => {
    //   logger.info(torrent.infoHash)
    //   torrent.on('wire', (wire, addr) => {
    //     console.log("wire, ", wire.peerId.toString())
    //     wire.on('download', (downloaded) => {
    //       logger.info(`Downloaded: ${downloaded}`)
    //     })
    //     wire.on('upload', (uploaded) => {
    //       logger.info(`Uploaded: ${uploaded}`);
    //     })
    //   })
    // });
  });

registerHelloCommand(program);
registerRegisterCommand(program);
registerAddCommand(program);

program.parse();
