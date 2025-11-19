
'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSlug, normalizeCategory } from '@/lib/utils';
import Link from 'next/link';
import type { StoreCategory } from '@/components/admin/CategoryManager';

const featuredCategories = [
    { name: 'Γραφεία', href: '/category/grafeio/grafeia' },
    { name: 'Καρέκλες Γραφείου', href: '/category/grafeio/karekles-grafeiou' },
    { name: 'Βιβλιοθήκες', href: '/category/grafeio/bibliothikes' },
]

export default function CategoryPage() {
  const { products, isLoaded } = useProducts();
  const params = useParams();
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
        categories.sort((a,b) => a.order - b.order);
        categories.forEach(c => sortRecursive(c.children));
    }
    
    sortRecursive(rootCategories);
    return rootCategories;
  }, [fetchedCategories]);
  
  const slugPath = useMemo(() => Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || ''), [params.slug]);

  const { currentCategory, breadcrumbs } = useMemo(() => {
    if (categoryTree.length === 0) return { currentCategory: null, breadcrumbs: [] };

    const slugParts = slugPath.split('/');
    let category: StoreCategory | null = null;
    let currentChildren = categoryTree;
    let breadcrumbs: { name: string; href: string; isLast: boolean }[] = [];
    let currentHref = '/category';

    for (const part of slugParts) {
      const found = currentChildren.find(c => createSlug(c.name) === part);
      if (found) {
        category = found;
        currentHref += `/${part}`;
        breadcrumbs.push({ name: found.name, href: currentHref, isLast: false });
        currentChildren = found.children;
      } else {
        category = null;
        break;
      }
    }
    
    if (breadcrumbs.length > 0) {
        breadcrumbs[breadcrumbs.length - 1].isLast = true;
    }

    return { currentCategory: category, breadcrumbs };
  }, [slugPath, categoryTree]);

  const filteredProducts = useMemo(() => {
    if (!isLoaded) return [];
    return products.filter(product => {
      const productCategoryPath = normalizeCategory(product.category).split(' > ').map(createSlug).join('/');
      return productCategoryPath.startsWith(slugPath);
    });
  }, [isLoaded, products, slugPath]);
  
  if (isLoaded && !areCategoriesLoading && !currentCategory) {
    notFound();
  }
  
  const pageTitle = currentCategory?.name || slugPath.split('/').pop()?.replace(/-/g, ' ') || 'Products';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center space-x-2">
            <span>/</span>
            {crumb.isLast ? (
              <span className="text-foreground capitalize">{crumb.name}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground capitalize">{crumb.name}</Link>
            )}
          </span>
        ))}
      </div>

      <h1 className="mb-8 text-3xl font-bold capitalize">{pageTitle}</h1>
      
      {currentCategory && currentCategory.children.length > 0 && (
        <section className="mb-12">
            <h2 className="mb-8 text-center font-headline text-2xl font-bold">
              Εξερευνήστε τις Υποκατηγορίες
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
            {currentCategory.children.map((subCat, index) => (
              <Link 
                href={`${breadcrumbs[breadcrumbs.length - 1].href}/${createSlug(subCat.name)}`} 
                key={subCat.id} 
                className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-2 text-center"
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-md transition-shadow group-hover:shadow-xl">
                  <Image
                    src={`https://picsum.photos/seed/${createSlug(subCat.name)}/300/300`}
                    alt={subCat.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    data-ai-hint={`${subCat.name} furniture`}
                  />
                </div>
                <span className="font-medium text-foreground">{subCat.name}</span>
              </Link>
            ))}
            </div>
        </section>
      )}


      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {!isLoaded ? (
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
