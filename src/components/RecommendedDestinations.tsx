import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToUserTrips, TripRecord } from "@/lib/trips";

const fmtTime = (t: any) => {
  try {
    const ms = t?.toMillis?.() ?? (t?.seconds ? t.seconds * 1000 : undefined);
    if (!ms) return "--";
    const d = new Date(ms);
    return d.toLocaleString();
  } catch {
    return "--";
  }
};

type Recommendation = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  lastVisited: any;
};

function computeDestinationRecommendations(list: TripRecord[]): Recommendation[] {
  // First, build raw points
  const points = list
    .filter(t => (t.destination?.lat != null && t.destination?.lng != null))
    .map(t => ({
      lat: t.destination!.lat as number,
      lng: t.destination!.lng as number,
      label: (t.destination?.label ?? '').trim(),
      visited: t.completedAt || t.startedAt,
    }));

  // Cluster points within radiusMeters using a greedy approach
  const radiusMeters = 300; // ~300m radius
  const clusters: { centerLat: number; centerLng: number; items: typeof points }[] = [];

  for (const p of points) {
    let assigned = false;
    for (const c of clusters) {
      const d = haversineMeters(p.lat, p.lng, c.centerLat, c.centerLng);
      if (d <= radiusMeters) {
        c.items.push(p);
        // update center as simple average
        const n = c.items.length;
        c.centerLat = (c.centerLat * (n - 1) + p.lat) / n;
        c.centerLng = (c.centerLng * (n - 1) + p.lng) / n;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({ centerLat: p.lat, centerLng: p.lng, items: [p] });
    }
  }

  // Build recommendations from clusters
  const recs: Recommendation[] = clusters.map((c) => {
    const count = c.items.length;
    const lastVisited = c.items.reduce((acc, it) => {
      const s = it.visited?.seconds ?? 0;
      const a = acc?.seconds ?? 0;
      return s > a ? it.visited : acc;
    }, c.items[0]?.visited);
    // prefer the most common non-empty label in the cluster
    const labelCounts: Record<string, number> = {};
    for (const it of c.items) {
      const lbl = it.label;
      if (!lbl) continue;
      labelCounts[lbl] = (labelCounts[lbl] ?? 0) + 1;
    }
    const bestLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const latR = Math.round(c.centerLat * 1e5) / 1e5;
    const lngR = Math.round(c.centerLng * 1e5) / 1e5;
    const key = `${bestLabel.toLowerCase()}|${latR},${lngR}`;
    return { key, label: bestLabel, lat: latR, lng: lngR, count, lastVisited };
  });

  return recs.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aSec = a.lastVisited?.seconds ?? 0;
    const bSec = b.lastVisited?.seconds ?? 0;
    return bSec - aSec;
  });
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RecommendedDestinations() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);

  useEffect(() => {
    const uid = user?.uid || localStorage.getItem("swarm_user_id") || "";
    if (!uid) return;
    const unsub = subscribeToUserTrips(uid, setTrips);
    return () => unsub();
  }, [user?.uid]);

  const recommendations = computeDestinationRecommendations(trips);
  // Make recommendations different from immediate history: exclude destinations
  // visited very recently (e.g., within 24 hours) and the last 3 distinct destinations
  const nowSec = Math.floor(Date.now() / 1000);
  const recentThresholdSec = 24 * 3600; // 24 hours
  // Build set of last 3 distinct destination keys from raw trips
  const lastDistinctKeys = new Set<string>();
  for (const t of [...trips].sort((a,b) => (b.startedAt?.seconds??0) - (a.startedAt?.seconds??0))) {
    const lat = t.destination?.lat ?? 0;
    const lng = t.destination?.lng ?? 0;
    const label = (t.destination?.label ?? '').trim().toLowerCase();
    const latR = Math.round(lat * 1e5) / 1e5;
    const lngR = Math.round(lng * 1e5) / 1e5;
    const key = `${label}|${latR},${lngR}`;
    if (!lastDistinctKeys.has(key)) {
      lastDistinctKeys.add(key);
      if (lastDistinctKeys.size >= 3) break;
    }
  }
  const filteredRecs = recommendations.filter(r => {
    const lastSec = r.lastVisited?.seconds ?? 0;
    const isRecent = (nowSec - lastSec) <= recentThresholdSec;
    const key = `${(r.label||'').toLowerCase()}|${r.lat},${r.lng}`;
    const isInLastDistinct = lastDistinctKeys.has(key);
    return !isRecent && !isInLastDistinct;
  });

  const fallbackSamples: Recommendation[] = [
    { key: "mumbai|19.0760,72.8777", label: "Mumbai, Maharashtra, India", lat: 19.0760, lng: 72.8777, count: 0, lastVisited: null },
    { key: "pune|18.5204,73.8567", label: "Pune, Maharashtra, India", lat: 18.5204, lng: 73.8567, count: 0, lastVisited: null },
    { key: "satara|17.6805,74.0183", label: "Satara, Maharashtra", lat: 17.6805, lng: 74.0183, count: 0, lastVisited: null },
    { key: "sangli|16.8524,74.5815", label: "Sangli, Maharashtra", lat: 16.8524, lng: 74.5815, count: 0, lastVisited: null },
    { key: "kolhapur|16.7050,74.2433", label: "Kolhapur, Maharashtra", lat: 16.7050, lng: 74.2433, count: 0, lastVisited: null },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Recommendations</h2>
      </div>
      <Separator />
      {filteredRecs.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-3">
          {fallbackSamples.slice(0, 4).map((r) => (
            <Card key={r.key} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{r.label}</span>
                </div>
                <Badge className="bg-secondary/10 text-secondary">Suggested</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Coords: {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filteredRecs.slice(0, 6).map((r) => (
            <Card key={r.key} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{r.label || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</span>
                </div>
                <Badge className="bg-secondary/10 text-secondary">{r.count} visits</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last visited: {fmtTime(r.lastVisited)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
