
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
  Truck,
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
import { createSlug } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import type { StoreCategory } from '@/components/admin/CategoryManager';

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

  const { categoryTree, mainNavLinks } = useMemo(() => {
    if (!fetchedCategories) return { categoryTree: [], mainNavLinks: [] };

    const categoriesById: Record<string, StoreCategory> = {};
    const rootCategories: StoreCategory[] = [];

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
    
    const sortRecursive = (categories: StoreCategory[]) => {
        categories.sort((a,b) => a.order - b.order);
        categories.forEach(c => sortRecursive(c.children));
    }
    
    sortRecursive(rootCategories);
    
    const navLinks = rootCategories.map(cat => ({
        name: cat.name,
        slug: `/category/${createSlug(cat.name)}`
    }));

    return { categoryTree: rootCategories, mainNavLinks: navLinks };
  }, [fetchedCategories]);


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }
  
  const renderCategoryTree = (nodes: StoreCategory[], parentSlug = '') => {
    return nodes.map(node => {
      const currentSlug = `${parentSlug}/${createSlug(node.name)}`;
      if (node.children && node.children.length > 0) {
        return (
          <Collapsible key={node.id} className="group">
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-sm font-medium">
              <span>{node.name}</span>
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
          <Link href={`/category${currentSlug}`} onClick={handleLinkClick} className="block py-2 text-sm">
            {node.name}
          </Link>
        </li>
      );
    });
  };

  const mobileNav = (
    <div className={`fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
             <Link href="/" onClick={handleLinkClick}>
                <Logo />
             </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-foreground" />
            </Button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
            <nav className="flex flex-col divide-y">
                {renderCategoryTree(categoryTree)}
            </nav>
        </div>
    </div>
  )

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* Top bar of the header */}
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Left side: Menu and Logo */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-foreground" />
              <span className="sr-only">Μενού</span>
            </Button>
             <div className="hidden md:flex flex-col items-center">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="h-6 w-6 text-foreground" />
                </Button>
                <span className="text-xs font-medium text-foreground">Μενού</span>
            </div>
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Center: Search Bar */}
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

          {/* Right side: Icons */}
          <div className="flex items-center gap-2">
            <LoginDialog>
                <Button variant="ghost" className="hidden md:flex items-center gap-2">
                    <User className="text-foreground" />
                    <span className="text-sm font-medium text-foreground">Σύνδεση/Εγγραφή</span>
                </Button>
            </LoginDialog>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Truck className="text-foreground" />
              <span className="sr-only">Delivery</span>
            </Button>
            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex relative">
              <Link href="/wishlist">
                <Heart className="text-foreground" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="Cart">
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
             <form onSubmit={handleSearch} className="relative md:hidden">
              <Button variant="ghost" size="icon" type="submit">
                <Search className="text-foreground" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar of the header (navigation) */}
        <div className="hidden h-12 items-center md:flex">
             <nav className="flex items-center gap-6">
                {mainNavLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.slug}
                    className="group relative text-sm font-semibold text-foreground"
                >
                    {link.name}
                    <span className="absolute bottom-[-2px] left-0 h-0.5 w-full scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"></span>
                </Link>
                ))}
            </nav>
        </div>
      </div>
      {mobileNav}
    </header>
  );
}
