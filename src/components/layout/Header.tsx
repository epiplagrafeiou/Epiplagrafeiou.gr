
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { useUser } from '@/firebase';
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
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';

const staticCategories: Array<{
  id?: string;
  name: string;
  slug?: string;
  children?: { id?: string; name: string; slug?: string; image?: string }[];
  promoImage?: string; 
}> = [
  {
    id: 'static-grafeio',
    name: 'ΓΡΑΦΕΙΟ',
    promoImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800',
    children: [
      { name: 'Καρέκλες γραφείου', image: 'https://i.postimg.cc/zXqG9zWc/ergonomic-chair.png' },
      { name: 'Γραφεία', image: 'https://i.postimg.cc/13Yqk3j1/desk.png' },
      { name: 'Συρταριέρες Γραφείου', image: 'https://i.postimg.cc/L6f2S93g/file-cabinet.png' },
      { name: 'Βιβλιοθήκες', image: 'https://i.postimg.cc/mkb7gQt2/bookcase.png' },
      { name: 'Ραφιέρες / Αποθηκευτικά Κουτιά', image: 'https://i.postimg.cc/x8P9N2r0/shelves.png'},
      { name: 'Ντουλάπες', image: 'https://i.postimg.cc/Y0gQkZ4H/wardrobe.png' },
      { name: 'Ανταλλακτικά', slug: 'grafeio/antallaktika' },
      { name: 'Γραφεία υποδοχής / Reception' },
    ],
  },
  {
    id: 'static-salonι',
    name: 'ΣΑΛΟΝΙ',
    promoImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800',
    children: [
      { name: 'Καναπέδες', image: 'https://i.postimg.cc/1zQPX8C0/sofa.png' },
      { name: 'Πολυθρόνες', image: 'https://i.postimg.cc/zXqG9zWc/ergonomic-chair.png' },
      { name: 'Καρέκλες τραπεζαρίας', image: 'https://i.postimg.cc/T1QdYJ2T/chair.png' },
      { name: 'Τραπέζια', image: 'https://i.postimg.cc/x8p2JjXh/table.png' },
      { name: 'Τραπεζάκια σαλονιού', image: 'https://i.postimg.cc/VvKgM7pX/coffee-table.png' },
      { name: 'Τραπεζάκια Βοηθητικά' },
      { name: 'Έπιπλα τηλεόρασης', image: 'https://i.postimg.cc/Sspg0kC4/tv-stand.png' },
      { name: 'Συνθέσεις Σαλονιού' },
      { name: 'Παπουτσοθήκες', image: 'https://i.postimg.cc/k47tT0sN/shoe-rack.png' },
    ],
  },
  {
    id: 'static-krevatokamara',
    name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
    promoImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800',
    children: [
        { name: 'Κρεβάτια', image: 'https://i.postimg.cc/L550wR0d/bed.png' },
        { name: 'Κομοδίνα', image: 'https://i.postimg.cc/L6f2S93g/file-cabinet.png' },
        { name: 'Συρταριέρες' },
        { name: 'Ντουλάπες', image: 'https://i.postimg.cc/Y0gQkZ4H/wardrobe.png' },
        { name: 'Φουσκωτά στρώματα' },
    ]
  },
  {
    id: 'static-exoterikos-xworos',
    name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
    promoImage: 'https://images.unsplash.com/photo-1588956843429-1f4a1f5923e1?q=80&w=800',
    children: [
        { name: 'Καρέκλες κήπου', image: 'https://i.postimg.cc/mD4zTj4g/garden-chair.png' },
        { name: 'Τραπέζια εξωτερικού χώρου', image: 'https://i.postimg.cc/d1GZtYJh/outdoor-table.png' },
        { name: 'Σετ τραπεζαρίες κήπου' },
        { name: 'Ομπρέλες κήπου / παραλίας' },
    ]
  },
  {
    id: 'static-aksesouar',
    name: 'ΑΞΕΣΟΥΑΡ',
    promoImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800',
  },
  {
    id: 'static-fotismos',
    name: 'ΦΩΤΙΣΜΟΣ',
    promoImage: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=800',
  },
  {
    id: 'static-diakosmisi',
    name: 'ΔΙΑΚΟΣΜΗΣΗ',
    promoImage: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=800',
  },
  {
    id: 'static-christougenniatika',
    name: 'ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ',
    promoImage: 'https://images.unsplash.com/photo-1543435133-f7a6a4a400b8?q=80&w=800',
  }
];

function normalizeNameKey(s: string | undefined) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildCategorySlug(mainName: string, childName?: string) {
  if (!childName) return `/category/${createSlug(mainName)}`;
  return `/category/${createSlug(mainName)}/${createSlug(childName)}`;
}

