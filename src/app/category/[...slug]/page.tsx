
'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { useProducts, type Product } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useParams, notFound } from 'next/navigation';
import { createSlug } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';


type Props = {
  params: { slug: string[] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugPath = params.slug.join('/');
  const pageTitle = params.slug[params.slug.length - 1].replace(/-/g, ' ');

  return {
    title: `${pageTitle} - Epipla Graphiou AI eShop`,
    description: `Browse products in the ${pageTitle} category.`,
    alternates: {
      canonical: `/category/${slugPath}`,
    },
  }
}

export default function CategoryPage() {
  const { products, isLoaded, allCategories } = useProducts();
  const params = useParams();
  
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

  const categoryPath = allCategories.find(cat => {
      const catSlug = cat.split(' > ').map(createSlug).join('/');
      return catSlug === slugPath;
  });

  if (isLoaded && !categoryPath) {
    notFound();
  }

  const filteredProducts = products.filter(product => {
    const productCategoryPath = product.category.split(' > ').map(createSlug).join('/');
    return productCategoryPath.startsWith(slugPath);
  });
  
  const categoryParts = categoryPath ? categoryPath.split(' > ') : [];
  let currentPath = '';
  const breadcrumbs = categoryParts.map((part, index) => {
    currentPath += `${currentPath ? '/' : ''}${createSlug(part)}`;
    const isLast = index === categoryParts.length - 1;
    return {
      name: part,
      href: `/category/${currentPath}`,
      isLast: isLast
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
        }))
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
              <span className="text-foreground">{crumb.name}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">{crumb.name}</Link>
            )}
          </span>
        ))}
      </div>

      <h1 className="mb-8 text-3xl font-bold">{categoryParts[categoryParts.length - 1] || 'Products'}</h1>

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
    </div>
  );
}
