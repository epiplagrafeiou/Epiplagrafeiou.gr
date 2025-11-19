
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { PackageSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';

function ProductsPageContent() {
  const { products, isLoaded } = useProducts();
  const searchParams = useSearchParams();
  const querySearchTerm = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(querySearchTerm);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('price-asc');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setSearchTerm(querySearchTerm);
  }, [querySearchTerm]);

  // --- IMPORTANT FIX: don't run filtering until Firebase finished ---
  const filteredAndSortedProducts = useMemo(() => {
    if (!isLoaded) return [];

    let filtered = products;

    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock ?? 0) > 0);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => {
        const productTopCategory = p.category.split(' > ')[0];
        return selectedCategories.includes(productTopCategory);
      });
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
  }, [products, isLoaded, searchTerm, selectedCategories, priceRange, sortBy, inStockOnly]);
  
  // --- FIX: compute categories only when loaded ---
  const topLevelCategories = useMemo(() => {
    if (!isLoaded) return [];
    const cats = new Set(products.map(p => p.category.split(' > ')[0]));
    return Array.from(cats);
  }, [products, isLoaded]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const maxPrice = useMemo(() => {
    if (!isLoaded || products.length === 0) return 1000;
    return Math.ceil(Math.max(...products.map(p => p.price), 1000));
  }, [products, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const maxProductPrice = Math.ceil(Math.max(...products.map(p => p.price), 1000));
      setPriceRange([0, maxProductPrice]);
    }
  }, [isLoaded, products]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Όλα τα Προϊόντα</h1>
        <p className="mt-2 text-muted-foreground">Εξερευνήστε ολόκληρη τη συλλογή μας.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Filters */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
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

              {!isLoaded ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-32" />
                ))
              ) : (
                <div className="space-y-2">
                  {topLevelCategories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${cat}`} 
                        onCheckedChange={(checked) => handleCategoryChange(cat, !!checked)}
                        checked={selectedCategories.includes(cat)}
                      />
                      <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                    </div>
                  ))}
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
  return <ProductsPageContent />;
}
