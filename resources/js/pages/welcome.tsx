import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <div className="flex w-full flex-col items-center justify-center text-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <h1 className="mb-4 text-4xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                        AI-Powered Content Moderation
                    </h1>
                    <p className="max-w-2xl text-base text-[#4a4a45] dark:text-[#bdbdb7]">
                        Analyze and classify both text and images to identify
                        potential risks such as explicit content, hate speech,
                        violence, or self-harm with detailed severity scoring
                        for precise control. Supports content in more than 100
                        languages, enabling global moderation at scale.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-lg bg-[#1b1b18] px-6 py-2.5 text-sm font-medium text-[#FDFDFC] shadow hover:bg-[#333] dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#bdbdb7]"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={register()}
                                    className="rounded-lg bg-[#1b1b18] px-6 py-2.5 text-sm font-medium text-[#FDFDFC] shadow hover:bg-[#333] dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#bdbdb7]"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    href={login()}
                                    className="rounded-lg border border-[#19140035] px-6 py-2.5 text-sm font-medium text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
