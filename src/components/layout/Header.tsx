
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
import { createSlug } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';


const mainCategories = [
    { name: 'ΓΡΑΦΕΙΟ', slug: 'grafeio' },
    { name: 'ΣΑΛΟΝΙ', slug: 'saloni' },
    { name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ', slug: 'krevatokamara' },
    { name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ', slug: 'exoterikos-xoros' },
    { name: 'ΑΞΕΣΟΥΑΡ', slug: 'aksesouar' },
    { name: 'ΦΩΤΙΣΜΟΣ', slug: 'fotismos' },
    { name: 'ΔΙΑΚΟΣΜΗΣΗ', slug: 'diakosmisi' },
    { name: 'ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ', slug: 'christougenniatika' },
];

export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };
  
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const renderMobileTree = (nodes: typeof mainCategories) => {
    return nodes.map(main => (
        <Collapsible key={main.slug} className="group border-b">
            <div className="flex items-center justify-between p-4">
                 <Link href={`/category/${main.slug}`} onClick={handleLinkClick} className="font-semibold flex-grow">{main.name}</Link>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90"/>
                    </Button>
                 </CollapsibleTrigger>
            </div>
        </Collapsible>
    ))
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-6 w-6" />
            </Button>
            <Link href="/">
                <Logo />
            </Link>
        </div>
        
        <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
                 {mainCategories.map((category) => (
                    <NavigationMenuItem key={category.slug}>
                        <Link href={`/category/${category.slug}`} legacyBehavior passHref>
                           <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                               {category.name}
                           </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                 ))}
            </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative hidden md:block">
                <Input 
                    placeholder="Αναζήτηση..." 
                    className="w-64 pr-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                    <Search className="h-5 w-5 text-muted-foreground" />
                </Button>
            </form>
          
            <LoginDialog>
                <Button variant="ghost" size="icon" aria-label="My Account">
                    <User />
                </Button>
            </LoginDialog>

            <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/wishlist">
                  <Heart />
                   {wishlistCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
            </Button>
          
            <Button variant="ghost" size="icon" asChild aria-label="Cart">
                <Link href="/cart">
                    <div className="relative">
                        <ShoppingCart />
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
      
       {/* Mobile Menu Drawer */}
       <div className={`fixed inset-0 z-50 lg:hidden ${ isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none' }`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 transition-opacity ${ isMobileMenuOpen ? 'opacity-100' : 'opacity-0' }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Content */}
            <div className={`relative z-10 h-full w-4/5 max-w-sm bg-background shadow-xl transition-transform duration-300 ${ isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full' }`}>
                <div className="flex h-20 items-center justify-between border-b px-4">
                    <Logo />
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
                <div className="p-4">
                    <form onSubmit={handleSearch} className="relative mb-4">
                        <Input 
                            placeholder="Αναζήτηση..." 
                            className="pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                             <Search className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </form>
                    <nav className="flex flex-col divide-y bg-background">
                        {renderMobileTree(mainCategories)}
                    </nav>
                </div>
            </div>
       </div>
    </header>
  );
}
