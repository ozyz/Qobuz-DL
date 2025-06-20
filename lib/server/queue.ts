import { getAlbumInfo, QobuzAlbum, QobuzTrack, formatTitle } from "../qobuz-dl";
import { processAndSaveTrack } from "../ffmpeg-functions";
import { Disc3Icon, DiscAlbumIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

export interface Job {
    id: string;
    item: QobuzAlbum | QobuzTrack;
    type: 'track' | 'album';
    title: string;
    icon: any;
    status: 'queued' | 'processing' | 'done' | 'failed';
    error?: string;
}

// Use a global to ensure a single instance across hot reloads in dev
declare global {
    var _qobuz_dl_queue: Job[]; 
    var _qobuz_dl_currentJob: Job | null; 
    var _qobuz_dl_isProcessing: boolean; 
}

global._qobuz_dl_queue = global._qobuz_dl_queue || [];
global._qobuz_dl_currentJob = global._qobuz_dl_currentJob || null;
global._qobuz_dl_isProcessing = global._qobuz_dl_isProcessing || false;


export function addJobToQueue(item: QobuzAlbum | QobuzTrack) {
    const job: Job = {
        id: uuidv4(),
        item,
        type: (item as QobuzTrack).album ? 'track' : 'album',
        title: formatTitle(item),
        icon: (item as QobuzTrack).album ? Disc3Icon : DiscAlbumIcon,
        status: 'queued',
    };

    // Avoid adding duplicates
    const inQueue = global._qobuz_dl_queue.some(j => j.item.id === item.id);
    const isCurrent = global._qobuz_dl_currentJob?.item.id === item.id;
    if (inQueue || isCurrent) {
        console.log(`Job for '${job.title}' is already in the queue.`);
        return;
    }

    global._qobuz_dl_queue.push(job);
    console.log(`Added '${job.title}' to the download queue.`);
    processQueue();
}

export function getQueueStatus() {
    return {
        currentJob: global._qobuz_dl_currentJob,
        pendingJobs: global._qobuz_dl_queue,
    };
}

async function processQueue() {
    if (global._qobuz_dl_isProcessing || global._qobuz_dl_queue.length === 0) {
        return;
    }

    global._qobuz_dl_isProcessing = true;
    const job = global._qobuz_dl_queue.shift()!;
    global._qobuz_dl_currentJob = job;
    job.status = 'processing';

    console.log(`Processing download for: ${job.title}`);

    try {
        if (job.type === 'track') {
            const track = job.item as QobuzTrack;
            // We need full album info for metadata
            const albumData = await getAlbumInfo(track.album.id);
            await processAndSaveTrack(track, albumData);
        } else if (job.type === 'album') {
            const album = job.item as QobuzAlbum;
            const albumData = await getAlbumInfo(album.id);
            if (!albumData || !albumData.tracks?.items) {
                throw new Error(`Could not retrieve track list for album: ${album.title}`);
            }

            for (const track of albumData.tracks.items) {
                if (track.streamable) {
                    const fullTrackData = { ...track, album: albumData };
                    await processAndSaveTrack(fullTrackData, albumData);
                } else {
                    console.log(`Skipping non-streamable track: ${track.title}`);
                }
            }
        }
        job.status = 'done';
        console.log(`Finished processing: ${job.title}`);
    } catch (error: any) {
        job.status = 'failed';
        job.error = error.message;
        console.error(`Failed to process job for '${job.title}':`, error);
    } finally {
        global._qobuz_dl_currentJob = null;
        global._qobuz_dl_isProcessing = false;
        // Check if there are more jobs to process
        processQueue();
    }
}