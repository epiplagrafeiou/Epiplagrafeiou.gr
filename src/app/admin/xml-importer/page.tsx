
'use client';

import { useState, useMemo } from 'react';
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
import { Terminal, Filter } from 'lucide-react';
import { useProducts } from '@/lib/products-context';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


interface SyncedProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;
  imageUrl: string;
}

export default function XmlImporterPage() {
  const { suppliers } = useSuppliers();
  const { addProducts } = useProducts();
  const { toast } = useToast();
  const [loadingSupplier, setLoadingSupplier] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [syncedProducts, setSyncedProducts] = useState<SyncedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const handleSync = async (supplierId: string, url: string) => {
    setLoadingSupplier(supplierId);
    setActiveSupplierId(supplierId);
    setError(null);
    setSyncedProducts([]);
    try {
      const products = await syncProductsFromXml(url);
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
    const applicableRule = rules.find(rule => price >= rule.from && price <= rule.to);
    if (applicableRule) {
      return price * (1 + applicableRule.markup / 100);
    }
    return price; // Return original price if no rule matches
  };

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

    const productsToadd = filteredProducts.map(p => {
        const retailPrice = parseFloat(p.retailPrice) || 0;
        const finalPrice = applyMarkup(retailPrice, activeSupplier.markupRules);

        return {
            name: p.name,
            price: finalPrice,
            description: p.description,
            category: p.category.split('>').pop()?.trim() || 'Uncategorized',
            imageId: `prod-img-${p.id}` // Use product ID to create a unique imageId
        }
    });
    
    const imagesToadd = filteredProducts.map(p => ({
      id: `prod-img-${p.id}`,
      url: p.imageUrl,
      hint: p.name.substring(0, 20) // a short hint for AI
    }));

    addProducts(productsToadd, imagesToadd);
    
    toast({
        title: "Products Added!",
        description: `${productsToadd.length} products have been added to your store.`
    });

    setSyncedProducts([]);
    setSelectedCategories(new Set());
    setActiveSupplierId(null);
  }

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    syncedProducts.forEach(p => categories.add(p.category));
    return Array.from(categories).sort();
  }, [syncedProducts]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (category === 'all') {
        if (newSet.has('all')) {
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
    if (selectedCategories.has('all') || selectedCategories.size === 0 || selectedCategories.size === allCategories.length) {
      return syncedProducts;
    }
    return syncedProducts.filter(p => selectedCategories.has(p.category));
  }, [syncedProducts, selectedCategories, allCategories.length]);

  return (
    <div className="p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">XML Importer</h2>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sync Products from Suppliers</CardTitle>
          <CardDescription>
            Fetch and review products from your suppliers' XML feeds before adding them to your store.
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
                <Button
                  onClick={() => handleSync(supplier.id, supplier.url)}
                  disabled={loadingSupplier === supplier.id}
                >
                  {loadingSupplier === supplier.id ? 'Syncing...' : 'Sync Products'}
                </Button>
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
                                        checked={selectedCategories.has('all') || selectedCategories.size === allCategories.length}
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
                        <TableHead className="text-right">Retail Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(product.retailPrice) || 0)}</TableCell>
                        </TableRow>
                        ))}
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
