import { addJobToQueue } from "@/lib/server/queue";
import { getType, QobuzAlbum, QobuzArtist, QobuzTrack } from "@/lib/qobuz-dl";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const downloadRequestSchema = z.object({
    item: z.any()
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { item } = downloadRequestSchema.parse(body);
        const itemType = getType(item as QobuzAlbum | QobuzTrack | QobuzArtist);

        if (itemType === 'artists') {
            return NextResponse.json({ success: false, message: "Cannot download an artist directly. Please download their albums individually." }, { status: 400 });
        }

        addJobToQueue(item);

        return NextResponse.json({ success: true, message: `Queued '${item.title}' for download.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error?.errors || error.message || "An error occurred." }, { status: 400 });
    }
}