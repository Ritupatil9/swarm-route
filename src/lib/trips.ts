import { collection, doc, addDoc, onSnapshot, query, where, serverTimestamp, getDocs, updateDoc, setDoc, DocumentData } from "firebase/firestore";
import { db } from "./firebase";

export type TripRecord = {
  id?: string;
  userId: string;
  groupId?: string | null;
  destination?: { lat: number; lng: number; label?: string } | null;
  startedAt?: any; // Firestore timestamp
  completedAt?: any; // Firestore timestamp
  status?: "active" | "completed" | "cancelled";
  notes?: string;
};

const tripsCol = () => collection(db, "trips");

export async function logTripStart(userId: string, groupId: string | null, destination: { lat: number; lng: number; label?: string } | null) {
  const rec: Omit<TripRecord, "id"> = {
    userId,
    groupId,
    destination: destination ?? null,
    startedAt: serverTimestamp(),
    status: "active",
  };
  const ref = await addDoc(tripsCol(), rec);
  return ref.id;
}

export async function logTripComplete(tripId: string) {
  const ref = doc(db, "trips", tripId);
  await updateDoc(ref, { completedAt: serverTimestamp(), status: "completed" });
}

export async function upsertTripNote(tripId: string, notes: string) {
  const ref = doc(db, "trips", tripId);
  await setDoc(ref, { notes }, { merge: true });
}

export function subscribeToUserTrips(userId: string, cb: (trips: TripRecord[]) => void) {
  const qy = query(tripsCol(), where("userId", "==", userId));
  return onSnapshot(qy, (snap) => {
    const items: TripRecord[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as TripRecord);
    cb(items);
  });
}

export async function listUserTrips(userId: string) {
  const qy = query(tripsCol(), where("userId", "==", userId));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as TripRecord);
}
