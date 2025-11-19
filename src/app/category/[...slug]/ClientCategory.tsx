
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSlug } from '@/lib/utils';
import Link from 'next/link';

export default function ClientCategory({ slug }: { slug: string }) {
  const { products, isLoaded } = useProducts();

  const filteredProducts = isLoaded
    ? products.filter(product => {
        const productSlug = product.category
          .split(' > ')
          .map(createSlug)
          .join('/');
        return productSlug.startsWith(slug);
      })
    : [];

  const categoryParts = slug.split('/');

  let currentPath = '';
  const breadcrumbs = categoryParts.map((part, index) => {
    currentPath += `${index === 0 ? '' : '/'}${part}`;
    return {
      name: part.replace(/-/g, ' '),
      href: `/category/${currentPath}`,
      isLast: index === categoryParts.length - 1
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Breadcrumbs */}
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

      <h1 className="mb-8 text-3xl font-bold capitalize">
        {categoryParts[categoryParts.length - 1]?.replace(/-/g, ' ') || 'Products'}
      </h1>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        
        {/* Loading */}
        {!isLoaded && (
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
        )}

        {/* Products */}
        {isLoaded && filteredProducts.length > 0 && (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}

        {/* Empty */}
        {isLoaded && filteredProducts.length === 0 && (
          <div className="text-center col-span-full py-16">
            <h2 className="text-xl font-semibold">No Products Found</h2>
            <p className="text-muted-foreground mt-2">
              There are no products in this category yet.
            </p>
          </div>
        )}
      </div>

      <div className="mt-16 border-t pt-12">
        <h2 className="text-center text-2xl font-bold mb-8">Εξερευνήστε Επίσης</h2>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/category/grafeia">Γραφεία</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/category/karekles-grafeiou">Καρέκλες Γραφείου</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/category/bibliothikes">Βιβλιοθήκες</Link>
          </Button>
        </div>
      </div>

    </div>
  );
}
