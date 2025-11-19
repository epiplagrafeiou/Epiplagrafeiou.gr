
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Armchair, Briefcase, Files, Library, Monitor, Wrench } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const mainCategories = [
    { name: 'Καρέκλες', slug: 'karekles-grafeiou', Icon: Armchair },
    { name: 'Γραφεία', slug: 'grafeia', Icon: Briefcase },
    { name: 'Συρταριέρες', slug: 'syrtarieres-kai-ntoulapia', Icon: Files },
    { name: 'Ραφιέρες', slug: 'bibliothikes-kai-rafieres', Icon: Library },
    { name: 'Αξεσουάρ', slug: 'aksesouar-grafeiou', Icon: Monitor },
    { name: 'Ανταλλακτικά', slug: 'antallaktika-gia-karekles-grafeiou', Icon: Wrench },
]

export default function HomePageClient() {
  const { products, isLoaded } = useProducts();
  const featuredProducts = products.slice(0, 4);
  const heroSlides = PlaceHolderImages.filter(img => img.id.startsWith('hero-slide-'));

  return (
    <div className="flex flex-col">
       <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {heroSlides.length > 0 ? (
            heroSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative h-[250px] md:h-[350px] lg:h-[450px]">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.description}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={slide.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                    <h1 className="text-3xl font-bold md:text-5xl lg:text-6xl">{slide.title}</h1>
                    <p className="mt-4 max-w-lg text-lg">{slide.description}</p>
                    {slide.buttonText && slide.buttonLink && (
                      <Button asChild className="mt-8">
                        <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem>
              <div className="relative h-[250px] md:h-[350px] lg:h-[450px] bg-secondary flex items-center justify-center">
                <p className="text-muted-foreground">Hero images are loading...</p>
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
      </Carousel>

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
            {!isLoaded ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full" />)
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
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
