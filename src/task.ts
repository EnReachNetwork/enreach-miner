import { logger } from "./utils/logger.js";
import WebTorrent from "webtorrent";
import * as fs from "fs";
import {ENV} from "./config/env.js";
import TorrentManager from "./torrent-manager.js";

const directory = "data";
// const trackerUrl = "ws://localhost:30000";
const TRACKER_API = "http://localhost:6767";

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

async function fetchAvailableTasks() {
  try {
    const response = await fetch(`${TRACKER_API}/tasks/available?clientId=${ENV.CLIENT_ID}`);
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return await response.json();
  } catch (error) {
    logger.error(`Fetch tasks error: ${error}`);
    return [];
  }
}

async function processTasks(manager: TorrentManager) {
  try {
    const tasks = await fetchAvailableTasks();
    logger.info(`Found ${tasks.length} available tasks`);

    for (const task of tasks) {
      const { magnetURI, infoHash } = task.torrent;

      manager.addTorrent(infoHash)
    }
  } catch (error) {
    logger.error(`Process tasks error: ${error}`);
  }
}

export const startTaskProcessor = async (manager: TorrentManager) => {
  async function loop() {
    try {
      await processTasks(manager);
    } catch (error) {
      logger.error(`Loop error: ${error}`);
    }
    setTimeout(loop, 10000);
  }

  logger.info("Task processor started, checking tasks every 10 seconds");
  await loop();
};
