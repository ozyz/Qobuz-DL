import { NextResponse } from "next/server";
import { getQueueStatus } from "@/lib/server/queue";

export const dynamic = 'force-dynamic';

export async function GET() {
    const status = getQueueStatus();
    return NextResponse.json(status);
}