'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Camera,
  ChevronRight
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useUser } from '@/firebase';
import { LoginDialog } from '@/components/layout/LoginDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { createSlug } from '@/lib/utils';
import { useProducts } from '@/lib/products-context';

const mainNavLinks = [
    { name: 'Προϊόντα', slug: '/products' },
    { name: 'Δωμάτια', slug: '/category/rooms' },
    { name: 'Είδη Σπιτιού', slug: '/category/home-goods' },
    { name: 'Έμπνευση', slug: '/category/inspiration' },
]

export default function Header() {
  const { itemCount } = useCart();
  const { user, isUserLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { allCategories } = useProducts();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }

  // This part remains for the mobile slide-out menu logic
  const categoryTree = allCategories.reduce((acc, categoryPath) => {
    let currentLevel = acc;
    const parts = categoryPath.split(' > ');
    parts.forEach((part, index) => {
      let existingNode = currentLevel.find(node => node.name === part);
      if (!existingNode) {
        existingNode = { name: part, children: [] };
        currentLevel.push(existingNode);
      }
      if (index < parts.length - 1) {
        currentLevel = existingNode.children;
      }
    });
    return acc;
  }, [] as { name: string; children: any[] }[]);
  
  const renderCategoryTree = (nodes: { name: string; children: any[] }[], parentSlug = '') => {
    return nodes.map(node => {
      const currentSlug = `${parentSlug}/${createSlug(node.name)}`;
      if (node.children.length > 0) {
        return (
          <Collapsible key={node.name} className="group">
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
        <li key={node.name}>
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
                <X className="h-6 w-6" />
            </Button>
        </div>
        <div className="p-4">
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
              <Menu className="h-6 w-6" />
              <span className="sr-only">Μενού</span>
            </Button>
             <div className="hidden md:flex flex-col items-center">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
                <span className="text-xs font-medium">Μενού</span>
            </div>
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden flex-1 px-4 lg:px-12 md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Αναζητήστε προϊόντα, δωμάτια, ιδέες..." className="h-12 w-full rounded-full bg-secondary pl-12 pr-12" />
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Right side: Icons */}
          <div className="flex items-center gap-2">
            <LoginDialog>
                <Button variant="ghost" className="hidden md:flex items-center gap-2">
                    <User />
                    <span className="text-sm font-medium">Σύνδεση/Εγγραφή</span>
                </Button>
            </LoginDialog>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Truck />
              <span className="sr-only">Delivery</span>
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Heart />
              <span className="sr-only">Wishlist</span>
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
            <Button variant="ghost" size="icon" className="md:hidden" >
              <Search />
            </Button>
          </div>
        </div>

        {/* Bottom bar of the header (navigation) */}
        <div className="hidden h-12 items-center md:flex">
             <nav className="flex items-center gap-6">
                {mainNavLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.slug}
                    className="group relative text-sm font-semibold"
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
