
'use client';

import React, { useState } from 'react';
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
import { useWishlist } from '@/lib/wishlist-context';

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
        <div key={main.slug} className="border-b">
             <Link href={`/category/${main.slug}`} onClick={handleLinkClick} className="flex items-center justify-between p-4 font-semibold">
                {main.name}
            </Link>
        </div>
    ))
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </div>

              <Link href="/" className="shrink-0">
                <Logo />
              </Link>
            </div>

            <div className="hidden flex-1 px-4 lg:flex justify-center">
               <NavigationMenu>
                    <NavigationMenuList>
                         {mainCategories.map((category) => (
                            <NavigationMenuItem key={category.slug}>
                                <Link href={`/category/${category.slug}`} passHref>
                                   <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                       {category.name}
                                   </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                         ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="relative hidden md:block">
                    <Input 
                        placeholder="Αναζήτηση..." 
                        className="w-40 sm:w-64 pr-10" 
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
        </div>
      </header>
      
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
    </>
  );
}
