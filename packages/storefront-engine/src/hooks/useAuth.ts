import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                try {
                    const snap = await getDoc(doc(db, 'users', u.uid));
                    if (snap.exists()) setProfile({ uid: u.uid, ...snap.data() } as UserProfile);
                } catch (e) {}
            } else { setUser(null); setProfile(null); }
            setLoading(false);
        });
    }, []);
    return { user, profile, loading };
}
