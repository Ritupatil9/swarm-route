import React, { useEffect, useRef } from "react";
import { updateMemberLocation, subscribeToMemberLocations, MemberLocation } from "@/lib/groups";
import { useAuth } from "./useAuth";

/**
 * Hook to track and update member locations in a group
 */
export function useMemberLocation(groupId: string | null) {
  const { user, profile } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (!groupId || !navigator.geolocation) return;

    const userId = user?.uid || localStorage.getItem("swarm_user_id") || "anonymous";
    const userName = profile?.name || user?.displayName || userId;

    // Start tracking location
    if (!isTrackingRef.current) {
      isTrackingRef.current = true;
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateMemberLocation(groupId, userId, { lat: latitude, lng: longitude }, userName).catch(
            (err) => {
              // eslint-disable-next-line no-console
              console.error("Failed to update location:", err);
            }
          );
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000,
        }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        isTrackingRef.current = false;
      }
    };
  }, [groupId, user?.uid, profile?.name, user?.displayName]);
}

/**
 * Hook to subscribe to all member locations in a group
 */
export function useMemberLocations(
  groupId: string | null,
  onLocationsUpdate?: (locations: MemberLocation[]) => void
) {
  const [locations, setLocations] = React.useState<MemberLocation[]>([]);

  useEffect(() => {
    if (!groupId) {
      setLocations([]);
      return;
    }

    const unsubscribe = subscribeToMemberLocations(groupId, (newLocations) => {
      setLocations(newLocations);
      if (onLocationsUpdate) {
        onLocationsUpdate(newLocations);
      }
    });

    return () => unsubscribe();
  }, [groupId, onLocationsUpdate]);

  return locations;
}

