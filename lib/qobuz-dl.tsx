import axios from "axios";
import { LucideIcon } from "lucide-react";
import { getValidToken, invalidateToken } from "./server/token-manager";

let crypto: any;
let SocksProxyAgent: any;
if (typeof window === "undefined") {
    crypto = require('node:crypto');
    SocksProxyAgent = require('socks-proxy-agent')['SocksProxyAgent'];
}

// ... (All type definitions remain the same) ...
export type QobuzGenre = {
    path: number[],
    color: string,
    name: string,
    id: number
}

export type QobuzLabel = {
    name: string,
    id: number,
    albums_count: number
}

export type QobuzArtist = {
    image: {
        small: string,
        medium: string,
        large: string,
        extralarge: string,
        mega: string
    } | null,
    name: string,
    id: number,
    albums_count: number
}

export type QobuzTrack = {
    isrc: string | null,
    copyright: string,
    maximum_bit_depth: number,
    maximum_sampling_rate: number,
    performer: {
        name: string,
        id: number
    },
    composer?: {
        name: string,
        id: number
    }
    album: QobuzAlbum,
    track_number: number,
    released_at: number,
    title: string,
    version: string | null,
    duration: number,
    parental_warning: boolean,
    id: number,
    hires: boolean,
    streamable: boolean,
    media_number: number
}

export type FetchedQobuzAlbum = QobuzAlbum & {
    tracks: {
        offset: number,
        limit: number,
        total: number,
        items: QobuzTrack[]
    }
}

export type QobuzAlbum = {
    maximum_bit_depth: number,
    image: {
        small: string,
        thumbnail: string,
        large: string,
        back: string | null
    },
    artist: QobuzArtist,
    artists: {
        id: number,
        name: string,
        roles: string[]
    }[],
    released_at: number,
    label: QobuzLabel,
    title: string,
    qobuz_id: number,
    version: string | null,
    duration: number,
    parental_warning: boolean,
    tracks_count: number,
    genre: QobuzGenre,
    id: string,
    maximum_sampling_rate: number,
    release_date_original: string,
    hires: boolean,
    upc: string,
    streamable: boolean
}

export type QobuzSearchResults = {
    query: string,
    switchTo: QobuzSearchFilters | null,
    albums: {
        limit: number,
        offset: number,
        total: number,
        items: QobuzAlbum[]
    },
    tracks: {
        limit: number,
        offset: number,
        total: number,
        items: QobuzTrack[]
    },
    artists: {
        limit: number,
        offset: number,
        total: number,
        items: QobuzArtist[]
    }
}

export type QobuzArtistResults = {
    artist: {
        id: string,
        name: {
            display: string,
        },
        artist_category: string,
        biography: {
            content: string,
            source: null,
            language: string
        },
        images: {
            portrait: {
                hash: string,
                format: string
            }
        },
        top_tracks: QobuzTrack[],
        releases: {
            album: {
                has_more: boolean,
                items: QobuzAlbum[]
            },
            live: {
                has_more: boolean,
                items: QobuzAlbum[]
            },
            compilation: {
                has_more: boolean,
                items: QobuzAlbum[]
            },
            epSingle: {
                has_more: boolean,
                items: QobuzAlbum[]
            }
        }
    }
}

export type FilterDataType = {
    label: string,
    value: string,
    searchRoute?: string,
    icon: LucideIcon
}[]

export type QobuzSearchFilters = "albums" | "tracks" | "artists";

export const QOBUZ_ALBUM_URL_REGEX = /https:\/\/(play|open)\.qobuz\.com\/album\/[a-zA-Z0-9]+/;
export const QOBUZ_TRACK_URL_REGEX = /https:\/\/(play|open)\.qobuz\.com\/track\/\d+/;
export const QOBUZ_ARTIST_URL_REGEX = /https:\/\/(play|open)\.qobuz\.com\/artist\/\d+/;

// ... (keep getBestFormatId, getAlbum, formatTitle, etc. as they are) ...
export function getBestFormatId(track: QobuzTrack | QobuzAlbum): string {
    const { maximum_bit_depth, maximum_sampling_rate } = track;

    if (maximum_bit_depth === 24) {
        if (maximum_sampling_rate > 96) {
            return "27"; // 24-bit / >96kHz (e.g., 192kHz)
        }
        return "7"; // 24-bit / <=96kHz
    }
    if (maximum_bit_depth === 16) {
        return "6"; // 16-bit / 44.1kHz (CD Quality)
    }
    return "5";
}


