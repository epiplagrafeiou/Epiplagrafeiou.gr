
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createSlug } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';

/* -------------------------------------------------------------------------- */
/*             Static Category Data (Single Source of Truth)                  */
/* -------------------------------------------------------------------------- */
const staticCategories = [
  {
    id: 'grafeio',
    name: 'ΓΡΑΦΕΙΟ',
    promoImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καρέκλες Γραφείου', image: 'https://i.postimg.cc/PqMHHW3V/karekla-grafeiou-icon.png' },
      { name: 'Γραφεία', image: 'https://i.postimg.cc/T3s0WqVz/grafeio-icon.png' },
      { name: 'Συρταριέρες Γραφείου' },
      { name: 'Βιβλιοθήκες' },
      { name: 'Ραφιέρες & Αποθηκευτικά Κουτιά' },
      { name: 'Ντουλάπες' },
      { name: 'Ανταλλακτικά' },
      { name: 'Γραφεία Υποδοχής / Reception' },
    ],
  },
  {
    id: 'saloni',
    name: 'ΣΑΛΟΝΙ',
    promoImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
    children: [
      { name: 'Καναπέδες', image: 'https://i.postimg.cc/prgAS4b4/kanapes-icon.png' },
      { name: 'Πολυθρόνες' },
      { name: 'Καρέκλες Τραπεζαρίας' },
      { name: 'Τραπέζια' },
      { name: 'Τραπεζάκια Σαλονιού' },
      { name: 'Τραπεζάκια Βοηθητικά' },
      { name: 'Έπιπλα Τηλεόρασης' },
      { name: 'Συνθέσεις Σαλονιού' },
      { name: 'Παπουτσοθήκες' },
    ],
  },
   {
    id: 'krevatokamara',
    name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
    promoImage: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=800&auto=format&fit=crop',
    children: [
        { name: 'Κρεβάτια' },
        { name: 'Κομοδίνα' },
        { name: 'Συρταριέρες' },
        { name: 'Ντουλάπες' },
        { name: 'Φουσκωτά Στρώματα' },
    ]
  },
  {
    id: 'exoterikos-xworos',
    name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
    promoImage: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=800&auto=format&fit=crop',
    children: [
        { name: 'Καρέκλες Κήπου' },
        { name: 'Τραπέζια Εξωτερικού Χώρου' },
        { name: 'Σετ Τραπεζαρίες Κήπου' },
        { name: 'Ομπρέλες Κήπου / Παραλίας' },
    ]
  },
];


/* -------------------------------------------------------------------------- */
/*                               Header Component                             */
/* -------------------------------------------------------------------------- */
export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  /* ---------------------------- MOBILE MENU TREE --------------------------- */
  const renderMobileTree = (nodes: typeof staticCategories) => {
    return nodes.map((main) => (
      <Collapsible key={main.id} className="border-b">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold">
          <Link
            href={`/category/${createSlug(main.name)}`}
            onClick={(e) => e.stopPropagation()}
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
                <li key={sub.name}>
                  <Link
                    href={`/category/${createSlug(main.name)}/${createSlug(sub.name)}`}
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
  
  /* ---------------------------- DESKTOP MEGA MENU --------------------------- */
  const desktopNav = (
    <nav className="flex items-center gap-2">
        {staticCategories.map(category => (
            <Popover key={category.id}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="font-medium">{category.name}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-4xl p-0">
                    <div className="grid grid-cols-4 gap-6 p-6">
                        <div className="col-span-3">
                            <h3 className="font-bold mb-4 text-lg">{category.name}</h3>
                            <ul className="grid grid-cols-3 gap-x-6 gap-y-2">
                                {category.children?.map(child => (
                                    <li key={child.name}>
                                        <Link href={`/category/${createSlug(category.name)}/${createSlug(child.name)}`} className="hover:text-primary text-sm py-1 block font-medium">
                                            {child.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-span-1">
                            <div className="aspect-w-4 aspect-h-3 w-full h-full rounded-lg overflow-hidden bg-muted">
                                {category.promoImage ? (
                                    <img src={category.promoImage} alt={category.name} className="w-full h-full object-cover" />
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

  /* ----------------------------- MOBILE DRAWER ---------------------------- */
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
            <nav>{renderMobileTree(staticCategories)}</nav>
        </div>
    </div>
  );

  /* ------------------------------ MAIN LAYOUT ----------------------------- */
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* Top Row: Logo, Search, Icons */}
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="shrink-0"><Logo /></Link>
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
            <LoginDialog><Button variant="ghost" className="hidden md:flex items-center gap-2"><User /><span className="text-sm font-medium">Σύνδεση</span></Button></LoginDialog>
            <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex relative"><Link href="/wishlist"><Heart />{wishlistCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{wishlistCount}</span>}</Link></Button>
            <Button variant="ghost" size="icon" asChild><Link href="/cart"><div className="relative"><ShoppingCart />{itemCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{itemCount}</span>}</div></Link></Button>
          </div>
        </div>

        {/* Bottom Row: Desktop Navigation */}
        <div className="hidden h-12 items-center justify-center md:flex">
          {desktopNav}
        </div>
      </div>
      {mobileNav}
    </header>
  );
}
