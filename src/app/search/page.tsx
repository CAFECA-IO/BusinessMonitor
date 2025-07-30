interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams;
  await Promise.resolve()
  const q = searchParams.q ?? ''

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-6 text-violet-600">
        搜索
      </h1>

      <form method="get" className="relative">
        <input
          name="q"
          defaultValue={q}
          placeholder="輸入商家名稱或編號…"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-2 bg-violet-600 text-white hover:bg-violet-700"
        >
          搜尋
        </button>
      </form>

      {q && (
        <p className="mt-4 text-center text-gray-600">
          你搜尋了：<span className="font-medium">{q}</span>
        </p>
      )}
    </main>
  )
}
