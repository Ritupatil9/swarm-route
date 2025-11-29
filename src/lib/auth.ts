import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Initialize Firebase (separate from Firestore to avoid conflicts)
if (!getApps().length) {
  initializeApp(firebaseConfig as any);
}

export const auth = getAuth();
export const db = getFirestore();

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  travelType?: string;
  bio?: string;
  favoriteDestinations?: string[];
  travelInterests?: string[];
  avatar?: string;
  createdAt: number;
}

export const signUp = async (
  email: string,
  password: string,
  name: string,
  profile?: Partial<UserProfile>
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile name
  await updateProfile(user, { displayName: name });

  // Save user profile to Firestore
  const userProfile: UserProfile = {
    uid: user.uid,
    name,
    email,
    ...profile,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "users", user.uid), userProfile);

  return user;
};

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await setDoc(doc(db, "users", uid), updates, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
