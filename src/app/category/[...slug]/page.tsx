
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, notFound } from 'next/navigation';
import { createSlug } from '@/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import React from 'react';

const featuredCategories = [
    { name: 'Γραφεία', href: '/category/grafeio' },
    { name: 'Καρέκλες Γραφείου', href: '/category/grafeio/karekles-grafeiou' },
    { name: 'Βιβλιοθήκες', href: '/category/grafeio/bibliothikes' },
]

export default function CategoryPage() {
  const { products, isLoaded } = useProducts();
  const params = useParams();
  
  const slugPath = useMemo(() => Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || ''), [params.slug]);

  const { categoryPathString, pageTitle, breadcrumbs, filteredProducts } = useMemo(() => {
    if (!isLoaded) return { categoryPathString: '', pageTitle: '', breadcrumbs: [], filteredProducts: [] };

    const allCategoryPaths = Array.from(new Set(products.map(p => p.category)));

    // Find the correct category string by matching its generated slug to the URL slug.
    const pathString = allCategoryPaths.find(catString => {
        const catSlug = (catString || '').split(' > ').map(createSlug).join('/');
        return catSlug === slugPath;
    });

    if (!pathString && isLoaded) {
      // Return a specific state to trigger notFound outside the memo
      return { categoryPathString: null, pageTitle: '', breadcrumbs: [], filteredProducts: [] };
    }

    const productsForCategory = pathString ? products.filter(product => {
      return (product.category || '').startsWith(pathString);
    }) : [];

    const categoryParts = pathString ? pathString.split(' > ') : slugPath.split('/').map(s => s.replace(/-/g, ' '));
    const title = categoryParts[categoryParts.length - 1];

    let currentHref = '';
    const breadcrumbData = categoryParts.map(part => {
      const partSlug = createSlug(part);
      currentHref += `${currentHref ? '/' : ''}${partSlug}`;
      return {
        name: part, // Use the real Greek name for display
        href: `/category/${currentHref}`, // Use the English slug for the link
      };
    });

    return {
      categoryPathString: pathString,
      pageTitle: title,
      breadcrumbs: breadcrumbData,
      filteredProducts: productsForCategory
    };
  }, [isLoaded, products, slugPath]);

  // Handle not found case after data is loaded and memo is calculated
  if (isLoaded && categoryPathString === null) {
    notFound();
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: typeof window !== 'undefined' ? window.location.origin : '',
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: 'Products',
            item: typeof window !== 'undefined' ? `${window.location.origin}/products` : '',
        },
        ...breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 3,
            name: crumb.name,
            item: typeof window !== 'undefined' ? `${window.location.origin}${crumb.href}` : '',
        }))
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav>
        <ol className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li>/</li>
          <li><Link href="/products" className="hover:text-foreground">Products</Link></li>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <li>/</li>
              <li>
                <Link 
                  href={crumb.href} 
                  className={index === breadcrumbs.length - 1 ? "text-foreground capitalize" : "hover:text-foreground capitalize"}
                >
                  {crumb.name}
                </Link>
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>

      <h1 className="mb-8 text-3xl font-bold capitalize">{pageTitle}</h1>

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
