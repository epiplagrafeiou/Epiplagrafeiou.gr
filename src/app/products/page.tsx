
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback, useRef } from 'react';

const PRODUCTS_PER_PAGE = 24;

export default function ProductsPage() {
  const { products, isLoaded, categories } = useProducts();
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isLoaded) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < products.length) {
          setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoaded, visibleCount, products.length]
  );
  
  const displayedProducts = products.slice(0, visibleCount);

  return (
    <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 md:grid-cols-4">
      <aside className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox id={category} />
                    <Label htmlFor={category}>{category}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="mb-4 font-semibold">Price Range</h3>
              <Slider
                defaultValue={[500]}
                max={2000}
                step={10}
                className="my-4"
              />
               <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(0)}</span>
                <span>{formatCurrency(2000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
      <main className="md:col-span-3">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!isLoaded ? (
            Array.from({ length: 9 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-4/5" />
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-10 w-28" />
                </CardFooter>
              </Card>
            ))
          ) : (
            displayedProducts.map((product, index) => {
              if (index === displayedProducts.length - 1) {
                return (
                  <div ref={lastProductElementRef} key={product.id}>
                    <ProductCard product={product} />
                  </div>
                );
              }
              return <ProductCard key={product.id} product={product} />;
            })
          )}
        </div>
      </main>
    </div>
  );
}
