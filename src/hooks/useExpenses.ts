import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: Date;
  description: string;
  tags?: string[];
  createdAt: any;
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const path = 'expenses';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt
        };
      }) as Expense[];
      
      setExpenses(expenseData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addExpense = async (data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const path = 'expenses';
    try {
      await addDoc(collection(db, path), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const removeExpense = async (id: string) => {
    const path = `expenses/${id}`;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateExpense = async (id: string, data: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>) => {
    const path = `expenses/${id}`;
    try {
      await updateDoc(doc(db, 'expenses', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return { expenses, loading, addExpense, removeExpense, updateExpense };
}
