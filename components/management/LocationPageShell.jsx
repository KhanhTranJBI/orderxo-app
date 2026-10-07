"use client";
import Link from "next/link";
import useRestaurantLocation from "./useRestaurantLocation";
import useRestaurantPermissions from "./useRestaurantPermissions";
export default function LocationPageShell({ organizationId, title, description, children }) {
  const loc = useRestaurantLocation(organizationId);
  const access = useRestaurantPermissions(organizationId);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard/restaurants/${organizationId}`}
          className="font-semibold text-orange-600"
        >
          ← Restaurant workspace
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              OrderXO Manager
            </p>
            <h1 className="mt-1 text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-600">{description}</p>
          </div>
          <label className="text-sm font-semibold">
            Location
            <select
              className="ml-3 rounded-xl border bg-white px-3 py-2"
              value={loc.locationId}
              onChange={(e) => loc.setLocationId(e.target.value)}
            >
              {loc.locations.map((x) => (
                <option key={x._id || x.id} value={x._id || x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loc.error ? (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{loc.error}</p>
        ) : (
          children({
            locationId: loc.locationId,
            locations: loc.locations,
            loading: loc.loading,
            access,
          })
        )}
      </div>
    </main>
  );
}
