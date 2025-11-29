import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
  getDocs,
  DocumentData,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type DestinationObject = {
  lat: number;
  lng: number;
  label?: string;
};

// Simple member location type used by UI
export type MemberLocation = {
  id: string; // convenience id (same as userId)
  userId: string;
  lat: number;
  lng: number;
  timestamp?: number;
  name?: string;
};

export type Group = {
  id?: string;
  name: string;
  // Destination can be a legacy string or a structured object with coordinates
  destination?: string | DestinationObject | null;
  createdAt?: any;
  creatorId?: string | null;
  members?: string[];
  code?: string;
};

export type MemberProfile = {
  userId: string;
  name?: string | null;
  avatar?: string | null;
  joinedAt?: any;
};

const groupsCol = () => collection(db, "groups");

function generateCode(length = 6) {
  // simple alphanumeric uppercase code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createGroup(payload: { name: string; destination?: string | DestinationObject; creatorId?: string | null }) {
  // generate a short join code
  const code = generateCode(6);
  const ref = await addDoc(groupsCol(), {
    name: payload.name,
    destination: payload.destination ?? null,
    creatorId: payload.creatorId ?? null,
    members: [],
    code,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, code };
}

export async function getGroup(groupId: string) {
  const d = await getDoc(doc(db, "groups", groupId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as DocumentData) } as Group;
}

export async function getGroupByCode(code: string) {
  const q = query(groupsCol(), where("code", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as DocumentData) } as Group;
}

export function subscribeToGroup(groupId: string, cb: (g: Group | null) => void) {
  const ref = doc(db, "groups", groupId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as DocumentData) } as Group);
  });
}

export function subscribeToGroups(cb: (groups: Group[]) => void) {
  const col = collection(db, "groups");
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Group));
    cb(items);
  });
}

export async function listGroupsByCreator(creatorId: string) {
  const q = query(groupsCol(), where("creatorId", "==", creatorId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as Group));
}

// Add or update a member profile and ensure membership without duplication
export async function addMember(
  groupId: string,
  userId: string,
  opts?: { name?: string; avatar?: string }
) {
  const groupRef = doc(db, "groups", groupId);
  // Ensure userId is present in group.members (arrayUnion deduplicates)
  await updateDoc(groupRef, { members: arrayUnion(userId) });

  // Store/refresh member profile in a subcollection
  const memberRef = doc(db, "groups", groupId, "members", userId);
  await setDoc(
    memberRef,
    {
      userId,
      name: opts?.name || userId,
      avatar: opts?.avatar || null,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateMemberLocation(
  groupId: string,
  userId: string,
  location: { lat: number; lng: number },
  userName?: string
) {
  const ref = doc(db, "groups", groupId, "memberLocations", userId);
  await setDoc(
    ref,
    {
      userId,
      lat: location.lat,
      lng: location.lng,
      timestamp: serverTimestamp(),
      name: userName || userId,
    },
    { merge: true }
  );
}

export function subscribeToMemberLocations(
  groupId: string,
  cb: (locations: MemberLocation[]) => void
) {
  const colRef = collection(db, "groups", groupId, "memberLocations");
  return onSnapshot(colRef, (snap) => {
    const items: MemberLocation[] = snap.docs.map((d) => {
      const data = d.data() as DocumentData;
      return {
        id: d.id,
        userId: (data.userId as string) || d.id,
        lat: Number(data.lat),
        lng: Number(data.lng),
        timestamp: data.timestamp?.toMillis?.() || data.timestamp || Date.now(),
        name: data.name as string | undefined,
      };
    });
    cb(items);
  });
}

// Subscribe to member profiles for a group
export function subscribeToMembers(
  groupId: string,
  cb: (profiles: MemberProfile[]) => void
) {
  const colRef = collection(db, "groups", groupId, "members");
  return onSnapshot(colRef, (snap) => {
    const items: MemberProfile[] = snap.docs.map((d) => {
      const data = d.data() as DocumentData;
      return {
        userId: (data.userId as string) || d.id,
        name: (data.name as string) ?? null,
        avatar: (data.avatar as string) ?? null,
        joinedAt: data.joinedAt,
      };
    });
    cb(items);
  });
}

// Update group destination (admin only)
export async function updateGroupDestination(
  groupId: string,
  destination: DestinationObject
) {
  const ref = doc(db, "groups", groupId);
  await updateDoc(ref, { destination });
}
