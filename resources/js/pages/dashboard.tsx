import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type Category = 'Hate' | 'SelfHarm' | 'Sexual' | 'Violence';

type AnalysisResult = {
    blocklistsMatch: any[];
    categoriesAnalysis: { category: Category; severity: number }[];
};

const CATEGORIES: Category[] = ['Hate', 'SelfHarm', 'Sexual', 'Violence'];

const API_TEXT_ENDPOINT = '/api/text';
const API_IMAGE_ENDPOINT = '/api/image';

const defaultThresholds: Record<Category, number> = {
    Hate: 4,
    SelfHarm: 4,
    Sexual: 4,
    Violence: 4,
};

export default function Dashboard() {
    const { props } = usePage<SharedData>();
    const { name, api_token: apiKey } = props.auth.user;
    const apiBaseUrl = window.location.origin;
    const curlCmd = `curl -s -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d "{\"content\":\"Hello world\"}" ${apiBaseUrl}${API_TEXT_ENDPOINT}`;

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {}
    };

    const [thresholds, setThresholds] =
        useState<Record<Category, number>>(defaultThresholds);

    const [textContent, setTextContent] = useState<string>('');
    const [textLoading, setTextLoading] = useState(false);
    const [textError, setTextError] = useState<string | null>(null);
    const [textResponse, setTextResponse] = useState<AnalysisResult | null>(
        null,
    );

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageResponse, setImageResponse] = useState<AnalysisResult | null>(
        null,
    );

    const computeFlags = (
        result: AnalysisResult | null,
        t: Record<Category, number>,
    ) => {
        if (!result)
            return {
                flagged: [] as Category[],
                map: {} as Record<
                    Category,
                    { severity: number; threshold: number }
                >,
            };
        const map: Record<Category, { severity: number; threshold: number }> =
            {} as any;
        for (const c of CATEGORIES) {
            const entry = result.categoriesAnalysis.find(
                (x) => x.category === c,
            );
            const severity = entry?.severity ?? 0;
            map[c] = { severity, threshold: t[c] };
        }
        const flagged = CATEGORIES.filter(
            (c) => map[c].severity >= map[c].threshold,
        );
        return { flagged, map };
    };

    const textFlags = computeFlags(textResponse, thresholds);
    const imageFlags = computeFlags(imageResponse, thresholds);

    const handleTextSubmit = async () => {
        setTextError(null);
        setTextResponse(null);
        setTextLoading(true);
        try {
            const res = await fetch(API_TEXT_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: textContent,
                    categories: CATEGORIES,
                    outputType: 'FourSeverityLevels',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setTextError(data?.error || 'Request failed');
            } else {
                setTextResponse(data?.result ?? null);
            }
        } catch (e: any) {
            setTextError(e?.message || 'Network error');
        } finally {
            setTextLoading(false);
        }
    };

    const handleImageSubmit = async () => {
        if (!imageFile) return;
        setImageError(null);
        setImageResponse(null);
        setImageLoading(true);
        try {
            const form = new FormData();
            form.append('image', imageFile);

            const res = await fetch(API_IMAGE_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                body: form,
            });
            const data = await res.json();
            if (!res.ok) {
                setImageError(data?.error || 'Request failed');
            } else {
                setImageResponse(data?.analysis ?? null);
            }
        } catch (e: any) {
            setImageError(e?.message || 'Network error');
        } finally {
            setImageLoading(false);
        }
    };

    const renderCategoryRow = (
        cat: Category,
        map: Record<Category, { severity: number; threshold: number }>,
    ) => {
        const sev = map[cat]?.severity ?? 0;
        const thr = map[cat]?.threshold ?? thresholds[cat];
        const flagged = sev >= thr;
        return (
            <div
                key={cat}
                className="flex items-center justify-between text-sm"
            >
                <span className="font-medium">{cat}</span>
                <span
                    className={`font-mono ${flagged ? 'text-red-600' : 'text-green-700'}`}
                >
                    severity {sev} / threshold {thr}{' '}
                    {flagged ? '• flagged' : '• ok'}
                </span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <section className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-3xl font-black">
                                Welcome, {name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-8">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-medium">
                                        Your API key:
                                    </p>
                                    <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm">
                                        {apiKey}
                                    </code>
                                    <Button
                                        type="button"
                                        onClick={() => copy(apiKey)}
                                        size="sm"
                                        variant="outline"
                                        title="Copy API key"
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <Link
                                    href="./up"
                                    target="_blank"
                                    className="font-medium hover:underline"
                                >
                                    API status
                                </Link>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center px-6">
                            <p className="text-sm font-medium text-muted-foreground">
                                Requests this day
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {props.auth.user.requests_used} /{' '}
                                {props.auth.user.requests_limit}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Make your first API call
                            </p>
                            <p className="mt-1 text-sm">
                                Use curl to ping the API.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => copy(curlCmd)}
                            className="px-3 py-1 text-sm"
                            variant="outline"
                            title="Copy curl"
                        >
                            Copy
                        </Button>
                    </div>
                    <pre className="mt-3 max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                        <code className="whitespace-pre">{curlCmd}</code>
                    </pre>
                </section>

                <section className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Test moderation
                        </p>
                        <p className="mt-1 text-sm">
                            Send sample text or an image to the API and review
                            results. Configure thresholds on the right.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Card className="gap-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        Moderation tests
                                    </CardTitle>
                                    <CardDescription>
                                        Switch between Text and Image forms
                                        using the tabs below.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs
                                        defaultValue="text"
                                        className="w-full"
                                    >
                                        <TabsList>
                                            <TabsTrigger value="text">
                                                Text
                                            </TabsTrigger>
                                            <TabsTrigger value="image">
                                                Image
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent
                                            value="text"
                                            className="mt-4"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="text-base font-semibold">
                                                    Text moderation
                                                </h3>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setTextContent('');
                                                        setTextError(null);
                                                        setTextResponse(null);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Paste text below and analyze
                                                against current thresholds.
                                            </p>
                                            <div className="mt-3">
                                                <textarea
                                                    className="w-full resize-y rounded-md border p-2 text-sm"
                                                    rows={4}
                                                    placeholder="Enter text to analyze..."
                                                    value={textContent}
                                                    onChange={(e) =>
                                                        setTextContent(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <div className="mt-3 flex items-center gap-3">
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            handleTextSubmit
                                                        }
                                                        disabled={
                                                            !textContent ||
                                                            textLoading
                                                        }
                                                        className="px-3 py-1 text-sm"
                                                    >
                                                        {textLoading
                                                            ? 'Analyzing…'
                                                            : 'Analyze text'}
                                                    </Button>
                                                    {textError && (
                                                        <span className="text-xs text-red-600">
                                                            {textError}
                                                        </span>
                                                    )}
                                                </div>

                                                {textResponse && (
                                                    <div className="mt-4 space-y-2">
                                                        <div className="rounded-md border bg-muted p-3">
                                                            <p className="text-sm font-medium">
                                                                Summary
                                                            </p>
                                                            <div className="mt-2 space-y-1">
                                                                {CATEGORIES.map(
                                                                    (c) =>
                                                                        renderCategoryRow(
                                                                            c,
                                                                            textFlags.map,
                                                                        ),
                                                                )}
                                                            </div>
                                                            {textFlags.flagged
                                                                .length > 0 ? (
                                                                <p className="mt-2 text-sm text-red-700">
                                                                    Flagged:{' '}
                                                                    {textFlags.flagged.join(
                                                                        ', ',
                                                                    )}
                                                                </p>
                                                            ) : (
                                                                <p className="mt-2 text-sm text-green-700">
                                                                    No
                                                                    categories
                                                                    exceed
                                                                    thresholds.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                        <TabsContent
                                            value="image"
                                            className="mt-4"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="text-base font-semibold">
                                                    Image moderation
                                                </h3>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImageError(null);
                                                        setImageResponse(null);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Upload an image for analysis and
                                                see category severities.
                                            </p>
                                            <div className="mt-3 flex flex-col gap-3">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        setImageFile(
                                                            e.target
                                                                .files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                    className="w-full max-w-xs text-sm"
                                                />
                                                {imageFile && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Selected:{' '}
                                                        {imageFile.name} (
                                                        {Math.round(
                                                            (imageFile.size ||
                                                                0) / 1024,
                                                        )}{' '}
                                                        KB)
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            handleImageSubmit
                                                        }
                                                        disabled={
                                                            !imageFile ||
                                                            imageLoading
                                                        }
                                                        className="px-3 py-1 text-sm"
                                                    >
                                                        {imageLoading
                                                            ? 'Analyzing…'
                                                            : 'Analyze image'}
                                                    </Button>
                                                    {imageError && (
                                                        <span className="text-xs text-red-600">
                                                            {imageError}
                                                        </span>
                                                    )}
                                                </div>

                                                {imageResponse && (
                                                    <div className="mt-4 space-y-2">
                                                        <div className="rounded-md border bg-muted p-3">
                                                            <p className="text-sm font-medium">
                                                                Summary
                                                            </p>
                                                            <div className="mt-2 space-y-1">
                                                                {CATEGORIES.map(
                                                                    (c) =>
                                                                        renderCategoryRow(
                                                                            c,
                                                                            imageFlags.map,
                                                                        ),
                                                                )}
                                                            </div>
                                                            {imageFlags.flagged
                                                                .length > 0 ? (
                                                                <p className="mt-2 text-sm text-red-700">
                                                                    Flagged:{' '}
                                                                    {imageFlags.flagged.join(
                                                                        ', ',
                                                                    )}
                                                                </p>
                                                            ) : (
                                                                <p className="mt-2 text-sm text-green-700">
                                                                    No
                                                                    categories
                                                                    exceed
                                                                    thresholds.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Configure filters
                                </CardTitle>
                                <CardDescription>
                                    Adjust per-category thresholds. Low = 2, Med
                                    = 4, High = 6.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {CATEGORIES.map((cat) => (
                                        <div key={cat}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <Label
                                                    className="text-sm font-medium"
                                                    htmlFor={`slider-${cat}`}
                                                >
                                                    {cat}
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    Threshold: {thresholds[cat]}
                                                </span>
                                            </div>
                                            <Slider
                                                id={`slider-${cat}`}
                                                min={2}
                                                max={6}
                                                step={2}
                                                value={[thresholds[cat]]}
                                                onValueChange={(vals) =>
                                                    setThresholds({
                                                        ...thresholds,
                                                        [cat]: Number(
                                                            vals?.[0] ?? 0,
                                                        ),
                                                    })
                                                }
                                                className="w-full"
                                            />
                                            <p className="mt-4 flex text-xs text-muted-foreground">
                                                {thresholds[cat] === 2 &&
                                                    'Block Low, Medium and High'}
                                                {thresholds[cat] === 4 &&
                                                    'Allow Low / Block Medium and High'}
                                                {thresholds[cat] === 6 &&
                                                    'Block High only'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
