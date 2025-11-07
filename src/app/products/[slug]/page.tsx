import Image from 'next/image';
import { notFound } from 'next/navigation';
import { products } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/ProductCard';

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products.find((p) => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  const image = PlaceHolderImages.find((img) => img.id === product.imageId);
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
        <div className="rounded-lg bg-secondary">
          {image && (
            <Image
              src={image.imageUrl}
              alt={product.name}
              width={600}
              height={600}
              className="h-full w-full rounded-lg object-cover"
              data-ai-hint={image.imageHint}
            />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-headline text-3xl font-bold lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-bold">
            {formatCurrency(product.price)}
          </p>
          <Separator className="my-6" />
          <p className="text-muted-foreground">{product.description}</p>
          <div className="mt-8">
            <AddToCartButton product={product} size="lg" />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 font-headline text-2xl font-bold">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
