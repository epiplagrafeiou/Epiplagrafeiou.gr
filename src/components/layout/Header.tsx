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
import React from 'react';

/* ---------------- REUSABLE LIST ITEM ----------------- */
const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
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
  );
});
ListItem.displayName = 'ListItem';

/* ------------------------ HEADER ------------------------ */
export default function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const staticCategories = [
    {
      name: 'ΓΡΑΦΕΙΟ',
      children: [
        { name: 'Καρέκλες γραφείου' },
        { name: 'Γραφεία' },
        { name: 'Συρταριέρες Γραφείου' },
        { name: 'Βιβλιοθήκες' },
        { name: 'Ραφιέρες / Αποθηκευτικά Κουτιά' },
        { name: 'Ντουλάπες' },
        {
          name: 'Ανταλλακτικά',
          slug: 'grafeio/antallaktika-gia-karekles-grafeiou',
        },
        { name: 'Γραφεία υποδοχής / Reception' },
      ],
    },
    {
      name: 'ΣΑΛΟΝΙ',
      children: [
        { name: 'Καναπέδες' },
        { name: 'Πολυθρόνες' },
        { name: 'Καρέκλες τραπεζαρίας' },
        { name: 'Τραπέζια' },
        { name: 'Τραπεζάκια σαλονιού' },
        { name: 'Τραπεζάκια Βοηθητικά' },
        { name: 'Έπιπλα τηλεόρασης' },
        { name: 'Συνθέσεις Σαλονιού' },
        { name: 'Έπιπλα Εισόδου' },
        { name: 'Παπουτσοθήκες' },
        { name: 'Μπουφέδες' },
        { name: 'Κονσόλες' },
        { name: 'Σκαμπώ μπαρ' },
        { name: 'Πουφ & Σκαμπό' },
        { name: 'Κουρτίνες & Κουρτινόξυλα' },
      ],
    },
    {
      name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
      children: [
        { name: 'Κρεβάτια' },
        { name: 'Κομοδίνα' },
        { name: 'Συρταριέρες' },
        { name: 'Ντουλάπες' },
        { name: 'Φουσκωτά στρώματα' },
        { name: 'Λευκά Είδη' },
      ],
    },
    {
      name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
      children: [
        { name: 'Καρέκλες κήπου' },
        { name: 'Τραπέζια εξωτερικού χώρου' },
        { name: 'Σετ τραπεζαρίες κήπου' },
        { name: 'Βάσεις ομπρελών' },
        { name: 'Ομπρέλες κήπου / παραλίας' },
        { name: 'Κουτιά Αποθήκευσης Κήπου' },
        { name: 'Διακόσμηση & Οργάνωση Μπαλκονιού' },
        { name: 'Αιώρες Κήπου & Βεράντας' },
        { name: 'Λυσεις σκίασης για μπαλκόνι' },
        { name: 'Φαναράκια' },
      ],
    },
    {
      name: 'ΑΞΕΣΟΥΑΡ',
      children: [
        { name: 'Καλόγεροι' },
        { name: 'Κρεμάστρες Δαπέδου' },
        { name: 'Πολύπριζα' },
        { name: 'Βάσεις Τηλεόρασης' },
        { name: 'Σταχτοδοχεία' },
        { name: 'Στόπ Πόρτας' },
        { name: 'Σκάλες' },
      ],
    },
    {
      name: 'ΦΩΤΙΣΜΟΣ',
      children: [
        { name: 'Φωτιστικά οροφής' },
        { name: 'Φωτιστικά Δαπέδου' },
        { name: 'Επιτραπέζια φωτιστικά' },
        { name: 'Απλίκες' },
        { name: 'Ταινίες Led' },
        { name: 'Παιδικά φωτιστικά οροφής' },
        { name: 'Γιρλάντες απο Σχοινί' },
        { name: 'Φώτα Πάρτη' },
      ],
    },
    {
      name: 'ΔΙΑΚΟΣΜΗΣΗ',
      children: [
        { name: 'Πίνακες' },
        { name: 'Καθρέπτες' },
        { name: 'Τεχνητά φυτά' },
        { name: 'Διακόσμηση τοίχου' },
        { name: 'Διακοσμητικά Μαξιλάρια' },
        { name: 'Χαλιά' },
        { name: 'Κεριά' },
        { name: 'Κουβέρτες & Ριχτάρια' },
        { name: 'Επένδυση & Διακόσμηση Τοίχου' },
        { name: 'Διαχύτες Αρωμάτων' },
        { name: 'Κορνίζες' },
        { name: 'Ρολόγια' },
        { name: 'Ψάθινα & Υφασμάτινα Καλάθια' },
        { name: 'Luxury Decor' },
      ],
    },
    {
      name: 'ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ',
      children: [
        { name: 'Χριστουγεννιάτικα Δέντρα' },
        { name: 'Βάσεις Χριστουγεννιάτιων Δέντρων' },
        { name: 'Χριστουγεννιάτικα λαμπάκια Led' },
        { name: 'Ξύλινα στολίδια δέντρου' },
        { name: 'Φάτνη Χριστουγεννων' },
        { name: 'Χριστουγεννιάτικα Φωτεινά Στοιχεία' },
        { name: 'Χριστουγεννιάτικη Διακόσμηση' },
        { name: 'Μινιατούρες & Στοιχεία για το Χριστουγεννιάτικο Χωριό' },
        { name: 'Κηροπήγια & Κηροσβέστες' },
        { name: 'Χριστουγεννιάτικες Φιγούρες' },
      ],
    },
  ];

  /* ----------------------- SEARCH -------------------------- */
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const renderCategoryTree = (nodes: typeof staticCategories, parentSlug = '') => {
    return nodes.map((node) => {
      const currentSlug = `${parentSlug}/${createSlug(node.name)}`;
      if (node.children && node.children.length > 0) {
        return (
          <Collapsible key={node.name} className="group">
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-sm font-medium">
              <Link
                href={`/category${currentSlug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-grow"
              >
                {node.name}
              </Link>
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              <ul className="space-y-1">
                {renderCategoryTree(
                  node.children as typeof staticCategories,
                  currentSlug
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      }
      return (
        <li key={node.name}>
          <Link
            href={`/category${currentSlug}`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-sm"
          >
            {node.name}
          </Link>
        </li>
      );
    });
  };

  /* ---------------------- DESKTOP NAV ----------------------- */
  const desktopNav = (
    <NavigationMenu>
      <NavigationMenuList>
        {staticCategories.map((category) => (
          <NavigationMenuItem key={category.name}>
            <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {category.children.map((component) => (
                  <ListItem
                    key={component.name}
                    title={component.name}
                    href={`/category/${
                      component.slug ||
                      createSlug(category.name) + '/' + createSlug(component.name)
                    }`}
                  />
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );

  /* ---------------------- MOBILE NAV ------------------------ */
  const mobileNav = (
    <div
      className={`fixed inset-0 z-50 bg-background transition-transform duration-300 md:hidden 
      ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-6 w-6 text-foreground" />
        </Button>
      </div>

      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <form onSubmit={handleSearch} className="relative mb-4">
          <Input
            placeholder="Αναζήτηση..."
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </form>

        <nav className="flex flex-col divide-y">
          {renderCategoryTree(staticCategories)}
        </nav>
      </div>
    </div>
  );

  /* ------------------- FINAL RENDER ---------------------- */
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm md:bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Left side (logo + mobile menu) */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop search */}
          <div className="hidden flex-1 px-4 lg:px-12 md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" />
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
              <Button
                variant="ghost"
                className="hidden items-center gap-2 md:flex"
              >
                <User className="text-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Σύνδεση/Εγγραφή
                </span>
              </Button>
            </LoginDialog>

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative hidden md:inline-flex"
            >
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
