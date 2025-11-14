'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu, X, ChevronRight, Armchair, Briefcase, Files, Library, Monitor, Wrench } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

const mainCategories = [
    { name: 'Καρέκλες Γραφείου', slug: 'karekles-grafeiou', Icon: Armchair },
    { name: 'Γραφεία', slug: 'grafeia', Icon: Briefcase },
    { name: 'Συρταριέρες & Ντουλάπια', slug: 'syrtarieres-kai-ntoulapia', Icon: Files },
    { name: 'Βιβλιοθήκες & Ραφιέρες', slug: 'bibliothikes-kai-rafieres', Icon: Library },
    { name: 'Αξεσουάρ Γραφείου', slug: 'aksesouar-grafeiou', Icon: Monitor },
    { name: 'Ανταλλακτικά', slug: 'antallaktika', Icon: Wrench },
]

export default function Header() {
  const { itemCount } = useCart();
  const { user, isUserLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { allCategories } = useProducts();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }

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

  const desktopNav = (
      <nav className="hidden items-center gap-6 md:flex">
        {mainCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group relative font-medium"
          >
            {category.name}
            <span className="absolute bottom-0 left-0 h-0.5 w-full scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"></span>
          </Link>
        ))}
      </nav>
  )

  const mobileNav = (
    <div className={`fixed inset-0 z-40 bg-background transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
             <Link href="/" onClick={handleLinkClick}>
                <Logo />
             </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
            </Button>
        </div>
        <div className="p-4">
            <div className="relative mb-4">
                <Input placeholder="Αναζήτηση..." className="pr-10" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <nav className="flex flex-col divide-y">
                {renderCategoryTree(categoryTree)}
            </nav>
        </div>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/">
          <Logo />
        </Link>
        
        {desktopNav}

        <div className="flex items-center gap-2">
           <div className="relative hidden md:block">
            <Input placeholder="Αναζήτηση..." className="w-64 pr-10" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          
          <LoginDialog>
            <Button variant="ghost" size="icon" aria-label="My Account">
              <User />
            </Button>
          </LoginDialog>
          
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
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </Button>
        </div>
      </div>
      {mobileNav}
    </header>
  );
}
