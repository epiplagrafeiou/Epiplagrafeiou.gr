'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { LoginDialog } from '@/components/layout/LoginDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { createSlug, cn } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import type { StoreCategory } from '@/components/admin/CategoryManager';

// This is a static representation of your category structure.
// It ensures the menu is interactive immediately on page load.
const mainCategories: Array<{
  name: string;
  slug: string;
  children: { name: string; slug: string; image: string }[];
  promoImage: string;
}> = [
  {
    name: 'ΓΡΑΦΕΙΟ',
    slug: 'grafeio',
    promoImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καρέκλες γραφείου', slug: 'karekles-grafeiou', image: 'https://i.postimg.cc/PqMHHW3V/karekla-grafeiou-icon.png' },
      { name: 'Γραφεία', slug: 'grafeia', image: 'https://i.postimg.cc/T3s0WqVz/grafeio-icon.png' },
      { name: 'Συρταριέρες Γραφείου', slug: 'syrtarieres-grafeiou', image: 'https://i.postimg.cc/W3wZzC6N/syrtariera-icon.png' },
      { name: 'Βιβλιοθήκες', slug: 'bibliothikes', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
      { name: 'Ανταλλακτικά', slug: 'antallaktika', image: 'https://i.postimg.cc/k4GvD1c2/antallaktika-icon.png' },
    ],
  },
  {
    name: 'ΣΑΛΟΝΙ',
    slug: 'saloni',
    promoImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καναπέδες', slug: 'kanapedes', image: 'https://i.postimg.cc/prgAS4b4/kanapes-icon.png' },
      { name: 'Πολυθρόνες', slug: 'polythrones', image: 'https://i.postimg.cc/j5BqxwLz/polythrona-icon.png' },
      { name: 'Τραπεζάκια Σαλονιού', slug: 'trapezakia-saloniou', image: 'https://i.postimg.cc/Hn5msC7H/trapezaki-icon.png' },
      { name: 'Έπιπλα Τηλεόρασης', slug: 'eplipa-thleorashs', image: 'https://i.postimg.cc/nL5gCg6G/epiplo-tv-icon.png' },
    ],
  },
   {
    name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
    slug: 'krevatokamara',
    promoImage: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=800&auto=format&fit=crop',
    children: [
        { name: 'Κρεβάτια', slug: 'krevatia', image: 'https://i.postimg.cc/mkZgC2Fz/krevati-icon.png' },
        { name: 'Κομοδίνα', slug: 'komodina', image: 'https://i.postimg.cc/wMPb9kS4/komodino-icon.png' },
        { name: 'Συρταριέρες', slug: 'syrtarieres', image: 'https://i.postimg.cc/W3wZzC6N/syrtariera-icon.png' },
        { name: 'Ντουλάπες', slug: 'ntoulapes', image: 'https://i.postimg.cc/sXQ3gGjY/ntoulapa-icon.png' },
    ]
  },
  {
    name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
    slug: 'exoterikos-xworos',
    promoImage: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καρέκλες Κήπου', slug: 'karekles-kipou', image: 'https://i.postimg.cc/L8y2GZJ3/karekla-kipou-icon.png' },
      { name: 'Τραπέζια Κήπου', slug: 'trapezia-kipou', image: 'https://i.postimg.cc/FKk0qD9L/trapezi-kipou-icon.png' },
      { name: 'Ομπρέλες', slug: 'ompreles', image: 'https://i.postimg.cc/zX8QY7yG/omprela-icon.png' },
    ]
  },
  {
    name: 'ΑΞΕΣΟΥΑΡ',
    slug: 'aksesouar',
    promoImage: 'https://images.unsplash.com/photo-1525925817005-513542563f68?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καλόγεροι', slug: 'kalogeroi', image: 'https://i.postimg.cc/3wY7x3Gf/kalogeros-icon.png' },
      { name: 'Βάσεις Τηλεόρασης', slug: 'vaseis-thleorashs', image: 'https://i.postimg.cc/pT3tWpXk/vasi-tv-icon.png' },
    ]
  },
  {
    name: 'ΦΩΤΙΣΜΟΣ',
    slug: 'fotismos',
    promoImage: 'https://images.unsplash.com/photo-1608433499718-d4a9913a856f?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Φωτιστικά Οροφής', slug: 'fotistika-orofhs', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
      { name: 'Φωτιστικά Δαπέδου', slug: 'fotistika-dapedou', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
    ]
  },
  {
    name: 'ΔΙΑΚΟΣΜΗΣΗ',
    slug: 'diakosmisi',
    promoImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    children: [
        { name: 'Καθρέπτες', slug: 'kathreptes', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
        { name: 'Ρολόγια', slug: 'rologia', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
    ]
  },
  {
    name: 'ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ',
    slug: 'xristougenniatika',
    promoImage: 'https://images.unsplash.com/photo-1576234336034-5887214b7c33?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Χριστουγεννιάτικα Δέντρα', slug: 'xristougenniatika-dentd', image: 'https://i.postimg.cc/Y0gR6ZgT/bibliothiki-icon.png' },
    ]
  }
];

