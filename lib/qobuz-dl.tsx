import axios from "axios";
import { LucideIcon } from "lucide-react";

let crypto: any;
let SocksProxyAgent: any;
if (typeof window === "undefined") {
    crypto = require('node:crypto');
    SocksProxyAgent = require('socks-proxy-agent')['SocksProxyAgent'];
}

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

/**
 * Determines the best Qobuz format ID based on the track's metadata.
 * @param track The Qobuz track object.
 * @returns The format ID string for the highest available quality.
 */
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

    // Fallback for any other case (e.g., MP3 only)
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


export function getRandomToken() {
    const tokens = JSON.parse(process.env.QOBUZ_AUTH_TOKENS!);
    if (!tokens || tokens.length === 0) {
        throw new Error("QOBUZ_AUTH_TOKENS environment variable is empty or not set.");
    }
    return tokens[Math.floor(Math.random() * tokens.length)] as string;
}

export async function search(query: string, limit: number = 10, offset: number = 0) {
    testForRequirements();
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
    const url = new URL(process.env.QOBUZ_API_BASE + "catalog/search")
    url.searchParams.append("query", id || query)
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("offset", offset.toString());
    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }
    const response = await axios.get(url.toString(), {
        headers: {
            "x-app-id": process.env.QOBUZ_APP_ID!,
            "x-user-auth-token": getRandomToken(),
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent
    });
    return {
        ...response.data,
        switchTo
    } as QobuzSearchResults;
}

export async function getDownloadURL(trackID: number, quality: string) {
    testForRequirements();
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const r_sig = `trackgetFileUrlformat_id${quality}intentstreamtrack_id${trackID}${timestamp}${process.env.QOBUZ_SECRET}`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');
    const url = new URL(process.env.QOBUZ_API_BASE + 'track/getFileUrl');
    url.searchParams.append("format_id", quality);
    url.searchParams.append("intent", "stream");
    url.searchParams.append("track_id", trackID.toString());
    url.searchParams.append("request_ts", timestamp.toString());
    url.searchParams.append("request_sig", r_sig_hashed);
    const headers = new Headers();
    headers.append('X-App-Id', process.env.QOBUZ_APP_ID!);
    headers.append("X-User-Auth-Token", getRandomToken());
    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }
    const response = await axios.get(url.toString(), {
        headers: {
            "x-app-id": process.env.QOBUZ_APP_ID!,
            "x-user-auth-token": getRandomToken(),
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent
    })
    return response.data.url;
}

export async function getAlbumInfo(album_id: string) {
    testForRequirements();
    const url = new URL(process.env.QOBUZ_API_BASE + 'album/get');
    url.searchParams.append("album_id", album_id);
    url.searchParams.append("extra", "track_ids");
    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }
    const response = await axios.get(url.toString(), {
        headers: {
            "x-app-id": process.env.QOBUZ_APP_ID!,
            "x-user-auth-token": getRandomToken(),
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent
    })
    return response.data;
}

export async function getArtistReleases(artist_id: string, release_type: string = "album", limit: number = 10, offset: number = 0, track_size: number = 1000) {
    testForRequirements();
    const url = new URL(process.env.QOBUZ_API_BASE + 'artist/getReleasesList');
    url.searchParams.append("artist_id", artist_id);
    url.searchParams.append("release_type", release_type);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("offset", offset.toString());
    url.searchParams.append("track_size", track_size.toString());
    url.searchParams.append("sort", "release_date");
    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }
    const response = await axios.get(url.toString(), {
        headers: {
            "x-app-id": process.env.QOBUZ_APP_ID!,
            "x-user-auth-token": getRandomToken(),
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent
    })
    return response.data;
}

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
    testForRequirements();
    const url = new URL(process.env.QOBUZ_API_BASE + "/artist/page");
    let proxyAgent = undefined;
    if (process.env.SOCKS5_PROXY) {
        proxyAgent = new SocksProxyAgent("socks5://" + process.env.SOCKS5_PROXY);
    }
    return (await axios.get(url.toString(), {
        params: { artist_id: artistId, sort: "release_date" },
        headers: {
            "x-app-id": process.env.QOBUZ_APP_ID!,
            "x-user-auth-token": getRandomToken(),
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent
    })).data;
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