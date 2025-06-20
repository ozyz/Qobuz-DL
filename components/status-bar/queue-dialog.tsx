import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import QueueView from './queue-view'
import { Job } from '@/lib/server/queue'

const QueueDialog = ({ open, setOpen, queueItems, currentJob }: { open: boolean, setOpen: (open: boolean) => void, queueItems: Job[], currentJob: Job | null }) => {
    const totalItems = queueItems.length + (currentJob ? 1 : 0);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Queue</DialogTitle>
                    <DialogDescription>
                        {totalItems > 0
                            ? `${totalItems} ${totalItems > 1 ? 'items' : 'item'} in queue`
                            : 'No items in the queue'
                        }
                    </DialogDescription>
                </DialogHeader>
                <QueueView queueItems={queueItems} currentJob={currentJob} />
            </DialogContent>
        </Dialog>
    )
}

export default QueueDialog