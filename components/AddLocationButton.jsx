"use client";
import Link from "next/link";
import { Plus } from "lucide-react";

// Both entry points use the same billing confirmation and creation flow.
export default function AddLocationButton({ organizationId }) {
  return (
    <Link
      href={`/dashboard/settings/billing?organizationId=${encodeURIComponent(organizationId)}&action=add-location`}
      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
    >
      <Plus size={17} /> Add location
    </Link>
  );
}
