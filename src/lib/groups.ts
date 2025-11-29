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

export type Group = {
  id?: string;
  name: string;
  // Destination can be a legacy string or a structured object with coordinates
  destination?: string | DestinationObject | null;
  createdAt?: any;
  creatorId?: string | null;
  members?: string[];
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
    },
    { merge: true }
  );
}

export function subscribeToMemberLocations(
  groupId: string,
  cb: (members: Array<{ id: string } & DocumentData>) => void
) {
  const col = collection(db, "groups", groupId, "members");
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));
    cb(items);
  });
}
