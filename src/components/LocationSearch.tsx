import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { MapContext, Destination } from "@/contexts/MapContext";
import { useToast } from "@/hooks/use-toast";

type Props = {
	onSelect?: (d: Destination) => void;
	compact?: boolean;
};

const LocationSearch = ({ onSelect, compact }: Props) => {
	const mapCtx = useContext(MapContext);
	const setDestinationFromContext = mapCtx?.setDestination;
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<Array<any>>([]);
	const key = import.meta.env.VITE_TOMTOM_KEY as string | undefined;
	const { toast } = useToast();

	const searchAndSet = async () => {
		const q = query.trim();
		if (!q) return;
		setLoading(true);
		try {
			if (key) {
				const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${key}&limit=5`;
				const res = await fetch(url);
				if (!res.ok) {
					let errBody: any = null;
					try {
						errBody = await res.json();
					} catch (ee) { }
					if (errBody?.detailedError?.code === "InsufficientFunds") {
						toast({ title: "TomTom quota exceeded", description: "Falling back to OpenStreetMap search.", variant: "default" });
						await nominatimSearch(q);
						return;
					}
					throw new Error("search failed");
				}
				const json = await res.json();
				if (json?.detailedError?.code === "InsufficientFunds") {
					toast({ title: "TomTom quota exceeded", description: "Falling back to OpenStreetMap search.", variant: "default" });
					await nominatimSearch(q);
					return;
				}
				const items = json?.results ?? [];
				setResults(items.slice(0, 5));
				// if there is exactly one result, auto-select it
				if (items.length === 1) {
					const r = items[0];
					const lat = r?.position?.lat;
					const lng = r?.position?.lon;
					if (typeof lat === "number" && typeof lng === "number") {
						const title = r?.poi?.name || r?.address?.freeformAddress || q;
						const dest: Destination = { lat, lng, label: title, createdAt: Date.now() };
						if (setDestinationFromContext) setDestinationFromContext(dest);
						if (typeof onSelect === "function") onSelect(dest);
					}
				}
			} else {
				// no TomTom key available, use nominatim directly
				await nominatimSearch(q);
			}
		} catch (e) {
			// fallback to Nominatim if TomTom or network fails
			try {
				await nominatimSearch(q);
			} catch (ee) {
				// ignore final fallback error
			}
		} finally {
			setLoading(false);
		}
	};

	const nominatimSearch = async (q: string) => {
		if (!q) return;
		try {
			const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
			const res = await fetch(nomUrl, {
				headers: {
					"Accept": "application/json",
				},
			});
			if (!res.ok) throw new Error("nominatim failed");
			const json = await res.json();
			const items = (json ?? []).map((it: any) => ({
				position: { lat: Number(it.lat), lon: Number(it.lon) },
				poi: { name: it.display_name },
				address: { freeformAddress: it.display_name },
			}));
			setResults(items.slice(0, 5));
			return items;
		} catch (e) {
			throw e;
		}
	};

	return (
		<Card className={`p-3 bg-card/95 backdrop-blur shadow-lg border-primary/10 ${compact ? "p-2" : ""}`}>
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
			{results.length > 0 ? (
				<div className="mt-2 space-y-1">
					{results.map((r: any, idx: number) => {
						const title = r?.poi?.name || r?.address?.freeformAddress || r?.address?.freeformAddress;
						const lat = r?.position?.lat;
						const lng = r?.position?.lon;
						return (
							<button
								key={idx}
								onClick={() => {
									if (typeof lat === "number" && typeof lng === "number") {
										const dest: Destination = { lat, lng, label: title, createdAt: Date.now() };
										if (setDestinationFromContext) setDestinationFromContext(dest);
										if (typeof onSelect === "function") onSelect(dest);
									}
								}}
								className="w-full text-left p-2 rounded hover:bg-muted/10"
							>
								<div className="text-sm font-medium">{title}</div>
								<div className="text-xs text-muted-foreground">{lat?.toFixed?.(5) ?? ""}, {lng?.toFixed?.(5) ?? ""}</div>
							</button>
						);
					})}
				</div>
			) : null}
		</Card>
	);
};

export default LocationSearch;
