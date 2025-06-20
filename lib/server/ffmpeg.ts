import { spawn } from 'child_process';

type FfmpegMetadata = {
    [key: string]: string | number | undefined;
};

export function runFFmpeg(
    inputPath: string,
    outputPath: string,
    metadata: FfmpegMetadata,
    albumArtPath?: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const args: string[] = [
            '-i', inputPath, // First input (audio)
        ];

        if (albumArtPath) {
            args.push('-i', albumArtPath); // Second input (image)
        }

        // --- Output Options ---
        args.push(
            '-y', // Overwrite output files without asking
            '-c:a', 'flac' // Set audio codec to flac for the output
        );

        // Map streams correctly
        args.push('-map', '0:a'); // Map audio from the first input
        if (albumArtPath) {
            args.push('-map', '1:v'); // Map video (image) from the second input
            args.push('-c:v', 'copy'); // Copy the image stream without re-encoding
            args.push('-disposition:v', 'attached_pic'); // Set the disposition to attached picture
        }
        
        // Apply metadata to the output file
        Object.entries(metadata).forEach(([key, value]) => {
            if (value) {
                args.push('-metadata', `${key}=${value}`);
            }
        });
        
        // Finally, specify the output path
        args.push(outputPath);

        const ffmpeg = spawn('ffmpeg', args);

        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            // Log ffmpeg progress in real-time if needed
            // console.log(data.toString());
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                console.error(`FFmpeg exited with code ${code}`);
                console.error('FFmpeg stderr:', stderr);
                reject(new Error(`FFmpeg failed with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('Failed to start FFmpeg process:', err);
            reject(err);
        });
    });
}