export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: fetchedCategories } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

  const [menuCategories, setMenuCategories] = useState(() => {
    return staticCategories.map((c) => ({
      ...c,
      id: c.id || `static-${normalizeNameKey(c.name)}`,
      children: (c.children || []).map((ch) => ({
        ...ch,
        id: ch.id || `static-child-${normalizeNameKey(c.name)}-${normalizeNameKey(ch.name)}`,
      })),
    }));
  });

  useEffect(() => {
    if (!fetchedCategories) return;

    const byId: Record<string, StoreCategory & { children?: StoreCategory[] }> = {};
    const roots: (StoreCategory & { children?: StoreCategory[] })[] = [];

    fetchedCategories.forEach((cat) => {
      byId[cat.id] = { ...cat, children: [] };
    });
    fetchedCategories.forEach((cat) => {
      if (cat.parentId && byId[cat.parentId]) {
        byId[cat.parentId].children!.push(byId[cat.id]);
      } else {
        roots.push(byId[cat.id]);
      }
    });

    const normalizedExisting = new Map<string, boolean>();
    const merged: typeof staticCategories = [];

    menuCategories.forEach((staticCat) => {
      const key = normalizeNameKey(staticCat.name);
      normalizedExisting.set(key, true);
      const match = roots.find((r) => normalizeNameKey(r.name) === key);
      if (match) {
        merged.push({
          id: match.id,
          name: match.name,
          promoImage: (match as any).promoImage || staticCat.promoImage,
          children: (match.children || []).map((ch) => ({
            id: (ch as any).id,
            name: (ch as any).name,
            slug: (ch as any).slug || undefined,
            image: (ch as any).image || undefined,
          })),
        });
      } else {
        merged.push(staticCat);
      }
    });

    roots.forEach((r) => {
      const key = normalizeNameKey(r.name);
      if (!normalizedExisting.has(key)) {
        merged.push({
          id: r.id,
          name: r.name,
          children: (r.children || []).map((ch) => ({
            id: (ch as any).id,
            name: (ch as any).name,
            slug: (ch as any).slug || undefined,
            image: (ch as any).image || undefined,
          })),
        });
      }
    });

    setMenuCategories(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  const desktopMenu = (
    <NavigationMenu>
      <NavigationMenuList>
        {menuCategories.map((main) => (
          <NavigationMenuItem key={main.id || main.name}>
            <NavigationMenuTrigger>{main.name}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="flex gap-6 p-4 lg:p-6">
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 w-[min(60vw,680px)]">
                  {(main.children || []).map((sub) => (
                    <li key={sub.id || sub.name} className="group">
                      <NavigationMenuLink asChild>
                        <Link
                          href={
                            sub.slug
                              ? `/category/${sub.slug}`
                              : buildCategorySlug(main.name, sub.name)
                          }
                          className="flex h-full w-full flex-col items-start gap-2 rounded-md p-2 no-underline"
                        >
                          <div className="h-20 w-full overflow-hidden rounded-md bg-muted/20 flex items-center justify-center">
                            {sub.image ? (
                              <img src={sub.image} alt={sub.name} className="max-h-full" />
                            ) : (
                              <div className="text-xs text-muted-foreground">{sub.name}</div>
                            )}
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground">{sub.name}</div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>

                <div className="hidden md:block w-[260px] shrink-0 rounded-md overflow-hidden bg-muted/10">
                  {main.promoImage ? (
                    <img src={main.promoImage} alt={main.name + ' promo'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">Εικόνα κατηγορίας</div>
                  )}
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

  const renderMobileTree = (nodes: typeof menuCategories) => {
    return nodes.map((main) => (
      <div key={main.id || main.name} className="border-b">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold">
            <Link href={`/category/${createSlug(main.name)}`} onClick={() => setIsMobileMenuOpen(false)}>
              {main.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 pb-2">
            <ul className="space-y-1">
              {(main.children || []).map((sub) => (
                <li key={sub.id || sub.name}>
                  <Link
                    href={
                      sub.slug
                        ? `/category/${sub.slug}`
                        : buildCategorySlug(main.name, sub.name)
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
    ));
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </div>

              <Link href="/" className="shrink-0">
                <Logo />
              </Link>
            </div>

            <div className="hidden flex-1 px-4 lg:block">
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

          <div className="hidden h-12 items-center justify-center lg:flex">{desktopMenu}</div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[90%] max-w-[420px] bg-background shadow-lg transition-transform ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Logo />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6 text-foreground" />
            </Button>
          </div>

          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <form onSubmit={handleSearch} className="p-4">
              <Input placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </form>

            <nav className="divide-y">
              {renderMobileTree(menuCategories)}
            </nav>

            <div className="p-4">
              <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-md border p-3 text-center">
                Όλα τα Προϊόντα
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

    