
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/lib/products-context';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from '@/lib/utils';
import { PackageSearch, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createSlug } from '@/lib/utils';


function ProductsPageContent() {
  const { products, isLoaded } = useProducts();
  const searchParams = useSearchParams();
  const querySearchTerm = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(querySearchTerm);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('price-asc');
  const [inStockOnly, setInStockOnly] = useState(false);

  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: fetchedCategories, isLoading: areCategoriesLoading } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

  const categoryTree = useMemo(() => {
    if (!fetchedCategories) return [];
  
    const categoriesById: Record<string, StoreCategory> = {};
    const rootCategories: StoreCategory[] = [];
    const desiredOrder = ['ΓΡΑΦΕΙΟ', 'ΣΑΛΟΝΙ', 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ', 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ', 'Αξεσουάρ', 'ΦΩΤΙΣΜΟΣ', 'ΔΙΑΚΟΣΜΗΣΗ', 'Χριστουγεννιάτικα'];
  
    fetchedCategories.forEach(cat => {
        categoriesById[cat.id] = { ...cat, children: [] };
    });
  
    fetchedCategories.forEach(cat => {
        if (cat.parentId && categoriesById[cat.parentId]) {
            categoriesById[cat.parentId].children.push(categoriesById[cat.id]);
        } else {
            rootCategories.push(categoriesById[cat.id]);
        }
    });
    
    const sortRecursive = (categories: StoreCategory[]) => {
        categories.forEach(c => {
            if (c.children.length > 0) {
                sortRecursive(c.children);
            }
        });
        categories.sort((a,b) => a.order - b.order);
    }
    
    sortRecursive(rootCategories);
    
    rootCategories.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.name.toUpperCase());
        const indexB = desiredOrder.indexOf(b.name.toUpperCase());
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return rootCategories;
  }, [fetchedCategories]);

  useEffect(() => {
    setSearchTerm(querySearchTerm);
  }, [querySearchTerm]);


  const maxPrice = useMemo(() => {
    if (!isLoaded || products.length === 0) return 1000;
    const safePrices = products.map(p => Number(p.price) || 0);
    return Math.ceil(Math.max(...safePrices, 1000));
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setPriceRange([0, maxPrice]);
    }
  }, [isLoaded, maxPrice]);
  
  const findCategoryById = (id: string, categories: StoreCategory[]): StoreCategory | null => {
      for (const cat of categories) {
          if (cat.id === id) return cat;
          if (cat.children) {
              const found = findCategoryById(id, cat.children);
              if (found) return found;
          }
      }
      return null;
  };
  
  const getSubCategoryIds = (categoryId: string): string[] => {
    const ids: string[] = [categoryId];
    const findChildren = (catId: string) => {
        const category = findCategoryById(catId, categoryTree);
        if (category && category.children) {
            for (const child of category.children) {
                ids.push(child.id);
                findChildren(child.id);
            }
        }
    };
    findChildren(categoryId);
    return ids;
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!isLoaded) return [];

    let filtered = products;

    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock ?? 0) > 0);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (selectedCategories.size > 0) {
      const allSelectedIds = Array.from(selectedCategories).flatMap(getSubCategoryIds);
      const selectedIdSet = new Set(allSelectedIds);
      filtered = filtered.filter(p => p.categoryId && selectedIdSet.has(p.categoryId));
    }


    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, isLoaded, searchTerm, selectedCategories, priceRange, sortBy, inStockOnly, categoryTree]);
  

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(categoryId);
        } else {
            newSet.delete(categoryId);
        }
        return newSet;
    });
  };

  const renderCategoryFilters = (categories: StoreCategory[]) => {
    return categories.map(cat => (
      <Collapsible key={cat.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`cat-${cat.id}`} 
              onCheckedChange={(checked) => handleCategoryChange(cat.id, !!checked)}
              checked={selectedCategories.has(cat.id)}
            />
            <Label htmlFor={`cat-${cat.id}`} className="font-semibold">{cat.name}</Label>
          </div>
          {cat.children && cat.children.length > 0 && (
            <CollapsibleTrigger>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
          )}
        </div>
        {cat.children && cat.children.length > 0 && (
          <CollapsibleContent className="pl-6 space-y-2">
            {renderCategoryFilters(cat.children)}
          </CollapsibleContent>
        )}
      </Collapsible>
    ));
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Όλα τα Προϊόντα</h1>
        <p className="mt-2 text-muted-foreground">Εξερευνήστε ολόκληρη τη συλλογή μας.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Filters */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-6 pr-2">
            <h2 className="text-2xl font-semibold">Φίλτρα</h2>

            {/* Search */}
            <div>
              <Label htmlFor="search">Αναζήτηση</Label>
              <Input
                id="search"
                placeholder="Όνομα προϊόντος..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-2">Κατηγορίες</h3>

              {areCategoriesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-32" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {renderCategoryFilters(categoryTree)}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold mb-2">Εύρος Τιμής</h3>
              <Slider
                min={0}
                max={maxPrice}
                step={10}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
            </div>

            {/* Availability */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox id="in-stock" checked={inStockOnly} onCheckedChange={checked => setInStockOnly(!!checked)} />
                <Label htmlFor="in-stock">Μόνο Διαθέσιμα</Label>
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <main className="md:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {!isLoaded ? 'Φόρτωση...' : `${filteredAndSortedProducts.length} προϊόντα βρέθηκαν`}
            </p>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ταξινόμηση" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Τιμή: Αύξουσα</SelectItem>
                <SelectItem value="price-desc">Τιμή: Φθίνουσα</SelectItem>
                <SelectItem value="name-asc">Όνομα: Α-Ω</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          {!isLoaded && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                 <Card key={index}>
                    <Skeleton className="h-64 w-full" />
                 </Card>
              ))}
            </div>
          )}

          {/* Products */}
          {isLoaded && filteredAndSortedProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty */}
          {isLoaded && filteredAndSortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <PackageSearch className="h-24 w-24 text-muted-foreground/50"/>
                <h2 className="mt-6 text-2xl font-semibold">Δεν βρέθηκαν προϊόντα</h2>
                <p className="mt-2 text-muted-foreground">Δοκιμάστε να αλλάξετε τα φίλτρα σας.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
