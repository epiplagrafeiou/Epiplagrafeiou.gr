import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === product.imageId);

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="group">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full">
            {image ? (
              <Image
                src={image.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                data-ai-hint={image.imageHint}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <span className="text-sm text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-medium">{product.name}</CardTitle>
        </CardContent>
      </Link>
      <CardFooter className="mt-auto flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(product.price)}
        </p>
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  );
}
