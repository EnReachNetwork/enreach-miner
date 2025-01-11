import WebTorrent from "webtorrent";
import fs from "fs/promises";
import path from "path";
import {ENV} from "./config/env.js";

interface TorrentState {
    infoHash: string;
    uploadedBytes: number;
    downloadedBytes: number;
    peers: Map<string, {
        uploadedBytes: number;
        downloadedBytes: number;
    }>;
}

interface ReportData {
    peer_id: string;
    startTime: number;
    endTime: number;
    upload_volume: number;
    download_volume: number;
    peer_details: {
        peer_id: string;
        upload_volume: number;
        download_volume: number;
        torrent_details: {
            torrent_hash: string;
            upload_volume: number;
            download_volume: number;
        }[];
    }[];
}

class TorrentManager {
    private client: WebTorrent.Instance;
    private torrents: Map<string, TorrentState>;
    private stateFile: string;

    constructor(client: WebTorrent.Instance, stateDir: string = '.') {
        this.client = client;
        this.torrents = new Map();
        this.stateFile = path.join(stateDir, 'torrent-state.json');
    }

    async addTorrent(infoHash: string) {
        if (this.torrents.has(infoHash)) {
            return;
        }

        this.torrents.set(infoHash, {
            infoHash,
            uploadedBytes: 0,
            downloadedBytes: 0,
            peers: new Map()
        });

        try {
            const torrent = this.client.add(infoHash, {
                announce: [ENV.TRACKER_URL]
            });

            torrent.on('wire', (wire) => {
                const remotePeerId = wire.peerId.toString();
                const torrentData = this.torrents.get(infoHash)!;

                if (!torrentData.peers.has(remotePeerId)) {
                    torrentData.peers.set(remotePeerId, {
                        uploadedBytes: 0,
                        downloadedBytes: 0
                    });
                }

                wire.on('upload', (bytes) => {
                    const peerData = torrentData.peers.get(remotePeerId)!;
                    peerData.uploadedBytes += bytes;
                    torrentData.uploadedBytes += bytes;
                });

                wire.on('download', (bytes) => {
                    const peerData = torrentData.peers.get(remotePeerId)!;
                    peerData.downloadedBytes += bytes;
                    torrentData.downloadedBytes += bytes;
                });
            });

            console.log(`Started seeding: ${infoHash}`);
        } catch (error) {
            console.error(`Failed to add torrent ${infoHash}:`, error);
            this.torrents.delete(infoHash);
        }
    }

    async removeTorrent(infoHash: string) {
        const torrent = this.client.get(infoHash);
        if (torrent) {
            torrent.destroy();
        }
        this.torrents.delete(infoHash);
        await this.saveState();
    }

    async saveState() {
        try {
            const state = Array.from(this.torrents.entries()).map(([infoHash, data]) => ({
                infoHash,
                uploadedBytes: data.uploadedBytes,
                downloadedBytes: data.downloadedBytes,
                peers: Array.from(data.peers.entries())
            }));

            await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
            console.log('State saved successfully');
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    async loadState() {
        try {
            const data = await fs.readFile(this.stateFile, 'utf8');
            const state = JSON.parse(data);

            for (const item of state) {
                const peers = new Map<string, {
                    uploadedBytes: number;
                    downloadedBytes: number;
                }>(item.peers);
                this.torrents.set(item.infoHash, {
                    infoHash: item.infoHash,
                    uploadedBytes: item.uploadedBytes,
                    downloadedBytes: item.downloadedBytes,
                    peers
                });

                await this.addTorrent(item.infoHash);
            }

            console.log('State loaded successfully');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log('No previous state found');
            } else {
                console.error('Failed to load state:', error);
            }
        }
    }

    generateReport(startTime: number = Date.now() - 60000): ReportData {
        const report: ReportData = {
            peer_id: ENV.CLIENT_ID,
            startTime,
            endTime: Date.now(),
            upload_volume: 0,
            download_volume: 0,
            peer_details: []
        };

        const peerMap = new Map<string, {
            upload_volume: number;
            download_volume: number;
            torrent_details: Map<string, { upload_volume: number; download_volume: number; }>;
        }>();

        for (const torrentData of this.torrents.values()) {
            report.upload_volume += torrentData.uploadedBytes;
            report.download_volume += torrentData.downloadedBytes;

            for (const [peerId, peerData] of torrentData.peers.entries()) {
                if (!peerMap.has(peerId)) {
                    peerMap.set(peerId, {
                        upload_volume: 0,
                        download_volume: 0,
                        torrent_details: new Map()
                    });
                }

                const peerTotal = peerMap.get(peerId)!;
                peerTotal.upload_volume += peerData.uploadedBytes;
                peerTotal.download_volume += peerData.downloadedBytes;
                peerTotal.torrent_details.set(torrentData.infoHash, {
                    upload_volume: peerData.uploadedBytes,
                    download_volume: peerData.downloadedBytes
                });
            }
        }

        // 构造报告格式
        for (const [peerId, peerTotal] of peerMap.entries()) {
            report.peer_details.push({
                peer_id: peerId,
                upload_volume: peerTotal.upload_volume,
                download_volume: peerTotal.download_volume,
                torrent_details: Array.from(peerTotal.torrent_details.entries()).map(([hash, stats]) => ({
                    torrent_hash: hash,
                    upload_volume: stats.upload_volume,
                    download_volume: stats.download_volume
                }))
            });
        }

        return report;
    }

    // 获取所有正在做种的 torrent
    getTorrents() {
        return Array.from(this.torrents.keys());
    }

    // 获取指定种子的统计信息
    getTorrentStats(infoHash: string) {
        return this.torrents.get(infoHash);
    }
}

export default TorrentManager;