export function getAlbum(input: QobuzAlbum | QobuzTrack | QobuzArtist) {
    return ((input as QobuzAlbum).image ? input : (input as QobuzTrack).album) as QobuzAlbum;
}

export function formatTitle(input: QobuzAlbum | QobuzTrack | QobuzArtist) {
    if (!input) return "Unknown";
    return `${(input as QobuzAlbum | QobuzTrack).title ?? (input as QobuzArtist).name}${(input as QobuzAlbum | QobuzTrack).version ? " (" + (input as QobuzAlbum | QobuzTrack).version + ")" : ""}`.trim();
}

export function getFullResImageUrl(input: QobuzAlbum | QobuzTrack) {
    return getAlbum(input).image.large.substring(0, (getAlbum(input)).image.large.length - 7) + "org.jpg";
}

export function formatArtists(input: QobuzAlbum | QobuzTrack, separator: string = ", ") {
    const album = getAlbum(input) as QobuzAlbum;
    if (album?.artists && album.artists.length > 0) {
        return album.artists.map((artist) => artist.name).join(separator);
    }
    const track = input as QobuzTrack;
    if (track?.performer?.name) {
        return track.performer.name;
    }
    return "Various Artists";
}

/**
 * A simpler request helper that just adds the token.
 * Error handling and retries are now handled by the specific functions.
 */
async function makeQobuzRequest(url: string, params?: Record<string, string>) {
    testForRequirements();
    const token = await getValidToken();

    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }

    const response = await axios.get(url, {
        params,
        headers: { "x-app-id": process.env.QOBUZ_APP_ID!, "x-user-auth-token": token },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
    });
    return response.data;
}


export async function getDownloadURL(trackID: number, quality: string): Promise<string> {
    
    const fetchUrl = async () => {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        const r_sig = `trackgetFileUrlformat_id${quality}intentstreamtrack_id${trackID}${timestamp}${process.env.QOBUZ_SECRET}`;
        const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');
        const url = new URL(process.env.QOBUZ_API_BASE + 'track/getFileUrl');
        
        const params = {
            format_id: quality,
            intent: "stream",
            track_id: trackID.toString(),
            request_ts: timestamp.toString(),
            request_sig: r_sig_hashed
        };
        
        return makeQobuzRequest(url.toString(), params);
    };

    try {
        let downloadData = await fetchUrl();

        // **CRITICAL CHECK**: If we get a 30s preview, the token is unsubscribed.
        if (downloadData.streaming_duration && downloadData.streaming_duration === 30) {
            console.warn("Received a 30-second preview URL. The current token is likely unsubscribed. Invalidating and retrying...");
            invalidateToken(); // Invalidate the bad token
            downloadData = await fetchUrl(); // Retry the call. This will force `getValidToken` to find a new one.

            // If it's *still* a preview after retrying, then no good tokens are left.
            if (downloadData.streaming_duration && downloadData.streaming_duration === 30) {
                throw new Error("Failed to get full track URL. All available tokens seem to be unsubscribed or invalid.");
            }
        }

        return downloadData.url;

    } catch (error) {
        // Handle cases where the token is completely invalid (e.g., 401 error)
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            console.warn("Received an authentication error. The current token is invalid. Invalidating and retrying...");
            invalidateToken();
            const downloadData = await fetchUrl(); // Retry once

            if (downloadData.streaming_duration && downloadData.streaming_duration === 30) {
                throw new Error("Failed to get full track URL on retry. All available tokens seem to be unsubscribed or invalid.");
            }
            return downloadData.url;
        }
        // Re-throw other errors
        throw error;
    }
}


// Functions like search, getAlbumInfo, etc. do not need modification as they don't depend on subscription status.
// We can use the simpler makeQobuzRequest for them.

export async function search(query: string, limit: number = 10, offset: number = 0) {
    let id: string | null = null;
    let switchTo: string | null = null;
    if (query.trim().match(QOBUZ_ALBUM_URL_REGEX)) {
        id = query.trim().match(QOBUZ_ALBUM_URL_REGEX)![0].replace("https://open", "").replace("https://play", "").replace(".qobuz.com/album/", "");
        switchTo = "albums";
    } else if (query.trim().match(QOBUZ_TRACK_URL_REGEX)) {
        id = query.trim().match(QOBUZ_TRACK_URL_REGEX)![0].replace("https://open", "").replace("https://play", "").replace(".qobuz.com/track/", "");
        switchTo = "tracks";
    } else if (query.trim().match(QOBUZ_ARTIST_URL_REGEX)) {
        id = query.trim().match(QOBUZ_ARTIST_URL_REGEX)![0].replace("https://open", "").replace("https://play", "").replace(".qobuz.com/artist/", "");
        switchTo = "artists";
    }

    const url = new URL(process.env.QOBUZ_API_BASE + "catalog/search");
    const params = { query: id || query, limit: limit.toString(), offset: offset.toString() };
    const data = await makeQobuzRequest(url.toString(), params);
    return { ...data, switchTo } as QobuzSearchResults;
}

