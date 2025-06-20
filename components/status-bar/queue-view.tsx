import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'
import { ActivityIcon } from 'lucide-react'
import { Progress } from '../ui/progress'
import { Job } from '@/lib/server/queue'
import { formatTitle } from '@/lib/qobuz-dl'
import { useStatusBar } from '@/lib/status-bar/context'

const QueueView = ({ queueItems, currentJob }: { queueItems: Job[], currentJob: Job | null }) => {
    const [items, setItems] = useState<Job[]>(queueItems)
    const [search, setSearch] = useState<string>('')
    const { statusBar } = useStatusBar();

    useEffect(() => {
        const filteredItems = queueItems.filter((item) =>
            formatTitle(item.item).toLowerCase().includes(search.toLowerCase())
        );
        setItems(filteredItems);
    }, [search, queueItems]);

    return (
        <div className="space-y-4">
            <div>
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>
            <div className='space-y-2'>
                <ScrollArea className={cn('max-w-full overflow-x-clip')}>
                    <div className="max-w-full flex flex-col gap-1 max-h-[500px]">
                        {currentJob && (
                            <Card className='bg-muted/60 w-full pr-0'>
                                <CardHeader className='flex p-3 w-full flex-row space-y-0 items-center justify-between'>
                                    <CardTitle className='flex items-center gap-2 leading-snug'>
                                        <ActivityIcon className='size-5 shrink-0 aspect-square animate-spin' />
                                        <div className="flex items-center gap-2 flex-col justify-center w-full">
                                            <p className='text-sm font-semibold truncate max-w-[400px]'>{statusBar.title}</p>
                                            <Progress value={undefined} />
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        )}
                        {items.map((item, index) => (
                            <Card key={index}>
                                <CardHeader className='flex p-3 flex-row space-y-0 items-center justify-between'>
                                    <CardTitle className='flex items-center gap-2 leading-snug'>
                                        {item.icon != undefined && (
                                            <item.icon className='size-5 shrink-0 aspect-square' />
                                        )}
                                        <p className="text-sm font-semibold truncate max-w-[450px]">
                                            {formatTitle(item.item)}
                                        </p>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>

                {(items.length === 0 && !currentJob) && (
                    <div className='p-4 py-6 border-2 border-dashed text-center flex items-center justify-center rounded-lg'>
                        <p className="text-muted-foreground text-sm">The queue is empty.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QueueView