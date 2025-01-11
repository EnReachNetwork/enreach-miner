import WebSocket from "ws";
import { WorkReport } from "./types/work.js";
import { Message } from "./types/ws.js";
import { logger } from "./utils/logger.js";

let heartbeatInterval: NodeJS.Timer | null = null;

export function uploadWorkReport(
  ws: WebSocket,
  peerId: string,
  interval: number = 20000,
) {
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
