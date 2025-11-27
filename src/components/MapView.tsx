import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useMap } from "@/contexts/MapContext";

type Props = {
  /** TomTom API key. If not provided, `VITE_TOMTOM_KEY` will be used. */
  apiKey?: string;
};

const TOMTOM_CSS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css";
const TOMTOM_JS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js";

const MapView = ({ apiKey }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  // prefer explicit prop, fall back to Vite env var
  const key = apiKey ?? (import.meta.env.VITE_TOMTOM_KEY as string | undefined);

  // create a custom "snap-like" marker element (SVG inside a div)
  const createSnapMarker = (size = 36) => {
    const el = document.createElement("div");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.pointerEvents = "none";
    // simple pin-like SVG with yellow fill and white stroke — evocative, not a logo
    el.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.029 0 3 4.03 3 9.01c0 6.075 8.142 15.558 8.59 16.04.19.208.45.32.71.32.26 0 .52-.112.71-.32.448-.482 8.59-9.965 8.59-16.04C21 4.03 16.971 0 12 0z" fill="#FFDC00" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="3.25" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="0.75"/>
      </svg>
    `;
    return el;
  };

  useEffect(() => {
    if (!key) return; // nothing to do without an API key

    let isMounted = true;
    const watchIdRef = { id: -1 } as { id: number };
    const userMarkerRef = { marker: null as any };
    const initialPosRef = { lat: null as number | null, lng: null as number | null };

    // Request permission and start watching immediately so the browser prompts
    // for location access as soon as the component mounts (before SDK loads).
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted) return;
            initialPosRef.lat = pos.coords.latitude;
            initialPosRef.lng = pos.coords.longitude;
          },
          () => {
            // ignore errors; initialPosRef stays null
          },
          { enableHighAccuracy: true }
        );

        const earlyWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!isMounted) return;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            initialPosRef.lat = lat;
            initialPosRef.lng = lng;

            // if map has already been initialized, update marker/pan immediately
            const map = (mapContainer.current as any)?.__ttMap;
            if (map) {
              try {
                if (userMarkerRef.marker) {
                  userMarkerRef.marker.setLngLat([lng, lat]);
                } else if ((window as any).tt) {
                  const el = createSnapMarker(36);
                  userMarkerRef.marker = new (window as any).tt.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);
                }
                map.panTo([lng, lat]);
              } catch (e) {
                // ignore map update errors
              }
            }
          },
          () => {
            // ignore watch errors
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
        watchIdRef.id = earlyWatchId as unknown as number;
      } catch (e) {
        // some browsers or contexts may throw when calling geolocation
      }
    }

    function initMap() {
      if (!isMounted || !mapContainer.current || !(window as any).tt) return;
      try {
        const tt = (window as any).tt;
        const map = tt.map({
          key,
          container: mapContainer.current,
          center: [0, 0],
          zoom: 2,
        });

        // If we already have a recent position (from the early watch), use it
        if (initialPosRef.lat != null && initialPosRef.lng != null) {
          const lat = initialPosRef.lat as number;
          const lng = initialPosRef.lng as number;
          map.setCenter([lng, lat]);
          // set a closer zoom for live location (street level)
          map.setZoom(15);
          const el = createSnapMarker(36);
          const marker = new tt.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          userMarkerRef.marker = marker;
        }

        // store map instance for cleanup
        (mapContainer.current as any).__ttMap = map;
        // add click handler for selecting destination
        try {
          map.on("click", async (e: any) => {
            try {
              const lng = e.lngLat.lng ?? (e.lngLat as any)[0];
              const lat = e.lngLat.lat ?? (e.lngLat as any)[1];

              // create a small event on the container we can pick up with React state
              const ev = new CustomEvent("_tt_map_click", { detail: { lat, lng } });
              mapContainer.current?.dispatchEvent(ev);
            } catch (err) {
              // ignore click handling errors
            }
          });
        } catch (err) {
          // if SDK doesn't support `on` or pattern differs, ignore
        }
      } catch (err) {
        // silent fail — map won't render
        // developer can inspect console for `tt` availability
        // eslint-disable-next-line no-console
        console.error("TomTom map init error:", err);
      }
    }

    // ensure CSS is present
    if (!document.querySelector(`link[href=\"${TOMTOM_CSS}\"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = TOMTOM_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector("script[data-tt-sdk]") as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).tt) {
        initMap();
      } else {
        // if script exists but tt not ready yet, bind to load
        existing.addEventListener("load", initMap);
      }
    } else {
      const script = document.createElement("script");
      script.src = TOMTOM_JS;
      script.async = true;
      script.setAttribute("data-tt-sdk", "true");
      script.addEventListener("load", initMap);
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
      // remove map instance
      const map = (mapContainer.current as any)?.__ttMap;
      if (map && typeof map.remove === "function") {
        try {
          map.remove();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      // clear geolocation watch
      try {
        const id = (navigator as any)?.geolocation ? (navigator as any).geolocation : null;
        // If we stored a watch id on the ref, clear it
        // our watchIdRef was a closed-over object; try to find and clear on navigator
        // Since we stored watch id on local variable, attempt to clear via global API if available
        // (best-effort; no-op if not present)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (typeof watchIdRef !== "undefined" && watchIdRef.id && watchIdRef.id !== -1) {
          navigator.geolocation.clearWatch(watchIdRef.id as number);
        }
      } catch (e) {
        // ignore
      }
    };
  }, [key]);

  // local candidate state and UI handling
  const [candidate, setCandidate] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const destMarkerRef = useRef<any>(null);
  const { setDestination, destination, clearDestination } = useMap();

  useEffect(() => {
    const el = mapContainer.current;
    if (!el) return;

    const handler = async (e: Event) => {
      const detail = (e as any).detail as { lat: number; lng: number } | undefined;
      if (!detail) return;
      const { lat, lng } = detail;

      // attempt reverse geocode if key present
      let label: string | undefined;
      if (key) {
        try {
          const res = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${key}`
          );
          if (res.ok) {
            const json = await res.json();
            const addr = json?.addresses?.[0]?.address?.freeformAddress;
            if (addr) label = addr;
          }
        } catch (err) {
          // ignore reverse geocode errors
        }
      }

      setCandidate({ lat, lng, label });
    };

    el.addEventListener("_tt_map_click", handler);
    return () => el.removeEventListener("_tt_map_click", handler);
  }, [key]);

  // when destination in context changes, draw persistent marker
  useEffect(() => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map) return;

    // clear old marker
    if (destMarkerRef.current && typeof destMarkerRef.current.remove === "function") {
      try {
        destMarkerRef.current.remove();
      } catch (e) {}
      destMarkerRef.current = null;
    }

    if (destination) {
      try {
        const el = document.createElement("div");
        el.style.width = `40px`;
        el.style.height = `40px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.pointerEvents = "none";
        el.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C7.029 0 3 4.03 3 9.01c0 6.075 8.142 15.558 8.59 16.04.19.208.45.32.71.32.26 0 .52-.112.71-.32.448-.482 8.59-9.965 8.59-16.04C21 4.03 16.971 0 12 0z" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="3.25" fill="#FFFFFF" stroke="#EF4444" stroke-width="0.75"/>
          </svg>
        `;
        destMarkerRef.current = new (window as any).tt.Marker({ element: el })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
        // center map toward destination
        map.panTo([destination.lng, destination.lat]);
      } catch (e) {
        // ignore marker draw errors
      }
    }
  }, [destination]);

  return (
    <div className="w-full h-full relative bg-muted/20">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Candidate confirm UI */}
      {candidate && (
        <div className="absolute right-4 bottom-6 z-50 w-full max-w-sm">
          <div className="p-4 bg-card border shadow-lg rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Set destination</div>
            <div className="font-medium mb-3">{candidate.label ?? `${candidate.lat.toFixed(5)}, ${candidate.lng.toFixed(5)}`}</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // confirm -> persist in context
                  const dest = { lat: candidate.lat, lng: candidate.lng, label: candidate.label, createdAt: Date.now() };
                  setDestination(dest);
                  setCandidate(null);
                }}
                className="px-3 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-md w-full"
              >
                Set Destination
              </button>
              <button
                onClick={() => setCandidate(null)}
                className="px-3 py-2 border rounded-md w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
