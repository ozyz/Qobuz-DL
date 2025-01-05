import { formatArtists, formatTitle, getAlbum, getFullResImage, QobuzTrack } from "./qobuz-dl";
import axios from "axios";
import { SettingsProps } from "./settings-provider";
import { StatusBarProps } from "@/components/status-bar/status-bar";

declare const FFmpeg: { createFFmpeg: any, fetchFile: any };

export type FFmpegType = {
    FS: (action: string, filename: string, fileData?: Uint8Array) => Promise<any>;
    run: (...args: string[]) => Promise<any>;
    isLoaded: () => boolean;
    load: ({ signal }: { signal: AbortSignal }) => Promise<any>;
}

export const codecMap = {
    FLAC: {
        extension: "flac",
        codec: "flac"
    },
    WAV: {
        extension: "wav",
        codec: "pcm_s16le"
    },
    ALAC: {
        extension: "m4a",
        codec: "alac"
    },
    MP3: {
        extension: "mp3",
        codec: "libmp3lame"
    },
    AAC: {
        extension: "m4a",
        codec: "aac"
    },
    OPUS: {
        extension: "ogg",
        codec: "libopus"
    }
}

export async function applyMetadata(trackBuffer: ArrayBuffer, resultData: QobuzTrack, ffmpeg: FFmpegType, settings: SettingsProps, setStatusBar?: React.Dispatch<React.SetStateAction<StatusBarProps>>, albumArt?: ArrayBuffer, upc?: string) {
    const skipRencode = (settings.outputQuality != "5" && settings.outputCodec === "FLAC") || (settings.outputQuality === "5" && settings.outputCodec === "MP3" && settings.bitrate === 320);
    if (skipRencode && !settings.applyMetadata) return trackBuffer;
    const extension = codecMap[settings.outputCodec].extension;
    if (!skipRencode) {
        const inputExtension = settings.outputQuality === "5" ? "mp3" : "flac";
        if (setStatusBar) setStatusBar(prev => {
            if (prev.processing) {
                return { ...prev, description: "Re-encoding track..." }
            } else return prev;
        })
        await ffmpeg.FS("writeFile", "input." + inputExtension, new Uint8Array(trackBuffer));
        await ffmpeg.run("-i", "input." + inputExtension, "-c:a", codecMap[settings.outputCodec].codec, settings.bitrate ? "-b:a" : "", settings.bitrate ? settings.bitrate + "k" : "", "output." + extension);
        trackBuffer = await ffmpeg.FS("readFile", "output." + extension);
        await ffmpeg.FS("unlink", "input." + inputExtension);
        await ffmpeg.FS("unlink", "output." + extension);
    }
    if (!settings.applyMetadata) return trackBuffer;
    if (settings.outputCodec === "WAV") return trackBuffer;
    if (setStatusBar) setStatusBar(prev => ({ ...prev, description: "Applying metadata..." }))
    const artists = resultData.album.artists === undefined ? [resultData.performer] : resultData.album.artists;
    let metadata = `;FFMETADATA1`
    metadata += `\ntitle=${formatTitle(resultData)}`;
    if (artists.length > 0) {
        metadata += `\nartist=${formatArtists(resultData)}`;
        metadata += `\nalbum_artist=${formatArtists(resultData)}`
    } else {
        metadata += `\nartist=Various Artists`;
        metadata += `\nalbum_artist=Various Artists`;
    }
    metadata += `\nalbum_artist=${artists[0]?.name || resultData.performer?.name || "Various Artists"}`
    metadata += `\nalbum=${formatTitle(resultData.album)}`
    metadata += `\ngenre=${resultData.album.genre.name}`
    metadata += `\ndate=${resultData.album.release_date_original}`
    metadata += `\nyear=${new Date(resultData.album.release_date_original).getFullYear()}`
    metadata += `\nlabel=${getAlbum(resultData).label.name}`
    metadata += `\ncopyright=${resultData.copyright}`
    if (resultData.isrc) metadata += `\nisrc=${resultData.isrc}`;
    if (upc) metadata += `\nbarcode=${upc}`;
    if (resultData.track_number) metadata += `\ntrack=${resultData.track_number}`;
    await ffmpeg.FS("writeFile", "input." + extension, new Uint8Array(trackBuffer));
    const encoder = new TextEncoder();
    await ffmpeg.FS("writeFile", "metadata.txt", encoder.encode(metadata));
    await ffmpeg.FS("writeFile", "albumArt.jpg", new Uint8Array(albumArt ? albumArt : (await axios.get(await getFullResImage(resultData), { responseType: 'arraybuffer' })).data));
    
    await ffmpeg.run(
        "-i", "input." + extension,
        "-i", "metadata.txt",
        "-map_metadata", "1",
        "-codec", "copy",
        "secondInput." + extension
    );
    if (["WAV", "OPUS"].includes(settings.outputCodec)) {
        const output = await ffmpeg.FS("readFile", "secondInput." + extension);
        ffmpeg.FS("unlink", "input." + extension);
        ffmpeg.FS("unlink", "metadata.txt");
        ffmpeg.FS("unlink", "secondInput." + extension);
        return output;
    };
    await ffmpeg.run(
        '-i', 'secondInput.' + extension,
        '-i', 'albumArt.jpg',
        '-c', 'copy',
        '-map', '0',
        '-map', '1',
        '-disposition:v:0', 'attached_pic',
        'output.' + extension
    );
    const output = await ffmpeg.FS("readFile", "output." + extension);
    ffmpeg.FS("unlink", "input." + extension);
    ffmpeg.FS("unlink", "metadata.txt");
    ffmpeg.FS("unlink", "secondInput." + extension);
    ffmpeg.FS("unlink", "albumArt.jpg");
    return output;
}

export function createFFmpeg() {
    if (typeof FFmpeg === 'undefined') return null;
    const { createFFmpeg } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: false });
    return ffmpeg;
}

export async function loadFFmpeg(ffmpeg: FFmpegType, signal: AbortSignal) {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load({ signal });
        return ffmpeg;
    }
}