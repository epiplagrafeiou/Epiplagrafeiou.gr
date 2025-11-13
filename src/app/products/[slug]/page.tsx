
import { notFound } from 'next/navigation';
import { createSlug } from '@/lib/utils';
import { ProductCard } from '@/components/products/ProductCard';
import { getProducts } from '@/lib/user-actions';
import { ProductView } from '@/components/products/ProductView';
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const products = await getProducts();
  const product = products.find((p) => createSlug(p.name) === params.slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} - Epipla Graphiou AI eShop`,
    description: product.description,
    alternates: {
      canonical: `/products/${params.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.imageId,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'product',
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = params;
  const allProducts = await getProducts();
  const product = allProducts.find((p) => createSlug(p.name) === slug);

  if (!product) {
    notFound();
  }

  const getBaseProductName = (name: string) => {
    const words = name.split(' ');
    if (words.length > 3) {
      return words.slice(0, words.length - 2).join(' ');
    }
    return words.slice(0, words.length - 1).join(' ');
  };

  const baseName = getBaseProductName(product.name);

  let relatedProducts = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      p.name.includes(baseName) &&
      baseName.length > 5
  );

  if (relatedProducts.length < 4) {
    const productSubCategory = product.category.split(' > ').pop();
    const sameCategoryProducts = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        !relatedProducts.some((c) => c.id === p.id) &&
        p.category.split(' > ').pop() === productSubCategory
    );
    relatedProducts.push(...sameCategoryProducts);
  }

  const finalRelatedProducts = Array.from(
    new Set(relatedProducts.map((p) => p.id))
  )
    .map((id) => allProducts.find((p) => p.id === id)!)
    .filter(Boolean)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  return (
    <>
      <ProductView product={product} allProducts={allProducts} />

      {finalRelatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 mt-4">
          <h2 className="mb-8 font-headline text-2xl font-bold">
            Μπορεί επίσης να σας αρέσουν
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {finalRelatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
