import { formatArtists, formatTitle, getAlbum, QobuzTrack, getBestFormatId } from "./qobuz-dl";
import { runFFmpeg } from "./server/ffmpeg";
import { cleanFileName } from "./utils";
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import axios from 'axios';

export async function processAndSaveTrack(track: QobuzTrack, albumData: any) {
    // Import the function directly for server-side use, avoiding an unnecessary API loop.
    const { getDownloadURL } = await import('@/lib/qobuz-dl');
    
    // Determine the best format ID to request based on the track's actual metadata
    const formatId = getBestFormatId(track);
    console.log(`Requesting format_id '${formatId}' for track '${track.title}'`);

    const downloadUrl = await getDownloadURL(track.id, formatId);

    if (!downloadUrl) {
        console.error(`Could not get download URL for track ID ${track.id}`);
        return;
    }

    const trackBufferResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const trackBuffer = Buffer.from(trackBufferResponse.data);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qobuzdl-'));

    try {
        // Always use .flac extension for the temp file. FFmpeg will auto-detect the true format.
        // This avoids issues with mislabeling CD-quality FLAC as MP3.
        const inputPath = path.join(tempDir, `input.flac`);
        await fs.writeFile(inputPath, trackBuffer);

        let albumArtPath: string | undefined = undefined;
        if (albumData.image?.large) {
            const albumArtUrl = albumData.image.large.replace(/_\d+\.jpg$/, '_org.jpg');
            try {
                const albumArtBuffer = (await axios.get(albumArtUrl, { responseType: 'arraybuffer' })).data;
                albumArtPath = path.join(tempDir, 'cover.jpg');
                await fs.writeFile(albumArtPath, albumArtBuffer);
            } catch (err) {
                console.warn(`Could not fetch album art from ${albumArtUrl}`);
            }
        }

        const albumArtist = formatArtists(albumData, '; ');
        const albumTitle = formatTitle(albumData);
        const albumDir = cleanFileName(`${albumArtist} - ${albumTitle} [${new Date(albumData.release_date_original).getFullYear()}]`);
        const finalDir = path.join(process.env.DOWNLOAD_PATH || './downloads', albumDir);
        await fs.mkdir(finalDir, { recursive: true });

        // Check if cover art already exists before copying
        const finalAlbumArtPath = path.join(finalDir, 'cover.jpg');
        const coverExists = await fs.access(finalAlbumArtPath).then(() => true).catch(() => false);
        if (albumArtPath && !coverExists) {
            await fs.copyFile(albumArtPath, finalAlbumArtPath);
        }

        const trackNumber = String(track.track_number).padStart(2, '0');
        const trackTitle = formatTitle(track);
        const trackFilename = cleanFileName(`${trackNumber}. ${trackTitle}.flac`);
        const outputPath = path.join(finalDir, trackFilename);

        const rawMetadata = {
            title: trackTitle,
            artist: formatArtists(track, '; '),
            album_artist: albumArtist,
            album: albumTitle,
            genre: albumData.genre.name,
            date: albumData.release_date_original,
            track: `${track.track_number}/${albumData.tracks.items.length}`,
            disc: `${track.media_number}/${albumData.media_count || 1}`,
            copyright: track.copyright,
            isrc: track.isrc,
            label: getAlbum(track).label.name,
            upc: albumData.upc
        };

        // Filter out null/undefined values to satisfy the FfmpegMetadata type
        const metadata = Object.fromEntries(
            Object.entries(rawMetadata).filter(([_, v]) => v != null)
        );

        await runFFmpeg(inputPath, outputPath, metadata, albumArtPath);
        console.log(`Successfully downloaded and saved: ${outputPath}`);

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}