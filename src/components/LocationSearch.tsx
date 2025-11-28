import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMap } from "@/contexts/MapContext";

const LocationSearch = () => {
	const { setDestination } = useMap();
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const key = import.meta.env.VITE_TOMTOM_KEY as string | undefined;

	const searchAndSet = async () => {
		const q = query.trim();
		if (!q || !key) return;
		setLoading(true);
		try {
			const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${key}&limit=1`;
			const res = await fetch(url);
			if (!res.ok) throw new Error("search failed");
			const json = await res.json();
			const r = json?.results?.[0];
			const lat = r?.position?.lat;
			const lng = r?.position?.lon;
			if (typeof lat === "number" && typeof lng === "number") {
				const title = r?.poi?.name || r?.address?.freeformAddress || q;
				setDestination({ lat, lng, label: title, createdAt: Date.now() });
			}
		} catch (e) {
			// ignore
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="p-3 bg-card/95 backdrop-blur shadow-lg border-primary/10">
			<div className="flex items-center gap-2">
				<Input
					placeholder="Search location"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") searchAndSet();
					}}
					className="text-sm"
				/>
				<Button size="sm" onClick={searchAndSet} disabled={loading}>
					{loading ? "Searching…" : "Set"}
				</Button>
			</div>
		</Card>
	);
};

export default LocationSearch;
