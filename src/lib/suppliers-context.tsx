'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';


export type MarkupRule = {
  from: number;
  to: number;
  markup: number;
};

export type Supplier = {
  id: string;
  name: string;
  url: string;
  conversionRate: number;
  profitability: number;
  markupRules?: MarkupRule[];
};

interface SuppliersContextType {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
}

const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

export const SuppliersProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers');
  }, [firestore]);

  const { data: suppliers, isLoading } = useCollection<Omit<Supplier, 'id'>>(suppliersQuery);
  const memoizedSuppliers = useMemo(() => suppliers || [], [suppliers]);

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => {
    if (!firestore) return;
    const newSupplier = {
        ...supplierData,
        conversionRate: Math.random() * 0.2,
        profitability: Math.random() * 10000,
    };
    await addDoc(collection(firestore, 'suppliers'), newSupplier);
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (!firestore) return;
    const { id, ...data } = updatedSupplier;
    const supplierRef = doc(firestore, 'suppliers', id);
    await updateDoc(supplierRef, data);
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!firestore) return;
    const supplierRef = doc(firestore, 'suppliers', supplierId);
    await deleteDoc(supplierRef);
  };


  return (
    <SuppliersContext.Provider value={{ suppliers: memoizedSuppliers, addSupplier, updateSupplier, deleteSupplier }}>
      {children}
    </SuppliersContext.Provider>
  );
};

export const useSuppliers = () => {
  const context = useContext(SuppliersContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SuppliersProvider');
  }
  return context;
};
