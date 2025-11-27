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
} from "firebase/firestore";
import { db } from "./firebase";

export type Group = {
  id?: string;
  name: string;
  destination?: string;
  createdAt?: any;
  creatorId?: string | null;
  members?: string[];
};

const groupsCol = () => collection(db, "groups");

export async function createGroup(payload: { name: string; destination?: string; creatorId?: string | null }) {
  const ref = await addDoc(groupsCol(), {
    name: payload.name,
    destination: payload.destination ?? null,
    creatorId: payload.creatorId ?? null,
    members: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getGroup(groupId: string) {
  const d = await getDoc(doc(db, "groups", groupId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as DocumentData) } as Group;
}

export function subscribeToGroup(groupId: string, cb: (g: Group | null) => void) {
  const ref = doc(db, "groups", groupId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as DocumentData) } as Group);
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
