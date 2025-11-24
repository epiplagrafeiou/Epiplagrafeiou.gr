
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Terminal, Filter, Zap, Loader2 } from 'lucide-react';
import { useProducts } from '@/lib/products-context';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { XmlProduct } from '@/lib/types/product';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { StoreCategory } from '@/components/admin/CategoryManager';

export default function XmlImporterPage() {
  const { suppliers } = useSuppliers();
  const { addProducts } = useProducts();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [loadingSupplier, setLoadingSupplier] = useState<string | null>(null);
  const [quickSyncingSupplier, setQuickSyncingSupplier] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [syncedProducts, setSyncedProducts] = useState<XmlProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncCategories, setLastSyncCategories] = useState<Record<string, string[]>>({});
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);


  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: storeCategories } = useCollection<StoreCategory>(categoriesQuery);

  const categoryMap = useMemo(() => {
    if (!storeCategories) return new Map();
    const map = new Map<string, string>(); // rawCategory -> storeCategoryId
    
    const traverse = (categories: StoreCategory[]) => {
      for (const cat of categories) {
        cat.rawCategories?.forEach(rawCat => {
            if(!map.has(rawCat)){ // Prioritize parent categories in case of duplicates
               map.set(rawCat, cat.id);
            }
        });
        if (cat.children?.length) {
            traverse(cat.children);
        }
      }
    }
    traverse(storeCategories);
    return map;
  }, [storeCategories]);

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

  const handleSync = async (supplierId: string, url: string, name: string) => {
    setLoadingSupplier(supplierId);
    setActiveSupplierId(supplierId);
    setError(null);
    setSyncedProducts([]); // Clear previous products immediately
    setSelectedCategories(new Set()); // Clear selected categories
    try {
      const products = await syncProductsFromXml(url, name);
      setSyncedProducts(products);
      setSelectedCategories(new Set(['all'])); // Select all by default for the new sync
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSupplier(null);
    }
  };
  
  const applyMarkup = (product: XmlProduct, rules: MarkupRule[] = []): number => {
    const price = parseFloat(product.webOfferPrice) || 0;
    const sortedRules = [...rules].sort((a, b) => a.from - b.from);
    let markedUpPrice = price;
    let ruleApplied = false;

    // 1. Apply Percentage-based Markup
    for (const rule of sortedRules) {
        if (price >= rule.from && price <= rule.to) {
            markedUpPrice = price * (1 + rule.markup / 100);
            ruleApplied = true;
            break;
        }
    }
    // Apply default rule if no specific range matched
    if (!ruleApplied) {
        const defaultRule = sortedRules.find(r => r.to === 99999) || { markup: 30 };
        markedUpPrice = price * (1 + defaultRule.markup / 100);
    }
    
    // 2. Apply Fixed Additions for Low-Cost Items (based on original price)
    if (price > 0 && price <= 2) {
      markedUpPrice += 0.65;
    } else if (price > 2 && price <= 5) {
      markedUpPrice += 1.30;
    } else if (price > 5 && price <= 14) {
      markedUpPrice += 1.70;
    }
    
    // 3. Apply category-specific surcharges
    const productNameLower = product.name.toLowerCase();
    if (productNameLower.includes('μπουφέδες')) {
      markedUpPrice += 6;
    } else if (productNameLower.includes('ντουλάπες')) {
      markedUpPrice += 14;
    } else if (productNameLower.includes('σετ τραπεζαρίες κήπου')) {
      markedUpPrice += 16;
    }


    return markedUpPrice;
  };
  
  const processAndAddProducts = async (productsToProcess: XmlProduct[], supplier: (typeof suppliers)[0]) => {
     const productsToAdd = productsToProcess.map(p => {
        const finalPrice = applyMarkup(p, supplier.markupRules);

        return {
            id: p.id,
            sku: p.sku,
            model: p.model,
            variantGroupKey: p.variantGroupKey,
            color: p.color,
            supplierId: supplier.id,
            name: p.name,
            price: finalPrice,
            description: p.description,
            categoryId: p.categoryId,
            rawCategory: p.rawCategory, // Keep the raw category for reference
            category: p.category,
            images: p.images,
            mainImage: p.mainImage,
            stock: p.stock,
        }
    });
    
    await addProducts(productsToAdd);
  }

  const handleAddToStore = async () => {
    const activeSupplier = suppliers.find(s => s.id === activeSupplierId);
    if (!activeSupplier) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the supplier to apply markup rules."
        });
        return;
    }
    
    setIsAdding(true);

    const categoriesToSave = Array.from(selectedCategories);
    localStorage.setItem(`lastSyncCategories_${activeSupplier.id}`, JSON.stringify(categoriesToSave));
    setLastSyncCategories(prev => ({...prev, [activeSupplier.id]: categoriesToSave}));

    try {
        await processAndAddProducts(filteredProducts, activeSupplier);
        toast({
            title: "Products Added/Updated!",
            description: `${filteredProducts.length} products have been synced to your store.`
        });
        setSyncedProducts([]);
        setSelectedCategories(new Set());
        setActiveSupplierId(null);
    } catch(e: any) {
        console.error("Failed to add products:", e);
        toast({
            variant: "destructive",
            title: "Import Failed",
            description: "Could not save products to the database. Check the console for details."
        });
    } finally {
        setIsAdding(false);
    }
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
              const rawCat = typeof p.category === "string" ? p.category : "";
              const categoryPath = rawCat
                .split('>')
                .map(c => c.trim())
                .filter(Boolean)
                .join(' > ');
              return savedCategories.includes(categoryPath) || savedCategories.includes('all');
          });

          if (productsToSync.length === 0) {
              toast({ title: 'Quick Sync Complete', description: 'No products found matching your last selected categories.'});
              setQuickSyncingSupplier(null);
              return;
          }
          
          await processAndAddProducts(productsToSync, supplier);
          toast({
            title: "Quick Sync Complete!",
            description: `${productsToSync.length} products have been synced.`
          });

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
        const rawCat = typeof p.category === "string" ? p.category : "";
        const categoryPath = rawCat
          .split('>')
          .map(c => c.trim())
          .filter(Boolean)
          .join(' > ');
        if (categoryPath) categories.add(categoryPath);
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
          newSet.delete('all');
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
    if (!syncedProducts.length) return [];
    if (selectedCategories.has('all') || selectedCategories.size === 0 || (allCategories.length > 0 && selectedCategories.size === allCategories.length)) {
      return syncedProducts;
    }
    return syncedProducts.filter(p => {
        const rawCat = typeof p.category === "string" ? p.category : "";
        const categoryPath = rawCat
            .split('>')
            .map(c => c.trim())
            .filter(Boolean)
            .join(' > ');
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
                          const finalPrice = activeSupplier ? applyMarkup(product, activeSupplier.markupRules) : supplierPrice;

                          return (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                <Badge variant="outline">{typeof product.category === 'string' ? product.category : 'N/A'}</Badge>
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
                        <Button onClick={handleAddToStore} disabled={filteredProducts.length === 0 || isAdding}>
                           {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isAdding ? "Adding..." : `Add/Update ${filteredProducts.length} Products`}
                        </Button>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
    

    