
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSlug, findCategoryPath, normalizeCategory } from '@/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import { notFound } from 'next/navigation';

const featuredCategories = [
    { name: 'Γραφεία', href: '/category/grafeio' },
    { name: 'Καρέκλες Γραφείου', href: '/category/grafeio/karekles-grafeiou' },
    { name: 'Βιβλιοθήκες', href: '/category/grafeio/bibliothikes' },
]

export default function ClientCategory({ slug }: { slug: string }) {
  const { products, isLoaded } = useProducts();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: storeCategories, isLoading: areCategoriesLoading } = useCollection<StoreCategory>(categoriesQuery);

  const { pageTitle, breadcrumbs, filteredProducts } = useMemo(() => {
    if (!isLoaded || areCategoriesLoading || !storeCategories) {
        // Provide a loading state but don't call notFound() yet
        const tempParts = slug.split('/').map(s => ({ name: s.replace(/-/g, ' '), href: '#' }));
        return { pageTitle: tempParts[tempParts.length - 1].name, breadcrumbs: tempParts, filteredProducts: [] };
    }

    const allPaths = storeCategories.map(cat => ({
      id: cat.id,
      path: findCategoryPath(cat.id, storeCategories).map(p => createSlug(p.name)).join('/')
    }));
    
    const matchedCategory = allPaths.find(p => p.path === slug);

    if (!matchedCategory) {
      // Defer notFound to the render phase
      return { pageTitle: null, breadcrumbs: [], filteredProducts: [] };
    }
    
    const categoryIds = new Set<string>();
    const getChildIds = (catId: string) => {
        categoryIds.add(catId);
        const children = storeCategories.filter(c => c.parentId === catId);
        children.forEach(child => getChildIds(child.id));
    };

    getChildIds(matchedCategory.id);

    const productsForCategory = products.filter(product => product.categoryId && categoryIds.has(product.categoryId));

    const pathSegments = findCategoryPath(matchedCategory.id, storeCategories);

    let currentHref = '';
    const breadcrumbData = pathSegments.map(part => {
      currentHref += `/${createSlug(part.name)}`;
      return {
        name: part.name, 
        href: `/category${currentHref}`,
      };
    });

    return {
      pageTitle: pathSegments[pathSegments.length - 1].name,
      breadcrumbs: breadcrumbData,
      filteredProducts: productsForCategory
    };
  }, [isLoaded, areCategoriesLoading, products, storeCategories, slug]);
  
  // This is the safe place to call notFound()
  if (isLoaded && !areCategoriesLoading && pageTitle === null) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav>
        <ol className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li>/</li>
          <li><Link href="/products" className="hover:text-foreground">Products</Link></li>
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              <span>/</span>
              <Link href={crumb.href} className="hover:text-foreground capitalize">{crumb.name}</Link>
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="mb-8 text-3xl font-bold capitalize">{pageTitle || "Loading..."}</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {!isLoaded || areCategoriesLoading ? (
          Array.from({ length: 12 }).map((_, index) => (
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
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {isLoaded && filteredProducts.length === 0 && (
        <div className="text-center col-span-full py-16">
            <h2 className="text-xl font-semibold">No Products Found</h2>
            <p className="text-muted-foreground mt-2">There are no products in this category yet.</p>
        </div>
      )}

      <div className="mt-16 border-t pt-12">
        <h2 className="text-center text-2xl font-bold mb-8">Εξερευνήστε Επίσης</h2>
        <div className="flex justify-center gap-4">
            {featuredCategories.map(cat => (
                <Button key={cat.href} asChild variant="outline">
                    <Link href={cat.href}>{cat.name}</Link>
                </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
