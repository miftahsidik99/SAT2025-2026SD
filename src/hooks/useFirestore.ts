import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NaskahDocument } from '../types';

export function useFirestore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveNaskah = useCallback(async (data: NaskahDocument) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'naskah_documents'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setLoading(false);
      return docRef.id;
    } catch (err: any) {
      console.error("Error saving naskah:", err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getHistory = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'naskah_documents'),
        where('ownerId', '==', userId),
      );
      const querySnapshot = await getDocs(q);
      const results: NaskahDocument[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as NaskahDocument);
      });
      // Sort in memory as composite index is required for ordered query
      results.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
      });
      setLoading(false);
      return results;
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, []);

   const getDocument = useCallback(async (docId: string, userId: string) => {
     setLoading(true);
     setError(null);
     try {
       const docRef = doc(db, 'naskah_documents', docId);
       const docSnap = await getDoc(docRef);
       if (docSnap.exists() && docSnap.data().ownerId === userId) {
         setLoading(false);
         return { id: docSnap.id, ...docSnap.data() } as NaskahDocument;
       } else {
         setLoading(false);
         return null;
       }
     } catch (err: any) {
        console.error("Error getting doc:", err);
        setError(err.message);
        setLoading(false);
        return null;
     }
   }, []);

   const deleteNaskah = useCallback(async (docId: string) => {
     try {
       const docRef = doc(db, 'naskah_documents', docId);
       await deleteDoc(docRef);
       return { success: true };
     } catch (err: any) {
       console.error("Error deleting doc:", err);
       return { success: false, error: err.message };
     }
   }, []);

  return { saveNaskah, getHistory, getDocument, deleteNaskah, loading, error };
}