export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  
  const { data: fetchedCategories } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

  const categoryTree = useMemo(() => {
    if (!fetchedCategories || fetchedCategories.length === 0) {
      return mainCategories; 
    }

    const categoriesById: Record<string, StoreCategory & { children: StoreCategory[] }> = {};
    const rootCategories: (StoreCategory & { children: StoreCategory[] })[] = [];

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
    
    // Fallback to static if tree is empty after processing
    return rootCategories.length > 0 ? rootCategories : mainCategories;
  }, [fetchedCategories]);


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  
  const renderMobileTree = (nodes: typeof categoryTree) => {
    return nodes.map((main) => (
      <Collapsible key={main.slug} className="border-b">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold">
          <Link
            href={`/category/${main.slug}`}
            onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}
            className="flex-grow"
          >
            {main.name}
          </Link>
          {main.children && main.children.length > 0 && <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />}
        </CollapsibleTrigger>
        {main.children && main.children.length > 0 && (
          <CollapsibleContent className="pl-4 pb-2">
            <ul className="space-y-1">
              {main.children.map((sub) => (
                <li key={sub.slug}>
                  <Link
                    href={`/category/${main.slug}/${sub.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    ));
  };
  
  const desktopNav = (
      <NavigationMenu>
        <NavigationMenuList>
        {categoryTree.map(category => (
            <NavigationMenuItem key={category.slug}>
                <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="absolute left-0 top-0 w-full">
                    <div className="container mx-auto">
                        <div className="flex gap-6 p-6">
                            <ul className="grid grid-cols-3 gap-x-6 gap-y-4 w-2/3">
                                {(category.children || []).map(child => (
                                    <li key={child.slug} className="group">
                                    <Link href={`/category/${category.slug}/${child.slug}`} legacyBehavior passHref>
                                        <NavigationMenuLink className="flex flex-col items-center gap-2 text-center no-underline">
                                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-muted/30 transition-colors group-hover:bg-muted/60">
                                                <Image src={child.image} alt={child.name} width={64} height={64} className="h-auto w-auto max-h-[64px] max-w-[64px]" unoptimized/>
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">{child.name}</span>
                                        </NavigationMenuLink>
                                    </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="w-1/3">
                                <Link href={`/category/${category.slug}`} className="block h-full w-full overflow-hidden rounded-lg">
                                    <Image src={category.promoImage} alt={category.name} width={400} height={400} className="h-full w-full object-cover" />
                                </Link>
                            </div>
                        </div>
                    </div>
                  </div>
                </NavigationMenuContent>
            </NavigationMenuItem>
        ))}
         <NavigationMenuItem>
            <Link href="/blog" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Blog
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
  );

  const mobileNav = (
    <div className={`fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}><Logo /></Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
            </Button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
            <form onSubmit={handleSearch} className="relative mb-4">
                <Input placeholder="Αναζήτηση..." className="pr-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </form>
            <nav className="flex flex-col bg-background divide-y">
              {renderMobileTree(categoryTree)}
            </nav>
        </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          <div className="hidden flex-1 px-4 lg:px-12 md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground" />
              <Input
                placeholder="Αναζητήστε προϊόντα, δωμάτια, ιδέες..."
                className="h-12 w-full rounded-full bg-secondary pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <LoginDialog>
              <Button variant="ghost" className="hidden md:flex items-center gap-2">
                <User className="text-foreground" />
                <span className="text-sm font-medium text-foreground">Σύνδεση/Εγγραφή</span>
              </Button>
            </LoginDialog>

            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex relative">
              <Link href="/wishlist">
                <Heart className="text-foreground" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <div className="relative">
                  <ShoppingCart className="text-foreground" />
                  {itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>
            </Button>
          </div>
        </div>

        <div className="hidden h-12 items-center justify-center md:flex">
          {desktopNav}
        </div>
      </div>
      {mobileNav}
    </header>
  );
}
