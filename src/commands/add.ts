import { Command } from "commander";
import WebTorrent from "webtorrent";
import fs from "fs";
import {ENV} from "../config/env.js";

const peerId = Buffer.from("20749eb0b13a89c65d89867401471a76f6c90001", 'hex');
const client = new WebTorrent({ peerId });

export function registerAddCommand(program: Command) {
  program
    .command("add")
    .description("Register miner to enreach chain")
    .option("-n, --name <name>", "name to say hello to")
    .action(async (options) => {
      console.log("Client add");
      client.add(
        "magnet:?xt=urn:btih:d79e2eff12625bc9f93efee1df0b6a1f036572dc&dn=1735975761662-example.com&tr=ws%3A%2F%2Flocalhost%3A8888",
        (torrent) => {
          console.log("Client is downloading:", torrent.infoHash);

          torrent.on("done", () => {
            console.log("Download complete");
            console.log("File saved to:", torrent.path);
          });

          // Log download progress
          torrent.on("download", (bytes) => {
            // console.log("Progress:", torrent.progress);
          });
        },
      );
    });
}
