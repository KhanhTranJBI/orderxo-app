"use client";
import { ownerFetch } from "../../lib/ownerFetch";
import { useEffect, useState } from "react";

export default function useRestaurantLocation(organizationId) {
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const r = await ownerFetch(
          `/api/owner/locations?organizationId=${encodeURIComponent(organizationId)}`,
          { cache: "no-store" },
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Unable to load locations");
        if (!live) return;
        const list = d.locations || [];
        setLocations(list);
        if (list[0]) setLocationId(String(list[0]._id || list[0].id));
      } catch (e) {
        if (live) setError(e.message);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [organizationId]);
  return { locations, locationId, setLocationId, loading, error };
}
