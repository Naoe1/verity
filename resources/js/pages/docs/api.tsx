import { Head } from '@inertiajs/react';

export default function ApiDocs() {
    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
            <Head title="API Docs" />
            <h1 className="mb-6 text-2xl font-semibold">API Documentation</h1>
            <p className="mb-8 text-neutral-600 dark:text-neutral-300">
                Simple HTTP API for content moderation. All requests must
                include an Authorization header with your API token.
            </p>

            <section className="mb-10">
                <h2 className="mb-2 text-xl font-medium">Base URL</h2>
                <code className="rounded bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800">
                    {window.location.origin}/api
                </code>
            </section>

            <section className="mb-10">
                <h2 className="mb-2 text-xl font-medium">Authentication</h2>
                <p className="mb-2">
                    Use a Bearer token in the Authorization header:
                </p>
                <pre className="overflow-x-auto rounded-md bg-neutral-900 p-4 text-sm text-neutral-100 dark:bg-neutral-900">
                    {`Authorization: Bearer <your_api_token>`}
                </pre>
            </section>

            <section className="mb-10">
                <h2 className="mb-2 text-xl font-medium">POST /api/text</h2>
                <p className="mb-2">
                    Analyze a text snippet for safety categories.
                </p>

                <h3 className="mt-3 text-base font-medium">
                    Request Body (JSON)
                </h3>
                <pre className="overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-800">
                    {`{
  "content": "string", // required
  "categories": ["Hate", "SelfHarm", "Sexual", "Violence"] // optional
}`}
                </pre>

                <h3 className="mt-3 text-base font-medium">Responses</h3>
                <ul className="list-inside list-disc text-sm text-neutral-700 dark:text-neutral-300">
                    <li>200: JSON payload with moderation result</li>
                    <li>401: Missing/invalid token</li>
                    <li>422: Validation error</li>
                </ul>

                <h4 className="mt-4 text-base font-medium">
                    Sample 200 Response
                </h4>
                <pre className="overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-800">
                    {`{
  "request_id": 45813,
  "result": [
    { "category": "Hate", "severity": 0 },
    { "category": "SelfHarm", "severity": 0 },
    { "category": "Sexual", "severity": 0 },
    { "category": "Violence", "severity": 4 }
  ]
}`}
                </pre>
            </section>

            <section className="mb-10">
                <h2 className="mb-2 text-xl font-medium">POST /api/image</h2>
                <p className="mb-2">
                    Analyze an uploaded image for safety categories.
                </p>

                <h3 className="mt-3 text-base font-medium">Form Data</h3>
                <pre className="overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-800">
                    {`image: File // required (max 10 MB)
categories[]: Hate | SelfHarm | Sexual | Violence // optional`}
                </pre>

                <h3 className="mt-3 text-base font-medium">Responses</h3>
                <ul className="list-inside list-disc text-sm text-neutral-700 dark:text-neutral-300">
                    <li>200: JSON payload with moderation result</li>
                    <li>401: Missing/invalid token</li>
                    <li>422: Invalid file or validation error</li>
                </ul>

                <h4 className="mt-4 text-base font-medium">
                    Sample 200 Response
                </h4>
                <pre className="overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-800">
                    {`{
  "request_id": 45813,
  "result": [
    { "category": "Hate", "severity": 0 },
    { "category": "SelfHarm", "severity": 0 },
    { "category": "Sexual", "severity": 0 },
    { "category": "Violence", "severity": 4 }
  ]
}`}
                </pre>
            </section>

            <section className="mb-10">
                <h2 className="mb-2 text-xl font-medium">Notes</h2>
                <ul className="list-inside list-disc text-sm text-neutral-700 dark:text-neutral-300">
                    <li>
                        Default categories are ["Hate", "SelfHarm", "Sexual",
                        "Violence"] if not provided.
                    </li>
                    <li>
                        Rate limits may apply; exceeding limits returns 429.
                    </li>
                </ul>
            </section>
        </div>
    );
}
