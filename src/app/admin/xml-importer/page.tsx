
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSuppliers, type MarkupRule } from '@/lib/suppliers-context';
import { syncProductsFromXml } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Filter, Zap } from 'lucide-react';
import { useProducts } from '@/lib/products-context';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { XmlProduct } from '@/lib/xml-parsers/megapap-parser';

export default function XmlImporterPage() {
  const { suppliers } = useSuppliers();
  const { addProducts } = useProducts();
  const { toast } = useToast();
  const [loadingSupplier, setLoadingSupplier] = useState<string | null>(null);
  const [quickSyncingSupplier, setQuickSyncingSupplier] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [syncedProducts, setSyncedProducts] = useState<XmlProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncCategories, setLastSyncCategories] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadedCategories: Record<string, string[]> = {};
    suppliers.forEach(s => {
      const saved = localStorage.getItem(`lastSyncCategories_${s.id}`);
      if (saved) {
        loadedCategories[s.id] = JSON.parse(saved);
      }
    });
    setLastSyncCategories(loadedCategories);
  }, [suppliers]);


  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const handleSync = async (supplierId: string, url: string, name: string) => {
    setLoadingSupplier(supplierId);
    setActiveSupplierId(supplierId);
    setError(null);
    setSyncedProducts([]);
    try {
      const products = await syncProductsFromXml(url, name);
      setSyncedProducts(products);
      // Reset categories based on new sync
      setSelectedCategories(new Set(['all']));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSupplier(null);
    }
  };
  
  const applyMarkup = (price: number, rules: MarkupRule[] = []): number => {
    const sortedRules = [...rules].sort((a, b) => a.from - b.from);
    for (const rule of sortedRules) {
        if (price >= rule.from && price <= rule.to) {
            return price * (1 + rule.markup / 100);
        }
    }
    const defaultRule = sortedRules.find(r => r.from === 0) || { markup: 0 };
    return price * (1 + defaultRule.markup / 100);
  };
  
  const processAndAddProducts = (productsToProcess: XmlProduct[], supplier: (typeof suppliers)[0]) => {
     const productsToAdd = productsToProcess.map(p => {
        const retailPrice = parseFloat(p.webOfferPrice) || 0;
        const finalPrice = applyMarkup(retailPrice, supplier.markupRules);
        const categoryPath = p.category.split('>').map(c => c.trim()).join(' > ');

        return {
            id: p.id,
            supplierId: supplier.id,
            name: p.name,
            price: finalPrice,
            description: p.description,
            category: categoryPath,
            images: p.images,
            mainImage: p.mainImage,
            stock: p.stock,
        }
    });
    
    addProducts(productsToAdd);
    
    toast({
        title: "Products Added!",
        description: `${productsToAdd.length} products have been added to your store.`
    });
  }

  const handleAddToStore = () => {
    const activeSupplier = suppliers.find(s => s.id === activeSupplierId);
    if (!activeSupplier) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the supplier to apply markup rules."
        });
        return;
    }
    
    // Save categories for quick sync
    const categoriesToSave = Array.from(selectedCategories);
    localStorage.setItem(`lastSyncCategories_${activeSupplier.id}`, JSON.stringify(categoriesToSave));
    setLastSyncCategories(prev => ({...prev, [activeSupplier.id]: categoriesToSave}));


    processAndAddProducts(filteredProducts, activeSupplier);

    setSyncedProducts([]);
    setSelectedCategories(new Set());
    setActiveSupplierId(null);
  }

  const handleQuickSync = async (supplier: (typeof suppliers)[0]) => {
      const savedCategories = lastSyncCategories[supplier.id];
      if (!savedCategories) {
          toast({ variant: 'destructive', title: 'No saved categories', description: 'Please perform a manual sync first to save category selections.'});
          return;
      }

      setQuickSyncingSupplier(supplier.id);
      setError(null);
      
      try {
          const allProducts = await syncProductsFromXml(supplier.url, supplier.name);
          const productsToSync = allProducts.filter(p => {
              const categoryPath = p.category.split('>').map(c => c.trim()).join(' > ');
              return savedCategories.includes(categoryPath) || savedCategories.includes('all');
          });

          if (productsToSync.length === 0) {
              toast({ title: 'Quick Sync Complete', description: 'No products found matching your last selected categories.'});
              return;
          }
          
          processAndAddProducts(productsToSync, supplier);

      } catch(e: any) {
          setError(e.message);
          toast({ variant: 'destructive', title: 'Quick Sync Failed', description: e.message });
      } finally {
          setQuickSyncingSupplier(null);
      }

  }

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    syncedProducts.forEach(p => {
        const categoryPath = p.category.split('>').map(c => c.trim()).join(' > ');
        if(categoryPath) categories.add(categoryPath);
    });
    return Array.from(categories).sort();
  }, [syncedProducts]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (category === 'all') {
        if (newSet.has('all') || newSet.size === allCategories.length) {
          newSet.clear();
        } else {
          allCategories.forEach(cat => newSet.add(cat));
          newSet.add('all');
        }
      } else {
        if (newSet.has(category)) {
          newSet.delete(category);
          newSet.delete('all'); // Uncheck "all" if a specific item is unchecked
        } else {
          newSet.add(category);
          if (newSet.size === allCategories.length) {
            newSet.add('all');
          }
        }
      }
      return newSet;
    });
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategories.has('all') || selectedCategories.size === 0 || (allCategories.length > 0 && selectedCategories.size === allCategories.length)) {
      return syncedProducts;
    }
    return syncedProducts.filter(p => {
        const categoryPath = p.category.split('>').map(c => c.trim()).join(' > ');
        return categoryPath && selectedCategories.has(categoryPath);
    });
  }, [syncedProducts, selectedCategories, allCategories]);

  const activeSupplier = useMemo(() => suppliers.find(s => s.id === activeSupplierId), [suppliers, activeSupplierId]);

  return (
    <div className="p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">XML Importer</h2>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sync Products from Suppliers</CardTitle>
          <CardDescription>
            Fetch products from XML feeds. Use Quick Sync to re-import using the last saved category selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <h3 className="font-semibold">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.url}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleQuickSync(supplier)}
                        disabled={!lastSyncCategories[supplier.id] || quickSyncingSupplier === supplier.id || loadingSupplier === supplier.id}
                        variant="outline"
                    >
                       <Zap className="mr-2 h-4 w-4" />
                       {quickSyncingSupplier === supplier.id ? 'Syncing...' : 'Quick Sync'}
                    </Button>
                    <Button
                    onClick={() => handleSync(supplier.id, supplier.url, supplier.name)}
                    disabled={loadingSupplier === supplier.id || quickSyncingSupplier === supplier.id}
                    >
                    {loadingSupplier === supplier.id ? 'Syncing...' : 'Sync Products'}
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {syncedProducts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Categories</CardTitle>
                        <CardDescription>Select categories to import.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="cat-all" 
                                        checked={selectedCategories.has('all') || (allCategories.length > 0 && selectedCategories.size === allCategories.length)}
                                        onCheckedChange={() => handleCategoryToggle('all')}
                                    />
                                    <Label htmlFor="cat-all" className="font-semibold">Select All</Label>
                                </div>
                                {allCategories.map(category => (
                                <div key={category} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${category}`}
                                        checked={selectedCategories.has(category)}
                                        onCheckedChange={() => handleCategoryToggle(category)}
                                    />
                                    <Label htmlFor={`cat-${category}`}>{category}</Label>
                                </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                <CardHeader>
                    <CardTitle>Synced Products ({filteredProducts.length})</CardTitle>
                    <CardDescription>
                    Review the products below. Markup rules from the active supplier will be applied.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Supplier Price</TableHead>
                        <TableHead className="text-right">Your Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => {
                          const supplierPrice = parseFloat(product.webOfferPrice) || 0;
                          const finalPrice = activeSupplier ? applyMarkup(supplierPrice, activeSupplier.markupRules) : supplierPrice;

                          return (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                <Badge variant="outline">{product.category}</Badge>
                                </TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell className="text-right">{formatCurrency(supplierPrice)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(finalPrice)}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                    </Table>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleAddToStore} disabled={filteredProducts.length === 0}>Add {filteredProducts.length} Products to Store</Button>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}

    