export async function getAlbumInfo(album_id: string) {
    const url = new URL(process.env.QOBUZ_API_BASE + 'album/get');
    const params = { album_id, extra: "track_ids" };
    return await makeQobuzRequest(url.toString(), params);
}

export async function getArtistReleases(artist_id: string, release_type: string = "album", limit: number = 10, offset: number = 0, track_size: number = 1000) {
    const url = new URL(process.env.QOBUZ_API_BASE + 'artist/getReleasesList');
    const params = { artist_id, release_type, limit: limit.toString(), offset: offset.toString(), track_size: track_size.toString(), sort: "release_date" };
    return await makeQobuzRequest(url.toString(), params);
}

// ... (keep all remaining functions: formatDuration, testForRequirements, etc.)
export function formatDuration(seconds: number) {
    if (!seconds) return "0m";
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const remainingSeconds = Math.round(seconds % 60);

    return `${hours > 0 ? hours + "h " : ""} ${remainingMinutes > 0 ? remainingMinutes + "m " : ""} ${remainingSeconds > 0 && hours <= 0 ? remainingSeconds + "s" : ""}`.trim();
}

export function testForRequirements() {
    if (!process.env.QOBUZ_APP_ID) throw new Error("Deployment is missing QOBUZ_APP_ID environment variable.");
    if (!process.env.QOBUZ_AUTH_TOKENS) throw new Error("Deployment is missing QOBUZ_AUTH_TOKENS environment variable.");
    if (!process.env.QOBUZ_SECRET) throw new Error("Deployment is missing QOBUZ_SECRET environment variable.");
    if (!process.env.QOBUZ_API_BASE) throw new Error("Deployment is missing QOBUZ_API_BASE environment variable.");
    return true;
}

export async function getFullAlbumInfo(fetchedAlbumData: FetchedQobuzAlbum | null, setFetchedAlbumData: React.Dispatch<React.SetStateAction<FetchedQobuzAlbum | null>>, result: QobuzAlbum) {
    if (fetchedAlbumData && (fetchedAlbumData as FetchedQobuzAlbum).id === (result as QobuzAlbum).id) return fetchedAlbumData;
    if (setFetchedAlbumData) setFetchedAlbumData(null);
    const albumDataResponse = await axios.get("/api/get-album", { params: { album_id: (result as QobuzAlbum).id } });
    if (setFetchedAlbumData) setFetchedAlbumData(albumDataResponse.data.data);
    return albumDataResponse.data.data;
}

export function getType(input: QobuzAlbum | QobuzTrack | QobuzArtist): QobuzSearchFilters {
    if ("albums_count" in input) return "artists";
    if ("album" in input) return "tracks";
    return "albums";
}

export async function getArtist(artistId: string): Promise<QobuzArtist | null> {
    const url = new URL(process.env.QOBUZ_API_BASE + "/artist/page");
    const params = { artist_id: artistId, sort: "release_date" };
    return await makeQobuzRequest(url.toString(), params);
}

export function parseArtistAlbumData(album: QobuzAlbum) {
    album.maximum_sampling_rate = (album as any).audio_info.maximum_sampling_rate;
    album.maximum_bit_depth = (album as any).audio_info.maximum_bit_depth;
    album.streamable = (album as any).rights.streamable;
    album.released_at = new Date((album as any).dates.stream).getTime() / 1000;
    album.release_date_original = (album as any).dates.original;
    return album;
}

export function parseArtistData(artistData: QobuzArtistResults) {
    if (typeof (artistData.artist.releases as any).length === 'undefined') return artistData;
    (artistData.artist.releases as any).forEach((release: any) => release.items.forEach((album: any, index: number) => {
        release.items[index] = parseArtistAlbumData(album);
    }));
    const newReleases = {} as any;
    for (const type of ["album", "live", "compilation", "epSingle"]) {
        const foundRelease = (artistData.artist.releases as any).find((release: any) => release.type === type);
        if (foundRelease) {
            newReleases[type] = {
                has_more: foundRelease.has_more,
                items: foundRelease.items
            };
        }
    }
    artistData.artist.releases = newReleases;
    return artistData;
}