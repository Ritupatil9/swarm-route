import { useEffect, useRef, useState } from "react";
// removed candidate UI; keep only map and destination marker
import { useMap } from "@/contexts/MapContext";
import { subscribeToMemberLocations, subscribeToGroup, subscribeToGroups } from "@/lib/groups";

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

  // create a custom marker element with unique avatar
  const createUserMarker = (size = 44) => {
    // Get user ID from localStorage
    let userId = "user_self";
    try {
      userId = localStorage.getItem("swarm_user_id") || "user_self";
    } catch (e) {}
    
    const el = document.createElement("div");
    el.style.minWidth = `${size}px`;
    el.style.height = `${size}px`;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.borderRadius = "999px";
    el.style.pointerEvents = "none";
    el.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.95), 0 10px 16px rgba(15,23,42,0.4)";
    el.innerHTML = generateUniqueAvatar(userId, size);
    return el;
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

            // if map has already been initialized, update marker/pan immediately
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

  // expose map-wide destination from context for route drawing
  const { destination } = useMap();

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
            const el = document.createElement("div");
            el.style.minWidth = "44px";
            el.style.height = "44px";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.borderRadius = "999px";
            el.style.pointerEvents = "none";
            el.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.95), 0 10px 16px rgba(15,23,42,0.4)";

            // Generate unique avatar based on member ID (each user gets different colors/features)
            el.innerHTML = generateUniqueAvatar(id, 40);
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

                // fit map to route bounds for a better view
                try {
                  const lats = coords.map((c) => c[1]);
                  const lngs = coords.map((c) => c[0]);
                  const south = Math.min(...lats);
                  const north = Math.max(...lats);
                  const west = Math.min(...lngs);
                  const east = Math.max(...lngs);
                  map.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 16 });
                } catch (e) { }
                memberRouteIds.add(routeId);
              } catch (e) {
                // ignore draw errors
              }
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
    if (!map || !key) return;

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

        // zoom to route
        try {
          const lats = coords.map((c) => c[1]);
          const lngs = coords.map((c) => c[0]);
          const south = Math.min(...lats);
          const north = Math.max(...lats);
          const west = Math.min(...lngs);
          const east = Math.max(...lngs);
          map.fitBounds([[west, south], [east, north]], { padding: 60, maxZoom: 16 });
        } catch (e) {}
      } catch (e) {
        // ignore draw errors
      }
    };

    const fetchAndDraw = async () => {
      // cached route
      if (mapState.routes.has(cacheKey)) {
        const coords = mapState.routes.get(cacheKey);
        drawGeoJSON(coords);
        return;
      }

      // try TomTom SDK
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

      // fallback REST call
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

      // straight-line fallback
      drawGeoJSON([[lng, lat], [dest.lng, dest.lat]]);
    };

    fetchAndDraw();

    return () => {
      try {
        if (map.getLayer(`layer-${routeId}`)) map.removeLayer(`layer-${routeId}`);
        if (map.getLayer(`layer-outline-${routeId}`)) map.removeLayer(`layer-outline-${routeId}`);
        if (map.getSource(srcId)) map.removeSource(srcId);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupDestination, destination, key, userPos.lat, userPos.lng]);

  // destination marker handling
  const destMarkerRef = useRef<any>(null);


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
        // center map toward destination
        map.panTo([dest.lng, dest.lat]);
      } catch (e) {
        // ignore marker draw errors
      }
    }
  }, [destination, groupDestination]);

  return (
    <div className="w-full h-full relative bg-muted/20">
      <div ref={mapContainer} className="w-full h-full" />

      {/* candidate UI removed; destination now set via search input */}
    </div>
  );
};

export default MapView;
