import { NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new Response('URL parameter is missing', { status: 400 });
    }

    // Validate that we are only proxying images from Qobuz
    const allowedHostname = 'static.qobuz.com';
    try {
        const url = new URL(imageUrl);
        if (url.hostname !== allowedHostname) {
            return new Response('Hostname not allowed', { status: 403 });
        }
    } catch (e) {
        return new Response('Invalid URL format', { status: 400 });
    }

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer', // Fetch as raw binary data
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        
        // Stream the image back to the client with the correct content type
        return new Response(response.data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // Add caching headers to improve performance
                'Cache-Control': 'public, max-age=604800, immutable', // Cache for 1 week
            },
        });

    } catch (error) {
        console.error('Error proxying image:', error);
        return new Response('Failed to fetch image', { status: 500 });
    }
}