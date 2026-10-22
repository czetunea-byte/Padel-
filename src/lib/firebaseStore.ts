import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, setDoc, writeBatch,
} from 'firebase/firestore';
import type { League, Player, Session } from './types';
import type { Store } from './store';

export async function createFirebaseStore(): Promise<Store> {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  if (!auth.currentUser) await signInAnonymously(auth);
  const db = getFirestore(app);

  const leagueRef = (id: string) => doc(db, 'leagues', id);
  const players = (id: string) => collection(db, 'leagues', id, 'players');
  const sessions = (id: string) => collection(db, 'leagues', id, 'sessions');

  return {
    mode: 'firebase',
    async createLeague(name, list) {
      const ref = doc(collection(db, 'leagues'));
      const batch = writeBatch(db);
      batch.set(ref, { name, createdAt: Date.now() });
      for (const p of list) batch.set(doc(players(ref.id)), p);
      await batch.commit();
      return ref.id;
    },
    watchLeague: (id, cb) =>
      onSnapshot(leagueRef(id), (s) => cb(s.exists() ? ({ ...s.data(), id } as League) : null)),
    watchPlayers: (id, cb) =>
      onSnapshot(players(id), (q) => cb(q.docs.map((d) => ({ ...d.data(), id: d.id }) as Player))),
    watchSessions: (id, cb) =>
      onSnapshot(sessions(id), (q) => cb(q.docs.map((d) => ({ ...d.data(), id: d.id }) as Session))),
    async savePlayer(leagueId, { id, ...data }: Player) {
      await setDoc(doc(players(leagueId), id), data);
    },
    async addSession(leagueId, s) {
      return (await addDoc(sessions(leagueId), s)).id;
    },
    async updateSession(leagueId, { id, ...data }: Session) {
      await setDoc(doc(sessions(leagueId), id), data);
    },
    async deleteSession(leagueId, id) {
      await deleteDoc(doc(sessions(leagueId), id));
    },
  };
}
