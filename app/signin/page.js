import { redirect } from "next/navigation";
export default function Page({ searchParams }) {
  const next = searchParams?.next;
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
}
