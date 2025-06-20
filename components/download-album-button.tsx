import React from 'react'
import { Button, ButtonProps } from './ui/button'
import { DownloadIcon } from 'lucide-react'
import { QobuzAlbum, QobuzTrack } from '@/lib/qobuz-dl'
import { useSimpleToast } from '@/hooks/use-simple-toast'
import axios from 'axios'

export interface DownloadAlbumButtonProps extends ButtonProps {
    result: QobuzAlbum | QobuzTrack;
    onDownloadQueued?: () => void;
}

async function queueServerDownload(item: QobuzAlbum | QobuzTrack, toast: (props: any) => void) {
    try {
        const { data } = await axios.post('/api/server-download', { item });
        toast({ title: data.message });
    } catch (error: any) {
        toast({
            title: "Error queueing download",
            description: error?.response?.data?.message || error.message,
            variant: "destructive"
        });
    }
}

const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadAlbumButtonProps>(
    ({ className, variant, size, asChild = false, result, onDownloadQueued, ...props }, ref) => {
        const { toast } = useSimpleToast();

        const handleDownload = () => {
            queueServerDownload(result, toast);
            if (onDownloadQueued) {
                onDownloadQueued();
            }
        };

        return (
            <Button
                className={className}
                ref={ref}
                variant={variant}
                size={size}
                asChild={asChild}
                onClick={handleDownload}
                {...props}
            >
                <DownloadIcon className='!size-4' />
            </Button>
        )
    }
)
DownloadButton.displayName = "DownloadAlbumButton";

export default DownloadButton