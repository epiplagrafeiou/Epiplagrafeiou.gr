
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { suppliers as initialSuppliers } from './data';

export type MarkupRule = {
  from: number;
  to: number;
  markup: number;
};

export type Supplier = {
  id: string;
  name: string;
  url: string;
  markup: number; // This can be deprecated or used as a default
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedSuppliers = localStorage.getItem('suppliers');
    if (storedSuppliers) {
      setSuppliers(JSON.parse(storedSuppliers));
    } else {
      // Initialize with default data if nothing is in local storage
      const initializedSuppliers = initialSuppliers.map((s) => ({ ...s, markupRules: [{ from: 0, to: 99999, markup: s.markup }] }));
      setSuppliers(initializedSuppliers);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
  }, [suppliers, isClient]);

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => {
    setSuppliers((prevSuppliers) => {
      const newSupplier: Supplier = {
        ...supplierData,
        id: `sup${Date.now()}`,
        conversionRate: Math.random() * 0.2, // Mock data
        profitability: Math.random() * 10000, // Mock data
      };
      return [...prevSuppliers, newSupplier];
    });
  };

  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };


  return (
    <SuppliersContext.Provider value={{ suppliers, addSupplier, updateSupplier, deleteSupplier }}>
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
