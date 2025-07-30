import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-50 space-y-6">
      <h1 className="text-5xl font-extrabold text-violet-600">
        Business Monitor
      </h1>

      <div className="space-x-4">
        <Link
          href="/landing"
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          Landing
        </Link>

        <Link
          href="/search"
          className="px-6 py-3 border border-violet-600 text-violet-600 rounded-lg hover:bg-violet-100"
        >
          Search
        </Link>
      </div>
    </main>
  );
}
