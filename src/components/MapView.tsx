import { useEffect, useRef, useState } from "react";
// removed candidate UI; keep only map and destination marker
import { useMap } from "@/contexts/MapContext";
import { subscribeToMemberLocations, subscribeToGroup, subscribeToGroups, subscribeToMembers } from "@/lib/groups";
import { logTripStart, logTripComplete } from "@/lib/trips";
import { useAuth } from "@/hooks/useAuth";
import { useMemberLocations } from "@/hooks/useMemberLocation";

type Props = {
  /** TomTom API key. If not provided, `VITE_TOMTOM_KEY` will be used. */
  apiKey?: string;
  groupId?: string | null;
};

const TOMTOM_CSS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css";
const TOMTOM_JS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js";

// Helper function to generate unique avatar SVG based on user ID
const generateUniqueAvatar = (userId: string, size = 40) => {
  // Hash user ID to get consistent colors/features
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Different background colors per user
  const bgColors = [
    ["#0ea5e9", "#0284c7"], // blue
    ["#8b5cf6", "#7c3aed"], // purple
    ["#f59e0b", "#d97706"], // orange
    ["#10b981", "#059669"], // green
    ["#ef4444", "#dc2626"], // red
    ["#ec4899", "#db2777"], // pink
    ["#06b6d4", "#0891b2"], // cyan
    ["#6366f1", "#4f46e5"], // indigo
  ];
  const bgIndex = Math.abs(hash) % bgColors.length;
  const [bgColor1, bgColor2] = bgColors[bgIndex];
  
  // Different skin tones
  const skinTones = ["#fde2c3", "#facc9f", "#e8c5a0", "#d4a574", "#c18a5b"];
  const skinIndex = Math.abs(hash * 2) % skinTones.length;
  const skinColor = skinTones[skinIndex];
  
  // Different hair colors
  const hairColors = ["#1f2937", "#111827", "#78350f", "#92400e", "#451a03", "#581c87", "#7c2d12"];
  const hairIndex = Math.abs(hash * 3) % hairColors.length;
  const hairColor = hairColors[hairIndex];
  
  // Different hoodie/shirt colors
  const shirtColors = ["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
  const shirtIndex = Math.abs(hash * 4) % shirtColors.length;
  const shirtColor = shirtColors[shirtIndex];
  
  // Hair style variation (short/long)
  const hasLongHair = Math.abs(hash * 5) % 2 === 0;
  
  const svgId = `avatar-${userId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const scale = size / 40;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${svgId}-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bgColor1}"/>
          <stop offset="1" stop-color="${bgColor2}"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#${svgId}-bg)"/>
      <!-- neck -->
      <rect x="33" y="42" width="14" height="12" rx="6" fill="${skinColor}"/>
      <!-- shoulders / hoodie -->
      <path d="M20 62C23 50 30 44 40 44C50 44 57 50 60 62Z" fill="${shirtColor}"/>
      <path d="M24 64C27 54 32 50 40 50C48 50 53 54 56 64Z" fill="#0f172a"/>
      <!-- face -->
      <circle cx="40" cy="34" r="16" fill="${skinColor}"/>
      <!-- hair -->
      ${hasLongHair ? `
        <path d="M26 32C26 23 32 18 40 18C48 18 54 22 54 31C49 29 45 28 40 28C35 28 31 29 26 32Z" fill="${hairColor}"/>
        <path d="M28 24C31 21 35 20 40 20C45 20 49 21 52 24C48 23 45 23 40 23C35 23 32 23 28 24Z" fill="${hairColor}"/>
        <path d="M24 30C24 25 28 22 32 22C36 22 40 25 40 30L38 35L36 30Z" fill="${hairColor}"/>
        <path d="M56 30C56 25 52 22 48 22C44 22 40 25 40 30L42 35L44 30Z" fill="${hairColor}"/>
      ` : `
        <path d="M26 32C26 23 32 18 40 18C48 18 54 22 54 31C49 29 45 28 40 28C35 28 31 29 26 32Z" fill="${hairColor}"/>
        <path d="M28 24C31 21 35 20 40 20C45 20 49 21 52 24C48 23 45 23 40 23C35 23 32 23 28 24Z" fill="${hairColor}"/>
      `}
      <!-- eyes -->
      <circle cx="35" cy="34" r="2.2" fill="#111827"/>
      <circle cx="45" cy="34" r="2.2" fill="#111827"/>
      <circle cx="35" cy="33.6" r="0.8" fill="#ffffff"/>
      <circle cx="45" cy="33.6" r="0.8" fill="#ffffff"/>
      <!-- nose -->
      <path d="M40 34L38.5 39H41.5Z" fill="${skinColor}"/>
      <!-- mouth -->
      <path d="M35 41C36.5 43 38.1 44 40 44C41.9 44 43.5 43 45 41" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
};
const MapView = ({ apiKey, groupId }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  // last known user location (even if not in any group)
  const userPosRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [userPos, setUserPos] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  // prefer explicit prop, fall back to Vite env var
  const key = apiKey ?? (import.meta.env.VITE_TOMTOM_KEY as string | undefined);
  
  // Get member locations if in a group
  const memberLocations = useMemberLocations(groupId || null);

  // Refs for route and destination markers
  const destMarkerRef = useRef<any>(null);
  const routeLayerIdRef = useRef<string | null>(null);
  const routeSourceIdRef = useRef<string | null>(null);
  const memberMarkersRef = useRef<Map<string, any>>(new Map());
  const memberRoutesRef = useRef<Map<string, { layerId: string; sourceId: string; outlineLayerId?: string }>>(new Map());
  const memberAvatarsRef = useRef<Map<string, string | null>>(new Map());
  const currentPosForRouteRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const { destination } = useMap();
  const auth = useAuth();
  const activeTripRef = useRef<{ id: string | null }>({ id: null });
  const tripEtaRef = useRef<{ seconds?: number; meters?: number; label?: string }>({});
  // Ensure layers are added only after the map style loads
  const onMapReady = (cb: () => void) => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map) return;
    try {
      const isLoaded = typeof map.isStyleLoaded === "function" ? map.isStyleLoaded() : (map.loaded?.() ?? false);
      if (isLoaded) {
        cb();
      } else if (typeof map.once === "function") {
        map.once("load", cb);
      } else if (typeof map.on === "function") {
        map.on("load", cb);
      } else {
        // last resort: retry shortly
        setTimeout(cb, 250);
      }
    } catch {
      setTimeout(cb, 250);
    }
  };
  // helpers for fallback location
  const setFromMapCenter = () => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map) return;
    try {
      const c = map.getCenter();
      if (c) {
        currentPosForRouteRef.current.lat = c.lat;
        currentPosForRouteRef.current.lng = c.lng;
        setUserPos({ lat: c.lat, lng: c.lng });
      }
    } catch {}
  };
  const setFromLastKnown = () => {
    try {
      const raw = localStorage.getItem("swarm_last_pos");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.lat != null && p?.lng != null) {
          currentPosForRouteRef.current.lat = p.lat;
          currentPosForRouteRef.current.lng = p.lng;
          setUserPos({ lat: p.lat, lng: p.lng });
        }
      }
    } catch {}
  };

  // Helper function to draw route from a location to destination (Uber-like style)
  const drawRoute = async (
    startLat: number,
    startLng: number,
    routeId: string,
    isCurrentUser: boolean = false
  ) => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map || !key || !destination) {
        // Map, key, or destination missing - route cannot be drawn
      return;
    }

      // Ensure map is ready - check if we can access map methods
      if (!map.addSource || !map.addLayer) {
        // Wait a bit and retry if map methods not available
        setTimeout(() => {
          drawRoute(startLat, startLng, routeId, isCurrentUser);
        }, 500);
        return;
      }

    try {
      // Remove previous route for this member if it exists
      const existingRoute = memberRoutesRef.current.get(routeId);
      if (existingRoute) {
        try {
          // Remove outline layer if it exists
          if (existingRoute.outlineLayerId && map.getLayer && map.getLayer(existingRoute.outlineLayerId)) {
            map.removeLayer(existingRoute.outlineLayerId);
          }
          if (map.getLayer && map.getLayer(existingRoute.layerId)) {
            map.removeLayer(existingRoute.layerId);
          }
          if (map.getSource && map.getSource(existingRoute.sourceId)) {
            map.removeSource(existingRoute.sourceId);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Error removing existing route:", e);
        }
        memberRoutesRef.current.delete(routeId);
      }

      const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${destination.lat},${destination.lng}/json?key=${key}&traffic=false`;
      const res = await fetch(routeUrl);
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("Route API error:", res.status, res.statusText);
        return;
      }
      
      const json = await res.json();
      const points = json?.routes?.[0]?.legs?.[0]?.points;
      if (!Array.isArray(points) || points.length === 0) {
        // eslint-disable-next-line no-console
        console.error("No route points returned:", json);
        return;
      }

      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: points.map((p: any) => [p.longitude, p.latitude]),
        },
      } as any;
      const sourceId = `route-source-${routeId}`;
      const layerId = `route-layer-${routeId}`;
      const outlineLayerId = `route-outline-${routeId}`;
      
      try {
        // Add source
        if (map.getSource && map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        map.addSource(sourceId, { type: "geojson", data: geojson });

        if (isCurrentUser) {
          // Uber-like prominent route for current user
          // First add outline/shadow for better visibility (must be added first, drawn behind)
          if (map.getLayer && !map.getLayer(outlineLayerId)) {
            map.addLayer({
              id: outlineLayerId,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": "#FFFFFF",
                "line-width": 10,
                "line-opacity": 0.3,
              },
            });
          }
          // Main route line - thick and prominent (drawn on top)
          if (map.getLayer && !map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": "#3B82F6", // Uber-like blue
                "line-width": 6,
                "line-opacity": 1,
              },
            });
          }
          memberRoutesRef.current.set(routeId, { layerId, sourceId, outlineLayerId });
        } else {
          // Blue route for other members with a thinner style
          if (map.getLayer && !map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "line",
              source: sourceId,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#2563eb", // Blue
                "line-width": 4,
                "line-opacity": 0.9,
              },
            });
          }
          memberRoutesRef.current.set(routeId, { layerId, sourceId });
        }
        // Route drawn successfully
      } catch (layerError) {
        // eslint-disable-next-line no-console
        console.error("Error adding route layers:", layerError);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error drawing route:", e);
    }
  };

  // Realistic avatar element builder (photo URL > emoji/text > generated dicebear > SVG fallback)
  const buildAvatarEl = (seed: string, avatarRaw: string | null | undefined, size: number, self: boolean) => {
    const wrapper = document.createElement("div");
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;
    wrapper.style.borderRadius = "50%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.position = "relative";
    wrapper.style.pointerEvents = "none";
    wrapper.style.background = "#ffffff"; // flat white background
    wrapper.style.border = self ? "3px solid #2563eb" : "3px solid #e2e8f0"; // ring color
    wrapper.style.boxShadow = "0 2px 4px rgba(0,0,0,0.25)";
    wrapper.setAttribute("aria-label", "map avatar");
    wrapper.setAttribute("role", "img");

    const raw = avatarRaw?.trim() || "";
    const isUrl = /^(https?:\/\/|data:)/i.test(raw);
    if (isUrl) {
      const img = document.createElement("img");
      img.src = raw;
      img.alt = "avatar image";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.referrerPolicy = "no-referrer";
      wrapper.appendChild(img);
    } else if (raw && raw.length <= 4) {
      const span = document.createElement("span");
      span.textContent = raw;
      span.style.fontSize = `${Math.round(size * 0.55)}px`;
      span.style.lineHeight = `${size}px`;
      span.style.textAlign = "center";
      span.style.userSelect = "none";
      wrapper.appendChild(span);
    } else {
      // Generate deterministic Dicebear avatar (transparent background)
      try {
        const diceSeed = encodeURIComponent(seed.slice(0, 40));
        const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${diceSeed}&radius=0&backgroundType=none&mouth=smile&eyes=default&top=shortHairShortFlat`;
        const img = document.createElement("img");
        img.src = url;
        img.alt = "generated avatar";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        wrapper.appendChild(img);
      } catch (e) {
        // Fallback unique SVG
        wrapper.innerHTML = generateUniqueAvatar(seed, size);
      }
    }

    // Status dot for current user
    if (self) {
      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.bottom = "4px";
      dot.style.right = "4px";
      dot.style.width = `${Math.round(size * 0.22)}px`;
      dot.style.height = `${Math.round(size * 0.22)}px`;
      dot.style.borderRadius = "50%";
      dot.style.background = "#10b981"; // green
      dot.style.border = "2px solid #ffffff";
      dot.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.08)";
      wrapper.appendChild(dot);
    }
    return wrapper;
  };

  // Self marker builder
  const createUserMarker = (size = 44) => {
    let userId = "user_self";
    try { userId = localStorage.getItem("swarm_user_id") || "user_self"; } catch {}
    const avatarRaw = (auth.profile?.avatar as string | undefined) || (auth.user?.photoURL as string | undefined) || "";
    return buildAvatarEl(userId, avatarRaw, size, true);
  };

  // Member marker builder
  const createMemberMarkerEl = (userId: string, size = 44) => {
    const avatarRaw = memberAvatarsRef.current.get(userId) || "";
    return buildAvatarEl(userId, avatarRaw, size, false);
  };

  useEffect(() => {
    if (!key) return; // nothing to do without an API key

    let isMounted = true;
    const watchIdRef = { id: -1 } as { id: number };
    const userMarkerRef = { marker: null as any };
    // alias ref for readability
    const initialPosRef = userPosRef.current;

    // Request permission and start watching immediately so the browser prompts
    // for location access as soon as the component mounts (before SDK loads).
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted) return;
            initialPosRef.lat = pos.coords.latitude;
            initialPosRef.lng = pos.coords.longitude;
            setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
            setUserPos({ lat, lng });
            try { localStorage.setItem("swarm_last_pos", JSON.stringify({ lat, lng, t: Date.now() })); } catch {}

            // if map has already been initialized, update marker position (don't pan to avoid constant movement)
            const map = (mapContainer.current as any)?.__ttMap;
            if (map) {
              try {
                if (userMarkerRef.marker) {
                  userMarkerRef.marker.setLngLat([lng, lat]);
                } else if ((window as any).tt) {
                  const el = createUserMarker(44);
                  userMarkerRef.marker = new (window as any).tt.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);
                }
                // Don't pan on every location update - only update marker position
                // map.panTo([lng, lat]); // Removed to prevent constant map movement
              } catch (e) {
                // ignore map update errors
              }
            }
            // if we have a destination, redraw route from new position
            if (destination) {
              // fire and forget - will be handled by member routes effect
              currentPosForRouteRef.current.lat = lat;
              currentPosForRouteRef.current.lng = lng;
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
          currentPosForRouteRef.current.lat = lat;
          currentPosForRouteRef.current.lng = lng;
          map.setCenter([lng, lat]);
          // set a closer zoom for live location (street level)
          map.setZoom(15);
          const el = createUserMarker(44);
          const marker = new tt.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          userMarkerRef.marker = marker;
        }

        // store map instance for cleanup
        (mapContainer.current as any).__ttMap = map;
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

    // As a fallback, try to restore last known position immediately if geolocation is blocked
    try {
      if (initialPosRef.lat == null || initialPosRef.lng == null) {
        const raw = localStorage.getItem("swarm_last_pos");
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.lat != null && p?.lng != null) {
            initialPosRef.lat = p.lat;
            initialPosRef.lng = p.lng;
            setUserPos({ lat: p.lat, lng: p.lng });
          }
        }
      }
    } catch {}

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

  // subscribe to group document to get destination (if set on group)
  const [groupDestination, setGroupDestination] = useState<any | null>(null);
  useEffect(() => {
    if (!groupId) {
      setGroupDestination(null);
      return;
    }
    const unsub = subscribeToGroup(groupId, (g) => {
      if (!g) return setGroupDestination(null);
      setGroupDestination((g as any).destination ?? null);
    });
    return () => unsub();
  }, [groupId]);

  // note: `destination` is already obtained earlier from MapContext; do not redeclare here

  // member markers + routes (supports single group or all groups when groupId is undefined)
  useEffect(() => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map) return;

    const memberMarkers = new Map<string, any>();
    const memberRouteIds = new Set<string>();
    const subscriptions: Array<() => void> = [];

    const handleMembers = (members: Array<{ id: string } & any>) => {
      // update or add markers
      const dest = (groupDestination as any) ?? (destination as any);
      members.forEach((m) => {
        try {
          const id = m.id;
          const lat = Number(m.lat);
          const lng = Number(m.lng);
          if (!isFinite(lat) || !isFinite(lng)) return;

          // marker
          let marker = memberMarkers.get(id);
          if (!marker) {
            const el = createMemberMarkerEl(id, 44);
            marker = new (window as any).tt.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);
            try {
              const popup = new (window as any).tt.Popup({ offset: 12 }).setHTML(
                `<div style="min-width:140px"><strong>${(m.name || id)}</strong><div style="font-size:12px;color:#374151">${m.description || ""}</div></div>`
              );
              marker.setPopup(popup);
            } catch (e) { }
            memberMarkers.set(id, marker);
          } else {
            marker.setLngLat([lng, lat]);
          }

          // draw route to destination (try real routing via TomTom SDK/REST; fallback to straight line)
          if (dest && dest.lat != null && dest.lng != null) {
            const routeId = `route-${id}`;
            const srcId = `src-${routeId}`;

            const cacheKey = `${lat},${lng}->${dest.lat},${dest.lng}`;
            // store route cache on map container to avoid repeated requests
            const mapState = (mapContainer.current as any).__routeCache ||= { routes: new Map<string, any>() };

            const drawGeoJSON = (coords: Array<[number, number]>) => {
              const line = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
              onMapReady(() => {
                try {
                  if (map.getLayer(`layer-${routeId}`)) {
                    try { map.removeLayer(`layer-${routeId}`); } catch (e) { }
                  }
                  if (map.getLayer(`layer-outline-${routeId}`)) {
                    try { map.removeLayer(`layer-outline-${routeId}`); } catch (e) { }
                  }
                  if (map.getSource(srcId)) {
                    try { map.removeSource(srcId); } catch (e) { }
                  }
                  map.addSource(srcId, { type: "geojson", data: { type: "FeatureCollection", features: [line] } });
                  // outline for contrast
                  map.addLayer({
                    id: `layer-outline-${routeId}`,
                    type: "line",
                    source: srcId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#185ADB", "line-width": 8, "line-opacity": 0.75 }
                  });
                  // inner blue route
                  map.addLayer({
                    id: `layer-${routeId}`,
                    type: "line",
                    source: srcId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#1A73E8", "line-width": 5, "line-opacity": 1 }
                  });

                  // Avoid fitting bounds for every member route to keep map stable
                  memberRouteIds.add(routeId);
                } catch (e) {
                  // ignore draw errors
                }
              });
            };

            const tryDraw = async () => {
              // if cached, draw from cache
              if (mapState.routes.has(cacheKey)) {
                const coords = mapState.routes.get(cacheKey);
                drawGeoJSON(coords);
                return;
              }

              // try TomTom SDK service first
              try {
                const tt = (window as any).tt;
                if (tt && tt.services && typeof tt.services.calculateRoute === "function") {
                  const req = {
                    key,
                    locations: [`${lat},${lng}`, `${dest.lat},${dest.lng}`],
                    travelMode: "car",
                    alternatives: false,
                    computeBestOrder: false,
                  };
                  const res = await tt.services.calculateRoute(req);
                  // try to extract coordinates from response
                  const rcoords: Array<[number, number]> = [];
                  try {
                    const route = res?.routes?.[0];
                    if (route?.legs) {
                      route.legs.forEach((leg: any) => {
                        if (leg && leg.points) {
                          leg.points.forEach((p: any) => rcoords.push([p.longitude ?? p.lng ?? p.lon ?? p[1], p.latitude ?? p.lat ?? p[0]]));
                        }
                        if (leg && leg.points === undefined && leg.pointsEncoded) {
                          // fallback: if encoded polyline present, try to decode — skipping here
                        }
                      });
                    }
                  } catch (e) { }
                  if (rcoords.length) {
                    mapState.routes.set(cacheKey, rcoords);
                    drawGeoJSON(rcoords);
                    return;
                  }
                }
              } catch (e) {
                // ignore SDK routing errors
              }

              // fallback to TomTom REST routing
              if (key) {
                try {
                  const url = `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lng}:${dest.lat},${dest.lng}/json?key=${key}&routeType=fastest&traffic=false`;
                  const r = await fetch(url);
                  if (r.ok) {
                    const j = await r.json();
                    const coords: Array<[number, number]> = [];
                    try {
                      const route = j?.routes?.[0];
                      if (route && route.legs) {
                        route.legs.forEach((leg: any) => {
                          if (leg.points) {
                            leg.points.forEach((p: any) => coords.push([p.lon ?? p[1], p.lat ?? p[0]]));
                          }
                        });
                      }
                    } catch (e) { }
                    if (coords.length) {
                      mapState.routes.set(cacheKey, coords);
                      drawGeoJSON(coords);
                      return;
                    }
                  }
                } catch (e) {
                  // ignore REST errors
                }
              }

              // final fallback: straight line
              drawGeoJSON([[lng, lat], [dest.lng, dest.lat]]);
            };

            // fire and forget
            tryDraw();
          }
        } catch (e) { }
      });

      // remove markers for members no longer present
      const currentIds = new Set(members.map((m) => m.id));
      for (const [id, marker] of Array.from(memberMarkers.entries())) {
        if (!currentIds.has(id)) {
          try {
            marker.remove();
          } catch (e) { }
          memberMarkers.delete(id);
          const routeId = `route-${id}`;
          const srcId = `src-${routeId}`;
          try {
            if (map.getLayer(`layer-${routeId}`)) map.removeLayer(`layer-${routeId}`);
            if (map.getLayer(`layer-outline-${routeId}`)) map.removeLayer(`layer-outline-${routeId}`);
            if (map.getSource(srcId)) map.removeSource(srcId);
            memberRouteIds.delete(routeId);
          } catch (e) { }
        }
      }
    };

    let unsubAll: (() => void) | undefined;
    if (groupId) {
      const unsub = subscribeToMemberLocations(groupId, handleMembers);
      subscriptions.push(unsub);
      // subscribe to member profiles to get avatars
      const unsubProfiles = subscribeToMembers(groupId, (profiles) => {
        profiles.forEach((p) => {
          memberAvatarsRef.current.set(p.userId, p.avatar ?? null);
        });
      });
      subscriptions.push(unsubProfiles);
    } else {
      // No specific group: subscribe to all groups and then each group's members
      unsubAll = subscribeToGroups((groups) => {
        // cleanup previous subscriptions
        subscriptions.forEach((fn) => {
          try { fn(); } catch (e) {}
        });
        subscriptions.length = 0;

        groups.forEach((g) => {
          if (!g.id) return;
          const unsubMembers = subscribeToMemberLocations(g.id, handleMembers);
          subscriptions.push(unsubMembers);
        });
      });
    }

    return () => {
      try { unsubAll && unsubAll(); } catch (e) {}
      subscriptions.forEach((fn) => {
        try { fn(); } catch (e) {}
      });
      // cleanup markers and layers
      for (const marker of memberMarkers.values()) {
        try {
          marker.remove();
        } catch (e) { }
      }
      for (const rid of memberRouteIds) {
        try {
          if (map.getLayer(`layer-${rid}`)) map.removeLayer(`layer-${rid}`);
          if (map.getLayer(`layer-outline-${rid}`)) map.removeLayer(`layer-outline-${rid}`);
          const srcId = `src-${rid}`;
          if (map.getSource(srcId)) map.removeSource(srcId);
        } catch (e) { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, groupDestination, destination]);

  // draw a personal route (blue, like Google Maps) between the viewer's live
  // location and the active destination, even if there are no group members.
  useEffect(() => {
    const map = (mapContainer.current as any)?.__ttMap;
    // Allow straight-line fallback even without a TomTom key
    if (!map) return;

    const dest = (groupDestination as any) ?? (destination as any);
    const user = userPos;
    if (!dest || dest.lat == null || dest.lng == null) return;
    if (user.lat == null || user.lng == null) return;

    const lat = user.lat;
    const lng = user.lng;
    const routeId = "self-route";
    const srcId = "self-src";

    const mapState = (mapContainer.current as any).__routeCache ||= { routes: new Map<string, any>() };
    const cacheKey = `self:${lat},${lng}->${dest.lat},${dest.lng}`;

    const drawGeoJSON = (coords: Array<[number, number]>) => {
      const line = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
      onMapReady(() => {
        try {
          if (map.getLayer(`layer-${routeId}`)) {
            try { map.removeLayer(`layer-${routeId}`); } catch (e) {}
          }
          if (map.getLayer(`layer-outline-${routeId}`)) {
            try { map.removeLayer(`layer-outline-${routeId}`); } catch (e) {}
          }
          if (map.getSource(srcId)) {
            try { map.removeSource(srcId); } catch (e) {}
          }
          map.addSource(srcId, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [line] },
          });
          // outline
          map.addLayer({
            id: `layer-outline-${routeId}`,
            type: "line",
            source: srcId,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#1e3a8a", "line-width": 8, "line-opacity": 0.6 },
          });
          // main blue route
          map.addLayer({
            id: `layer-${routeId}`,
            type: "line",
            source: srcId,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 1 },
          });

          // Zoom once on first self route to avoid jitter
          try {
            const state = ((mapContainer.current as any).__selfFitDone ||= { done: false });
            if (!state.done) {
              const lats = coords.map((c) => c[1]);
              const lngs = coords.map((c) => c[0]);
              const south = Math.min(...lats);
              const north = Math.max(...lats);
              const west = Math.min(...lngs);
              const east = Math.max(...lngs);
              map.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 16 });
              state.done = true;
            }
          } catch (e) {}
        } catch (e) {
          // ignore draw errors
        }
      });
    };

    const fetchAndDraw = async () => {
      // cached route
      if (mapState.routes.has(cacheKey)) {
        const coords = mapState.routes.get(cacheKey);
        drawGeoJSON(coords);
        return;
      }

      // try TomTom SDK if key available
      if (key) {
        try {
          const tt = (window as any).tt;
          if (tt && tt.services && typeof tt.services.calculateRoute === "function") {
            const req = {
              key,
              locations: [`${lat},${lng}`, `${dest.lat},${dest.lng}`],
              travelMode: "car",
              alternatives: false,
              computeBestOrder: false,
            };
            const res = await tt.services.calculateRoute(req);
            const coords: Array<[number, number]> = [];
            try {
              const route = res?.routes?.[0];
              if (route?.legs) {
                route.legs.forEach((leg: any) => {
                  if (leg && leg.points) {
                    leg.points.forEach((p: any) =>
                      coords.push([p.longitude ?? p.lng ?? p.lon ?? p[1], p.latitude ?? p.lat ?? p[0]])
                    );
                  }
                });
              }
              // Extract ETA/distance from SDK response
              const summary = route?.summary || res?.summary;
              if (summary) {
                const seconds = Number(summary.travelTimeInSeconds ?? summary.travelTime);
                const meters = Number(summary.lengthInMeters ?? summary.length);
                tripEtaRef.current.seconds = isFinite(seconds) ? seconds : undefined;
                tripEtaRef.current.meters = isFinite(meters) ? meters : undefined;
                tripEtaRef.current.label = dest.label;
              }
            } catch (e) {}
            if (coords.length) {
              mapState.routes.set(cacheKey, coords);
              drawGeoJSON(coords);
              return;
            }
          }
        } catch (e) {
          // ignore SDK errors
        }
      }

      // fallback REST call
      if (key) {
        try {
          const url = `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lng}:${dest.lat},${dest.lng}/json?key=${key}&routeType=fastest&traffic=false`;
          const r = await fetch(url);
          if (r.ok) {
            const j = await r.json();
            const coords: Array<[number, number]> = [];
            try {
              const route = j?.routes?.[0];
              if (route && route.legs) {
                route.legs.forEach((leg: any) => {
                  if (leg.points) {
                    leg.points.forEach((p: any) => coords.push([p.lon ?? p[1], p.lat ?? p[0]]));
                  }
                });
              }
              // Extract ETA/distance from REST response
              const summary = route?.summary;
              if (summary) {
                const seconds = Number(summary.travelTimeInSeconds ?? summary.travelTime);
                const meters = Number(summary.lengthInMeters ?? summary.length);
                tripEtaRef.current.seconds = isFinite(seconds) ? seconds : undefined;
                tripEtaRef.current.meters = isFinite(meters) ? meters : undefined;
                tripEtaRef.current.label = dest.label;
              }
            } catch (e) {}
            if (coords.length) {
              mapState.routes.set(cacheKey, coords);
              drawGeoJSON(coords);
              return;
            }
          }
        } catch (e) {
          // ignore REST errors
        }
      }

      // straight-line fallback
      drawGeoJSON([[lng, lat], [dest.lng, dest.lat]]);
    };

    (async () => {
      // Auto-start trip when first routing attempt is made and no active trip
      try {
        const uid = auth.user?.uid || localStorage.getItem("swarm_user_id") || "";
        // restore active trip from localStorage if available
        const tripKey = uid ? `swarm_active_trip_${uid}_${groupId ?? 'none'}` : '';
        if (tripKey && !activeTripRef.current.id) {
          const storedId = localStorage.getItem(tripKey);
          if (storedId) {
            activeTripRef.current.id = storedId;
          }
        }
        if (uid && !activeTripRef.current.id) {
          const tripId = await logTripStart(uid, groupId ?? null, { lat: dest.lat, lng: dest.lng, label: dest.label });
          activeTripRef.current.id = tripId;
          try { if (tripKey) localStorage.setItem(tripKey, tripId); } catch {}
        }
      } catch (e) { }
      await fetchAndDraw();
    })();

    return () => {
      try {
        if (map.getLayer(`layer-${routeId}`)) map.removeLayer(`layer-${routeId}`);
        if (map.getLayer(`layer-outline-${routeId}`)) map.removeLayer(`layer-outline-${routeId}`);
        if (map.getSource(srcId)) map.removeSource(srcId);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupDestination, destination, key, userPos.lat, userPos.lng]);

  // Detect arrival near destination and auto-complete active trip
  useEffect(() => {
    const dest = (groupDestination as any) ?? (destination as any);
    if (!dest || dest.lat == null || dest.lng == null) return;
    if (userPos.lat == null || userPos.lng == null) return;

    // Haversine distance in meters
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(dest.lat - (userPos.lat as number));
    const dLng = toRad(dest.lng - (userPos.lng as number));
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userPos.lat as number)) * Math.cos(toRad(dest.lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const ARRIVAL_THRESHOLD_METERS = 50; // consider arrived within 50m
    if (distance <= ARRIVAL_THRESHOLD_METERS && activeTripRef.current.id) {
      (async () => {
        try {
          await logTripComplete(activeTripRef.current.id as string);
        } catch (e) { }
        // clear active trip and persisted key
        const uid = auth.user?.uid || localStorage.getItem("swarm_user_id") || "";
        const tripKey = uid ? `swarm_active_trip_${uid}_${groupId ?? 'none'}` : '';
        activeTripRef.current.id = null;
        try { if (tripKey) localStorage.removeItem(tripKey); } catch {}
      })();
    }
  }, [groupDestination, destination, userPos.lat, userPos.lng]);

  // On mount, try to restore active trip from localStorage to keep state across refresh
  useEffect(() => {
    const uid = auth.user?.uid || localStorage.getItem("swarm_user_id") || "";
    const tripKey = uid ? `swarm_active_trip_${uid}_${groupId ?? 'none'}` : '';
    if (tripKey && !activeTripRef.current.id) {
      try {
        const storedId = localStorage.getItem(tripKey);
        if (storedId) activeTripRef.current.id = storedId;
      } catch {}
    }
  }, [auth.user?.uid, groupId]);

  // destination marker handling
  // destination marker handling (destMarkerRef is declared earlier)

  // when destination (group or context) changes, draw persistent marker
  useEffect(() => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map) return;

    // clear old marker
    if (destMarkerRef.current && typeof destMarkerRef.current.remove === "function") {
      try {
        destMarkerRef.current.remove();
      } catch (e) { }
      destMarkerRef.current = null;
    }

    const dest = (groupDestination as any) ?? (destination as any);
    if (dest && dest.lat != null && dest.lng != null) {
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
          .setLngLat([dest.lng, dest.lat])
          .addTo(map);
        // Do not pan to destination automatically to keep map stable
      } catch (e) {
        // ignore marker draw errors
      }
      // Route will be drawn by member routes effect when member locations are available
    }
  }, [destination, groupDestination]);

  return (
    <div className="w-full h-full relative bg-muted/20">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Active trip indicator and ETA */}
      <div className="absolute top-3 left-3 z-10">
        {(activeTripRef.current.id || tripEtaRef.current.seconds || tripEtaRef.current.meters) && (
          <div className="px-3 py-2 rounded-md bg-white/90 shadow border text-sm">
            {activeTripRef.current.id && <div className="font-medium mb-1">Trip Active</div>}
            {tripEtaRef.current.label && (
              <div className="text-xs text-muted-foreground mb-1">To: {tripEtaRef.current.label}</div>
            )}
            {tripEtaRef.current.seconds != null && (
              <div>ETA: {Math.max(1, Math.round((tripEtaRef.current.seconds as number) / 60))} min</div>
            )}
            {tripEtaRef.current.meters != null && (
              <div>Distance: {((tripEtaRef.current.meters as number) / 1000).toFixed(1)} km</div>
            )}
          </div>
        )}
      </div>
      {/* Guidance overlay when route cannot render */}
      <div className="absolute bottom-3 left-3 z-10">
        {(!((groupDestination ?? destination)?.lat != null && (groupDestination ?? destination)?.lng != null) || (userPos.lat == null || userPos.lng == null)) && (
          <div className="px-3 py-2 rounded-md bg-white/90 shadow border text-sm max-w-[320px]">
            {(!((groupDestination ?? destination)?.lat != null && (groupDestination ?? destination)?.lng != null)) && (
              <div className="mb-2"><span className="font-medium">No destination set.</span> Use the search box to choose a place.</div>
            )}
            {(userPos.lat == null || userPos.lng == null) && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Location is unavailable. Allow location access or pick a fallback:</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 text-xs rounded border bg-blue-600 text-white hover:bg-blue-700" onClick={setFromMapCenter}>Use map center</button>
                  <button className="px-2 py-1 text-xs rounded border hover:bg-muted" onClick={setFromLastKnown}>Use last known</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
