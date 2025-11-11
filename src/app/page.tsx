
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProducts } from '@/lib/products-context';
import { createSlug } from '@/lib/utils';
import { Armchair, Briefcase, Files, Library, Monitor, Wrench } from 'lucide-react';


const mainCategories = [
    { name: 'Καρέκλες', slug: 'karekles-grafeiou', Icon: Armchair },
    { name: 'Γραφεία', slug: 'grafeia', Icon: Briefcase },
    { name: 'Συρταριέρες', slug: 'syrtarieres', Icon: Files },
    { name: 'Ραφιέρες', slug: 'rafieres-kai-bibliothikes', Icon: Library },
    { name: 'Αξεσουάρ', slug: 'aksesouar-grafeiou', Icon: Monitor },
    { name: 'Ανταλλακτικά', slug: 'antallaktika-gia-karekles-grafeiou', Icon: Wrench },
]


export default function Home() {
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-background');

  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] w-full text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <h1 className="font-headline text-4xl font-bold md:text-6xl">
            Scandinavian Simplicity
          </h1>
          <p className="mt-4 max-w-2xl text-lg">
            Discover timeless, high-quality office furniture designed to inspire
            productivity and comfort.
          </p>
          <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
            <Link href="/products">Shop Now</Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-12 font-headline text-3xl font-bold">
            Διάλεξε Κατηγορία
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {mainCategories.map(({ name, slug, Icon }) => (
              <Link href={`/category/${slug}`} key={name} className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-2">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                  <Icon className="h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <span className="font-medium text-foreground">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-headline text-3xl font-bold">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
