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

export type MemberLocation = {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
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

export async function addMember(groupId: string, userId: string) {
  const ref = doc(db, "groups", groupId);
  await updateDoc(ref, {
    members: arrayUnion(userId),
  });
}

<<<<<<< HEAD
export async function updateMemberLocation(
  groupId: string,
  userId: string,
  payload: { lat: number; lng: number; name?: string; description?: string; avatar?: string }
) {
  const ref = doc(db, "groups", groupId, "members", userId);
  await setDoc(
    ref,
    {
      lat: payload.lat,
      lng: payload.lng,
      name: payload.name ?? userId,
      description: payload.description ?? null,
      avatar: payload.avatar ?? null,
      updatedAt: serverTimestamp(),
=======
// Update member location in real-time
export async function updateMemberLocation(
  groupId: string,
  userId: string,
  location: { lat: number; lng: number },
  userName?: string
) {
  const locationRef = doc(db, "groups", groupId, "memberLocations", userId);
  await setDoc(
    locationRef,
    {
      userId,
      lat: location.lat,
      lng: location.lng,
      timestamp: serverTimestamp(),
      name: userName || userId,
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
    },
    { merge: true }
  );
}

<<<<<<< HEAD
export function subscribeToMemberLocations(
  groupId: string,
  cb: (members: Array<{ id: string } & DocumentData>) => void
) {
  const col = collection(db, "groups", groupId, "members");
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));
    cb(items);
=======
// Subscribe to all member locations in a group
export function subscribeToMemberLocations(
  groupId: string,
  cb: (locations: MemberLocation[]) => void
) {
  const locationsRef = collection(db, "groups", groupId, "memberLocations");
  return onSnapshot(locationsRef, (snapshot) => {
    const locations: MemberLocation[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        userId: data.userId || doc.id,
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp?.toMillis?.() || data.timestamp || Date.now(),
        name: data.name,
      });
    });
    cb(locations);
  });
}

// Update group destination (admin only)
export async function updateGroupDestination(
  groupId: string,
  destination: DestinationObject
) {
  const ref = doc(db, "groups", groupId);
  await updateDoc(ref, {
    destination,
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
  });
}
