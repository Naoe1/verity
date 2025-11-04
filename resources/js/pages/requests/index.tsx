import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import requestRoutes from '@/routes/requests';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RequestItem {
    id: number;
    content_type: 'text' | 'image' | string;
    content: string;
    status?: 'success' | 'fail';
    request_metadata?: Record<string, any> | null;
    moderation_result?: {
        blocklistsMatch?: any[];
        categoriesAnalysis?: {
            category: 'Hate' | 'SelfHarm' | 'Sexual' | 'Violence';
            severity: number;
        }[];
    } | null;
    created_at: string;
}

interface PageProps extends SharedData {
    requests: {
        data: RequestItem[];
        current_page: number;
        last_page: number;
        next_page_url?: string | null;
        prev_page_url?: string | null;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Requests', href: '/requests' },
];

export default function RequestsIndex() {
    const { props } = usePage<PageProps>();
    const { requests } = props;

    const initialSearch =
        props.filters?.search ??
        (typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('search') || ''
            : '');
    const [search, setSearch] = useState<string>(initialSearch);

    // Debounced search: update URL and fetch via Inertia
    const didMount = useRef(false);
    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        const handle = setTimeout(() => {
            const query: Record<string, string | number> = {};
            if (search.trim() !== '') query.search = search.trim();
            // Reset to first page when changing search
            query.page = 1;
            router.get(
                requestRoutes.index.url({ query }),
                {},
                { preserveState: true, replace: true },
            );
        }, 300);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const goToPage = (page: number) => {
        const query: Record<string, string | number> = { page };
        if (search.trim() !== '') query.search = search.trim();
        router.get(
            requestRoutes.index.url({ query }),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Build simple pagination range with ellipses
    const pages = useMemo(() => {
        const current = requests.current_page;
        const last = requests.last_page;
        if (last <= 1) return [] as (number | 'ellipsis')[];
        const range = new Set<number>();
        const add = (n: number) => {
            if (n >= 1 && n <= last) range.add(n);
        };
        add(1);
        add(last);
        for (let i = current - 2; i <= current + 2; i++) add(i);
        const sorted = Array.from(range).sort((a, b) => a - b);
        const out: (number | 'ellipsis')[] = [];
        for (let i = 0; i < sorted.length; i++) {
            out.push(sorted[i]);
            if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
                out.push('ellipsis');
            }
        }
        return out;
    }, [requests.current_page, requests.last_page]);

    const previewText = (item: RequestItem) => {
        if (item.content_type === 'text') {
            const t = (item.content || '').replace(/\s+/g, ' ').trim();
            return t.length > 120 ? t.slice(0, 117) + '…' : t;
        }
        const name =
            (item.request_metadata as any)?.image?.original_filename ||
            'Image upload';
        return name;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Previous requests</CardTitle>
                                <CardDescription>
                                    A history of your moderation requests. Click
                                    a request to view full details.
                                </CardDescription>
                            </div>
                            <div className="w-full min-w-48 sm:w-72">
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search requests..."
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {requests.data.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No requests yet.
                                </p>
                            )}
                            {requests.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-md border p-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="secondary"
                                                className="uppercase"
                                            >
                                                {item.content_type}
                                            </Badge>
                                            <p className="text-sm font-medium">
                                                {previewText(item)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    item.created_at,
                                                ).toLocaleString()}
                                            </p>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={`/requests/${item.id}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                    {item.moderation_result?.categoriesAnalysis
                                        ?.length ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
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
                                                        {c.category}:{' '}
                                                        {c.severity}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        {requests.last_page > 1 && (
                            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={requests.current_page <= 1}
                                        onClick={() =>
                                            goToPage(requests.current_page - 1)
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {pages.map((p, idx) =>
                                            p === 'ellipsis' ? (
                                                <span
                                                    key={`e-${idx}`}
                                                    className="px-2 text-muted-foreground"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    variant={
                                                        p ===
                                                        requests.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => goToPage(p)}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={
                                            requests.current_page >=
                                            requests.last_page
                                        }
                                        onClick={() =>
                                            goToPage(requests.current_page + 1)
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Showing{' '}
                                    {(requests.current_page - 1) *
                                        requests.per_page +
                                        (requests.data.length ? 1 : 0)}
                                    -
                                    {(requests.current_page - 1) *
                                        requests.per_page +
                                        requests.data.length}{' '}
                                    of {requests.total}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
