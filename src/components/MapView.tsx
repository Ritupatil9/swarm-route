import { useEffect, useRef, useState } from "react";
// removed candidate UI; keep only map and destination marker
import { useMap } from "@/contexts/MapContext";
import { useMemberLocations, MemberLocation } from "@/hooks/useMemberLocation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  /** TomTom API key. If not provided, `VITE_TOMTOM_KEY` will be used. */
  apiKey?: string;
  /** Group ID to show member locations */
  groupId?: string | null;
};

const TOMTOM_CSS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css";
const TOMTOM_JS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js";

const MapView = ({ apiKey, groupId }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);

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
  const currentPosForRouteRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const { destination } = useMap();

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
          // Subtle route for other members
          if (map.getLayer && !map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "line",
              source: sourceId,
              paint: {
                "line-color": "#60A5FA", // Lighter blue
                "line-width": 3,
                "line-opacity": 0.5,
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
            currentPosForRouteRef.current.lat = lat;
            currentPosForRouteRef.current.lng = lng;

            // if map has already been initialized, update marker position (don't pan to avoid constant movement)
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
          const el = createSnapMarker(36);
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

  // Helper to create member marker
  const createMemberMarker = (name?: string, isCurrentUser = false) => {
    const el = document.createElement("div");
    el.style.width = `32px`;
    el.style.height = `32px`;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.pointerEvents = "none";
    const color = isCurrentUser ? "#10B981" : "#3B82F6"; // Green for current user, blue for others
    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.029 0 3 4.03 3 9.01c0 6.075 8.142 15.558 8.59 16.04.19.208.45.32.71.32.26 0 .52-.112.71-.32.448-.482 8.59-9.965 8.59-16.04C21 4.03 16.971 0 12 0z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="3.25" fill="#FFFFFF" stroke="${color}" stroke-width="0.75"/>
      </svg>
    `;
    if (name) {
      el.title = name;
    }
    return el;
  };

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
        // Only center map on destination if it's the first time setting destination
        // Don't pan constantly - let user control the map view
        // map.panTo([destination.lng, destination.lat]); // Removed to prevent constant movement
      } catch (e) {
        // ignore marker draw errors
      }
      // Route will be drawn by member routes effect when member locations are available
    }
  }, [destination, key]);

  // Handle member location markers and routes
  const { user } = useAuth();
  useEffect(() => {
    const map = (mapContainer.current as any)?.__ttMap;
    if (!map || !(window as any).tt) return;

    // Get current user ID (prefer auth user, fallback to local storage)
    const currentUserId = user?.uid || localStorage.getItem("swarm_user_id") || "";

    // Remove markers and routes for locations that no longer exist
    const currentMemberIds = new Set(memberLocations.map((loc) => loc.userId));
    memberMarkersRef.current.forEach((marker, userId) => {
      if (!currentMemberIds.has(userId)) {
        try {
          marker.remove();
        } catch (e) {
          // ignore
        }
        memberMarkersRef.current.delete(userId);
      }
    });

    // Remove routes for members that no longer exist
    memberRoutesRef.current.forEach((route, userId) => {
      if (!currentMemberIds.has(userId)) {
        try {
          // Remove outline layer if it exists (for current user's route)
          if (route.outlineLayerId && map.getLayer && map.getLayer(route.outlineLayerId)) {
            map.removeLayer(route.outlineLayerId);
          }
          if (map.getLayer && map.getLayer(route.layerId)) {
            map.removeLayer(route.layerId);
          }
          if (map.getSource && map.getSource(route.sourceId)) {
            map.removeSource(route.sourceId);
          }
        } catch (e) {
          // ignore cleanup errors
        }
        memberRoutesRef.current.delete(userId);
      }
    });

    // Add or update markers and routes for current locations
    memberLocations.forEach((location) => {
      const isCurrentUser = location.userId === currentUserId;
      let marker = memberMarkersRef.current.get(location.userId);

      if (marker) {
        // Update existing marker position
        try {
          marker.setLngLat([location.lng, location.lat]);
        } catch (e) {
          // If update fails, remove and recreate
          try {
            marker.remove();
          } catch (e) {
            // ignore
          }
          marker = null;
        }
      }

      if (!marker) {
        // Create new marker
        try {
          const el = createMemberMarker(location.name, isCurrentUser);
          marker = new (window as any).tt.Marker({ element: el })
            .setLngLat([location.lng, location.lat])
            .addTo(map);
          memberMarkersRef.current.set(location.userId, marker);
        } catch (e) {
          // ignore marker creation errors
        }
      }

      // Draw route from member location to destination (Uber-like style)
      if (destination && typeof location.lat === 'number' && typeof location.lng === 'number' && 
          !isNaN(location.lat) && !isNaN(location.lng)) {
        drawRoute(location.lat, location.lng, location.userId, isCurrentUser).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("Error drawing route for member:", location.userId, err);
        });
      }
    });
  }, [memberLocations, user?.uid, destination, key]);

  return (
    <div className="w-full h-full relative bg-muted/20">
      <div ref={mapContainer} className="w-full h-full" />

      {/* candidate UI removed; destination now set via search input */}
    </div>
  );
};

export default MapView;
