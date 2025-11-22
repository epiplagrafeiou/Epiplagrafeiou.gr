
'use client';

import { useState, useMemo, useEffect } from 'react';
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
  ChevronRight
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
} from "@/components/ui/navigation-menu"
import { createSlug, cn } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import React from 'react';

/* ---------------- REUSABLE LIST ITEM ----------------- */
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem";


/* ------------------------ HEADER ------------------------ */
export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [treeReady, setTreeReady] = useState(false); // 🚀 NO MORE FLICKER
  const router = useRouter();

  /* ------------ FETCH CATEGORIES FROM FIRESTORE ------------ */
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: fetchedCategories } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

  /* ------------ BUILD CATEGORY TREE (DEDUPED) -------------- */
  const categoryTree = useMemo(() => {
    if (!fetchedCategories) return [];

    const categoriesById: Record<string, StoreCategory> = {};
    let rootCategories: StoreCategory[] = [];

    // Normalize & structure
    fetchedCategories.forEach(cat => {
      categoriesById[cat.id] = {
        ...cat,
        parentId: cat.parentId || null,
        children: []
      };
    });

    // Build tree structure
    fetchedCategories.forEach(cat => {
      const node = categoriesById[cat.id];

      if (node.parentId && categoriesById[node.parentId]) {
        categoriesById[node.parentId].children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    // 🔥 Remove duplicates at root level
    rootCategories = [...new Map(rootCategories.map(c => [c.id, c])).values()];

    const sortRecursive = (categories: StoreCategory[]) => {
      categories.forEach(c => {
        c.children = [...new Map(c.children.map(x => [x.id, x])).values()];
        sortRecursive(c.children);
      });
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    sortRecursive(rootCategories);

    // Custom priority order
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
      const indexA = desiredOrder.indexOf(a.name.toUpperCase());
      const indexB = desiredOrder.indexOf(b.name.toUpperCase());
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return rootCategories;
  }, [fetchedCategories]);

  // 🚀 MAKE NAV ALWAYS READY ON FIRST PAINT
  useEffect(() => {
    if (categoryTree.length > 0) {
      setTreeReady(true);
    }
  }, [categoryTree]);

  /* ----------------------- SEARCH -------------------------- */
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
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-sm font-medium">
              <Link href={`/category${currentSlug}`} className="flex-grow">{node.name}</Link>
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
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
          <Link href={`/category${currentSlug}`} className="block py-2 text-sm">
            {node.name}
          </Link>
        </li>
      );
    });
  };

  if (!treeReady) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm h-20 flex items-center px-4">
        <Logo />
      </header>
    );
  }

  /* ---------------------- DESKTOP NAV ----------------------- */
  const desktopNav = (
    <NavigationMenu>
      <NavigationMenuList>
        {categoryTree.map(category => (
          <NavigationMenuItem key={category.id}>
            <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {category.children.map((component) => (
                  <ListItem
                    key={component.id}
                    title={component.name}
                    href={`/category/${createSlug(category.name)}/${createSlug(component.name)}`}
                  />
                ))}
              </ul>
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

  /* ---------------------- MOBILE NAV ------------------------ */
  const mobileNav = (
    <div className={`fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden 
      ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

  /* ------------------- FINAL RENDER ---------------------- */
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">

          {/* Left side (logo + mobile menu) */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop search */}
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

          {/* Right icons */}
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

        {/* Desktop nav */}
        <div className="hidden h-12 items-center justify-center md:flex">
          {desktopNav}
        </div>
      </div>

      {mobileNav}
    </header>
  );
}
