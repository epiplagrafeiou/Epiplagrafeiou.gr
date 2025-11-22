
'use client';

import { useState, useMemo } from 'react';
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
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { LoginDialog } from '@/components/layout/LoginDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createSlug } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import React from 'react';

// This is a placeholder for your promotional images.
// You can replace these with real image URLs.
const promoImages: { [key: string]: string } = {
  'ΓΡΑΦΕΙΟ': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1935&auto=format&fit=crop',
  'ΣΑΛΟΝΙ': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop',
  'ΚΡΕΒΑΤΟΚΑΜΑΡΑ': 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=2070&auto=format&fit=crop',
};


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

  const { data: fetchedCategories } =
    useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

  const categoryTree = useMemo(() => {
    if (!fetchedCategories) return [];

    const normalized = fetchedCategories.map(cat => ({
      ...cat,
      parentId: cat.parentId === '' || cat.parentId == null ? null : cat.parentId
    }));

    const categoriesById: Record<string, StoreCategory> = {};
    const rootCategories: StoreCategory[] = [];

    normalized.forEach(cat => {
      categoriesById[cat.id] = {
        ...cat,
        children: []
      };
    });

    normalized.forEach(cat => {
      const node = categoriesById[cat.id];
      if (node.parentId && categoriesById[node.parentId]) {
        categoriesById[node.parentId].children.push(node);
      } else {
        if (!rootCategories.some(r => r.id === node.id)) {
          rootCategories.push(node);
        }
      }
    });

    const sortRecursive = (list: StoreCategory[]) => {
      list.forEach(c => sortRecursive(c.children));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    };
    sortRecursive(rootCategories);

    const desiredOrder = [
      'ΓΡΑΦΕΙΟ',
      'ΣΑΛΟΝΙ',
      'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
      'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
      'ΑΞΕΣΟΥΑΡ',
      'ΦΩΤΙΣΜΟΣ',
      'ΔΙΑΚΟΣΜΗΣΗ',
      'ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ'
    ];

    rootCategories.sort((a, b) => {
      const A = desiredOrder.indexOf(a.name.toUpperCase());
      const B = desiredOrder.indexOf(b.name.toUpperCase());
      return (A === -1 ? 999 : A) - (B === -1 ? 999 : B);
    });

    return rootCategories;
  }, [fetchedCategories]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const renderCategoryTree = (nodes: StoreCategory[], parentSlug = '') => {
    return nodes.map(node => {
      const currentSlug = `${parentSlug}/${createSlug(node.name)}`;

      if (node.children && node.children.length > 0) {
        return (
          <Collapsible key={node.id} className="group">
            <div className="flex w-full items-center justify-between py-2 text-left text-sm font-medium">
                <Link href={`/category${currentSlug}`} onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="flex-grow">
                    {node.name}
                </Link>
                <CollapsibleTrigger className="p-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pl-4">
              <ul className="space-y-1">
                {renderCategoryTree(node.children, currentSlug)}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      return (
        <li key={node.id}>
          <Link href={`/category${currentSlug}`} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-sm">
            {node.name}
          </Link>
        </li>
      );
    });
  };

  const desktopNav = (
    <nav className="flex items-center gap-2">
      {categoryTree.map(category => (
        <Popover key={category.id}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="font-medium">{category.name}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-screen max-w-4xl p-0">
              <div className="grid grid-cols-3 gap-6 p-6">
                  <div className="col-span-2">
                      <h3 className="font-bold mb-4 text-lg">{category.name}</h3>
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
                          {category.children.map(child => (
                              <li key={child.id}>
                                  <Link href={`/category/${createSlug(category.name)}/${createSlug(child.name)}`} className="hover:text-primary text-sm py-1 block font-medium">
                                      {child.name}
                                  </Link>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="col-span-1 hidden md:block">
                     <div className="aspect-w-4 aspect-h-3 w-full h-full rounded-lg overflow-hidden bg-muted">
                        {promoImages[category.name.toUpperCase()] ? (
                             <img src={promoImages[category.name.toUpperCase()]} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground">Promo Image</p>
                           </div>
                        )}
                     </div>
                  </div>
              </div>
          </PopoverContent>
        </Popover>
      ))}
      <Link href="/blog" className="font-medium text-sm px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">Blog</Link>
    </nav>
  );

  const mobileNav = (
    <div className={`fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
          <X className="h-6 w-6 text-foreground" />
        </Button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
        <form onSubmit={handleSearch} className="relative mb-4">
          <Input 
            placeholder="Αναζήτηση..." 
            className="pr-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </form>

        <nav className="flex flex-col divide-y">
          {renderCategoryTree(categoryTree)}
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
