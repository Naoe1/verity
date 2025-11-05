import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface TextRequestMetadata {
    categories: ('Hate' | 'SelfHarm' | 'Sexual' | 'Violence')[];
    outputType: 'FourSeverityLevels';
    api_version: string;
}

interface ImageRequestMetadata extends TextRequestMetadata {
    image: {
        path: string;
        type: 'upload';
        original: string;
    };
}

type RequestMetadata = TextRequestMetadata | ImageRequestMetadata;
interface RequestItem {
    id: number;
    content_type: 'text' | 'image' | string;
    content: string;
    status?: 'success' | 'fail';
    request_metadata?: RequestMetadata | null;
    moderation_result?: {
        categoriesAnalysis?: {
            category: 'Hate' | 'SelfHarm' | 'Sexual' | 'Violence';
            severity: number;
        }[];
    } | null;
    created_at: string;
    updated_at: string;
    image_url?: string;
}

interface PageProps extends SharedData {
    request: RequestItem;
}

export default function RequestShow() {
    const { props } = usePage<PageProps>();
    const item = props.request;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Requests', href: '/requests' },
        { title: `#${item.id}`, href: `/requests/${item.id}` },
    ];

    const filename =
        item.content_type === 'image' &&
        item.request_metadata &&
        'image' in item.request_metadata
            ? item.request_metadata.image.original
            : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Request #${item.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <CardTitle>Request #{item.id}</CardTitle>
                                <Badge
                                    variant="secondary"
                                    className="uppercase"
                                >
                                    {item.content_type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Created:</span>
                                <span>
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <CardDescription>
                            {item.content_type === 'text' ? (
                                <span className="line-clamp-2">
                                    {item.content}
                                </span>
                            ) : (
                                <span>Image: {filename || 'upload'}</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {item.content_type === 'image' ? (
                            <div className="mb-4">
                                {item.image_url ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="relative flex max-h-[60vh] items-center justify-center overflow-hidden rounded-md border bg-muted/20">
                                            <img
                                                src={item.image_url}
                                                alt={
                                                    filename
                                                        ? `Image: ${filename}`
                                                        : `Request #${item.id} image`
                                                }
                                                loading="lazy"
                                                decoding="async"
                                                sizes="(min-width: 1024px) 50vw, 100vw"
                                                className="h-auto max-h-[60vh] w-full object-contain"
                                            />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <a
                                                href={item.image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline"
                                            >
                                                Open full size
                                            </a>
                                            {filename ? (
                                                <span className="ml-2">
                                                    ({filename})
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        No image URL available.
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {item.moderation_result?.categoriesAnalysis?.length ? (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {item.moderation_result.categoriesAnalysis.map(
                                    (c) => (
                                        <Badge
                                            key={c.category}
                                            variant={
                                                c.severity >= 4
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {c.category}: {c.severity}
                                        </Badge>
                                    ),
                                )}
                            </div>
                        ) : null}

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">
                                    Request metadata
                                </h3>
                                <pre className="max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                                    <code>
                                        {JSON.stringify(
                                            item.request_metadata ?? {},
                                            null,
                                            2,
                                        )}
                                    </code>
                                </pre>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">
                                    Moderation result
                                </h3>
                                <pre className="max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                                    <code>
                                        {JSON.stringify(
                                            item.moderation_result ?? {},
                                            null,
                                            2,
                                        )}
                                    </code>
                                </pre>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link href="/requests">Back to requests</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
