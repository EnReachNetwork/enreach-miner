import WebTorrent from "webtorrent";
import {logger} from "./utils/logger.js";
import {ENV} from "./config/env.js";

export const startWebTorrentClient = async () => {
    const peerId = Buffer.from(ENV.CLIENT_ID, 'hex');
    const client = new WebTorrent({
        peerId
    });

    logger.success("Started WebTorrent client");

    return client
}
