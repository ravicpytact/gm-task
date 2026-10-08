import { redirect } from "next/navigation";

// The Dashboard is now Todos (decision 2026-10-08); old bookmarks keep working, with their ?date=.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, v);
    }
  }
  const search = query.toString();
  redirect(search ? `/todos?${search}` : "/todos");
}
