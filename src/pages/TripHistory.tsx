import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, CheckCircle2, XCircle } from "lucide-react";
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

export default function TripHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  useEffect(() => {
    const uid = user?.uid || localStorage.getItem("swarm_user_id") || "";
    if (!uid) return;
    const unsub = subscribeToUserTrips(uid, setTrips);
    return () => unsub();
  }, [user?.uid]);

  const filtered = dedupeTrips(trips).filter(t => {
    if (filter === "all") return true;
    if (filter === "active") return t.status === "active" || !t.completedAt;
    return t.status === filter;
  });

  const recommendations = computeDestinationRecommendations(trips);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Trip History</h2>
        <div className="flex items-center gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "active" ? "default" : "outline"} size="sm" onClick={() => setFilter("active")}>Active</Button>
          <Button variant={filter === "completed" ? "default" : "outline"} size="sm" onClick={() => setFilter("completed")}>Completed</Button>
          <Button variant={filter === "cancelled" ? "default" : "outline"} size="sm" onClick={() => setFilter("cancelled")}>Cancelled</Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No trips found for this filter</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered
            .slice()
            .sort((a, b) => (b.startedAt?.seconds ?? 0) - (a.startedAt?.seconds ?? 0))
            .map((t) => {
              const destLabel = t.destination?.label ?? (t.destination ? `${t.destination.lat.toFixed(4)}, ${t.destination.lng.toFixed(4)}` : "--");
              const statusBadge = (
                t.status === "completed" ? <Badge className="bg-green-600/20 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1"/>Completed</Badge> :
                t.status === "cancelled" ? <Badge className="bg-red-600/20 text-red-700"><XCircle className="w-3 h-3 mr-1"/>Cancelled</Badge> :
                <Badge className="bg-blue-600/20 text-blue-700">Active</Badge>
              );
              return (
                <Card key={t.id} className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4"/>
                      <span className="text-sm font-medium">{destLabel}</span>
                    </div>
                    {statusBadge}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Start: {fmtTime(t.startedAt)}</span>
                    {t.completedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>End: {fmtTime(t.completedAt)}</span>}
                  </div>
                  {t.notes && <p className="text-xs mt-2">{t.notes}</p>}
                </Card>
              );
            })}
        </div>
      )}

      {/* AI Recommendations removed here to avoid duplicate UI. See main page section. */}
    </div>
  );
}

// Remove duplicate trips: keep one per destination and start time window
function dedupeTrips(list: TripRecord[]): TripRecord[] {
  const seen = new Set<string>();
  const out: TripRecord[] = [];
  for (const t of list) {
    const lat = t.destination?.lat ?? 0;
    const lng = t.destination?.lng ?? 0;
    const label = (t.destination?.label ?? '').trim().toLowerCase();
    const startedSec = t.startedAt?.seconds ?? 0;
    // bucket start time to 2 minutes to tolerate minor differences
    const bucket = Math.floor(startedSec / 120);
    const latR = Math.round(lat * 1e5) / 1e5;
    const lngR = Math.round(lng * 1e5) / 1e5;
    const key = `${label || ''}|${latR},${lngR}|${bucket}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

type Recommendation = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  lastVisited: any;
};

function computeDestinationRecommendations(list: TripRecord[]): Recommendation[] {
  const freq: Record<string, Recommendation> = {};
  for (const t of list) {
    const lat = t.destination?.lat ?? 0;
    const lng = t.destination?.lng ?? 0;
    const label = (t.destination?.label ?? '').trim();
    const latR = Math.round(lat * 1e5) / 1e5;
    const lngR = Math.round(lng * 1e5) / 1e5;
    const key = `${(label || '').toLowerCase()}|${latR},${lngR}`;
    if (!freq[key]) {
      freq[key] = { key, label, lat: latR, lng: lngR, count: 0, lastVisited: t.completedAt || t.startedAt };
    }
    freq[key].count += 1;
    // Update last visited if newer
    const currSec = (freq[key].lastVisited?.seconds ?? 0);
    const tSec = (t.completedAt?.seconds ?? t.startedAt?.seconds ?? 0);
    if (tSec > currSec) freq[key].lastVisited = t.completedAt || t.startedAt;
  }
  return Object.values(freq).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aSec = a.lastVisited?.seconds ?? 0;
    const bSec = b.lastVisited?.seconds ?? 0;
    return bSec - aSec;
  });
}
