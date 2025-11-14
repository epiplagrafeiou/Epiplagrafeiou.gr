
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useProducts, type Product } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSlug } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const featuredCategories = [
  { name: 'Γραφεία', href: '/category/grafeia' },
  { name: 'Καρέκλες Γραφείου', href: '/category/karekles-grafeiou' },
  { name: 'Βιβλιοθήκες', href: '/category/bibliothikes' },
];

export default function ClientCategory({ slug }: { slug: string }) {
  const { products, isLoaded, allCategories } = useProducts();

  const slugPath = slug;

  const categoryPath = allCategories?.find((cat) => {
    const catSlug = cat.split(' > ').map(createSlug).join('/');
    return catSlug === slugPath;
  });

  if (isLoaded && !categoryPath) {
    notFound();
  }

  const filteredProducts = (products || []).filter((product) => {
    const productCategoryPath = product.category.split(' > ').map(createSlug).join('/');
    return productCategoryPath.startsWith(slugPath);
  });

  const categoryParts = categoryPath
    ? categoryPath.split(' > ')
    : slugPath.split('/').map((s) => s.replace(/-/g, ' '));

  let currentPath = '';
  const breadcrumbs = categoryParts.map((part, index) => {
    currentPath += `${currentPath ? '/' : ''}${createSlug(part)}`;
    const isLast = index === categoryParts.length - 1;
    return {
      name: part,
      href: `/category/${currentPath}`,
      isLast,
    };
  });

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
      })),
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mb-6 flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center space-x-2">
            <span>/</span>
            {crumb.isLast ? (
              <span className="text-foreground capitalize">{crumb.name.replace(/-/g, ' ')}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground capitalize">{crumb.name.replace(/-/g, ' ')}</Link>
            )}
          </span>
        ))}
      </div>

      <h1 className="mb-8 text-3xl font-bold capitalize">{categoryParts[categoryParts.length - 1]?.replace(/-/g, ' ') || 'Products'}</h1>

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
          filteredProducts.map((product: Product) => (
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
          {featuredCategories.map((cat) => (
            <Button key={cat.href} asChild variant="outline">
              <Link href={cat.href}>{cat.name}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
