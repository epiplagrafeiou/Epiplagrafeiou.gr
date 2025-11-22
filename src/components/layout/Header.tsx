
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
import { createSlug, cn } from '@/lib/utils';
import { useWishlist } from '@/lib/wishlist-context';
import Image from 'next/image';

const categoryTree = [
  {
    id: 'cat-grafeio',
    name: 'ΓΡΑΦΕΙΟ',
    children: [
      { id: 'sub-1-1', name: 'Γραφεία', href: '/category/grafeio/grafeia', image: 'https://picsum.photos/seed/grafeia/200/200' },
      { id: 'sub-1-2', name: 'Καρέκλες Γραφείου', href: '/category/grafeio/karekles-grafeiou', image: 'https://picsum.photos/seed/karekles/200/200' },
      { id: 'sub-1-3', name: 'Βιβλιοθήκες', href: '/category/grafeio/bibliothikes', image: 'https://picsum.photos/seed/bibliothikes/200/200' },
      { id: 'sub-1-4', name: 'Συρταριέρες', href: '/category/grafeio/syrtarieres', image: 'https://picsum.photos/seed/syrtarieres/200/200' },
      { id: 'sub-1-5', name: 'Ραφιέρες', href: '/category/grafeio/rafieres', image: 'https://picsum.photos/seed/rafieres/200/200' },
      { id: 'sub-1-6', name: 'Ντουλάπες', href: '/category/grafeio/ntoulapes', image: 'https://picsum.photos/seed/ntoulapes/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-grafeio/400/600'
  },
  {
    id: 'cat-saloni',
    name: 'ΣΑΛΟΝΙ',
    children: [
      { id: 'sub-2-1', name: 'Καναπέδες', href: '/category/saloni/kanapedes', image: 'https://picsum.photos/seed/kanapedes/200/200' },
      { id: 'sub-2-2', name: 'Πολυθρόνες', href: '/category/saloni/polythrones', image: 'https://picsum.photos/seed/polythrones/200/200' },
      { id: 'sub-2-3', name: 'Τραπεζάκια Σαλονιού', href: '/category/saloni/trapezakia-saloniou', image: 'https://picsum.photos/seed/trapezakia/200/200' },
      { id: 'sub-2-4', name: 'Έπιπλα TV', href: '/category/saloni/epipla-tv', image: 'https://picsum.photos/seed/epipla-tv/200/200' },
      { id: 'sub-2-5', name: 'Συνθέσεις Σαλονιού', href: '/category/saloni/syntheseis-saloniou', image: 'https://picsum.photos/seed/syntheseis/200/200' },
      { id: 'sub-2-6', name: 'Μπουφέδες', href: '/category/saloni/mpoufedes', image: 'https://picsum.photos/seed/mpoufedes/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-saloni/400/600'
  },
  {
    id: 'cat-krevatokamara',
    name: 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ',
    children: [
       { id: 'sub-3-1', name: 'Κρεβάτια', href: '/category/krevatokamara/krevatia', image: 'https://picsum.photos/seed/krevatia/200/200' },
       { id: 'sub-3-2', name: 'Κομοδίνα', href: '/category/krevatokamara/komodina', image: 'https://picsum.photos/seed/komodina/200/200' },
       { id: 'sub-3-3', name: 'Συρταριέρες', href: '/category/krevatokamara/syrtarieres', image: 'https://picsum.photos/seed/syrtarieres-krev/200/200' },
       { id: 'sub-3-4', name: 'Ντουλάπες', href: '/category/krevatokamara/ntoulapes', image: 'https://picsum.photos/seed/ntoulapes-krev/200/200' },
       { id: 'sub-3-5', name: 'Λευκά Είδη', href: '/category/krevatokamara/lefka-eidi', image: 'https://picsum.photos/seed/lefka-eidi/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-krevatokamara/400/600'
  },
  {
    id: 'cat-exoterikos',
    name: 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ',
    children: [
        { id: 'sub-4-1', name: 'Σετ Τραπεζαρίες Κήπου', href: '/category/exoterikos-xoros/set-trapezaries-kipou', image: 'https://picsum.photos/seed/set-kipou/200/200' },
        { id: 'sub-4-2', name: 'Καρέκλες Κήπου', href: '/category/exoterikos-xoros/karekles-kipou', image: 'https://picsum.photos/seed/karekles-kipou/200/200' },
        { id: 'sub-4-3', name: 'Τραπέζια Κήπου', href: '/category/exoterikos-xoros/trapezia-kipou', image: 'https://picsum.photos/seed/trapezia-kipou/200/200' },
        { id: 'sub-4-4', name: 'Ομπρέλες & Σκίαση', href: '/category/exoterikos-xoros/ombreles-skiasi', image: 'https://picsum.photos/seed/ombreles/200/200' },
        { id: 'sub-4-5', name: 'Αιώρες', href: '/category/exoterikos-xoros/aiores', image: 'https://picsum.photos/seed/aiores/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-exoterikos/400/600'
  },
  {
    id: 'cat-fotismos',
    name: 'ΦΩΤΙΣΜΟΣ',
    children: [
        { id: 'sub-5-1', name: 'Φωτιστικά Οροφής', href: '/category/fotismos/fotistika-orofis', image: 'https://picsum.photos/seed/orofis/200/200' },
        { id: 'sub-5-2', name: 'Φωτιστικά Δαπέδου', href: '/category/fotismos/fotistika-dapedou', image: 'https://picsum.photos/seed/dapedou/200/200' },
        { id: 'sub-5-3', name: 'Επιτραπέζια Φωτιστικά', href: '/category/fotismos/epitrapezia-fotistika', image: 'https://picsum.photos/seed/epitrapezia/200/200' },
        { id: 'sub-5-4', name: 'Απλίκες', href: '/category/fotismos/aplikes', image: 'https://picsum.photos/seed/aplikes/200/200' },
        { id: 'sub-5-5', name: 'Ταινίες LED', href: '/category/fotismos/tainies-led', image: 'https://picsum.photos/seed/led/200/200' },
        { id: 'sub-5-6', name: 'Παιδικά Φωτιστικά', href: '/category/fotismos/paidika-fotistika', image: 'https://picsum.photos/seed/paidika/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-fotismos/400/600'
  },
  {
    id: 'cat-diakosmisi',
    name: 'ΔΙΑΚΟΣΜΗΣΗ',
    children: [
      { id: 'sub-6-1', name: 'Πίνακες', href: '/category/diakosmisi/pinakes', image: 'https://picsum.photos/seed/pinakes/200/200' },
      { id: 'sub-6-2', name: 'Καθρέπτες', href: '/category/diakosmisi/kathreptes', image: 'https://picsum.photos/seed/kathreptes/200/200' },
      { id: 'sub-6-3', name: 'Τεχνητά φυτά', href: '/category/diakosmisi/texnita-fyta', image: 'https://picsum.photos/seed/fyta/200/200' },
      { id: 'sub-6-5', name: 'Διακοσμητικά Μαξιλάρια', href: '/category/diakosmisi/diakosmitika-maxilaria', image: 'https://picsum.photos/seed/maxilaria/200/200' },
      { id: 'sub-6-6', name: 'Χαλιά', href: '/category/diakosmisi/xalia', image: 'https://picsum.photos/seed/xalia/200/200' },
      { id: 'sub-6-7', name: 'Κεριά', href: '/category/diakosmisi/keria', image: 'https://picsum.photos/seed/keria/200/200' },
      { id: 'sub-6-8', name: 'Κουβέρτες & Ριχτάρια', href: '/category/diakosmisi/koybertes-kai-rixtaria', image: 'https://picsum.photos/seed/koybertes-rixtaria/200/200' },
      { id: 'sub-6-9', name: 'Επένδυση & Διακόσμηση Τοίχου', href: '/category/diakosmisi/ependysi-kai-diakosmisi-toixou', image: 'https://picsum.photos/seed/ependysi-toixou/200/200' },
      { id: 'sub-6-11', name: 'Διαχύτες Αρωμάτων', href: '/category/diakosmisi/diaxytes-aromaton', image: 'https://picsum.photos/seed/diaxytes/200/200' },
      { id: 'sub-6-12', name: 'Κορνίζες', href: '/category/diakosmisi/kornizes', image: 'https://picsum.photos/seed/kornizes/200/200' },
      { id: 'sub-6-13', name: 'Ρολόγια', href: '/category/diakosmisi/rologia', image: 'https://picsum.photos/seed/rologia/200/200' },
      { id: 'sub-6-14', name: 'Luxury Decor', href: '/category/diakosmisi/luxury-decor', image: 'https://picsum.photos/seed/luxury-decor/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-diakosmisi/400/600'
  },
   {
    id: 'cat-aksesouar',
    name: 'Αξεσουάρ',
    children: [
       { id: 'sub-7-1', name: 'Καλόγεροι', href: '/category/aksesouar/kalogeroi', image: 'https://picsum.photos/seed/kalogeroi/200/200' },
       { id: 'sub-7-2', name: 'Κρεμάστρες', href: '/category/aksesouar/kremastres', image: 'https://picsum.photos/seed/kremastres/200/200' },
       { id: 'sub-7-3', name: 'Παπουτσοθήκες', href: '/category/aksesouar/papoutsothikes', image: 'https://picsum.photos/seed/papoutsothikes/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-aksesouar/400/600'
  },
  {
    id: 'cat-xmas',
    name: 'Χριστουγεννιάτικα',
    children: [
        { id: 'sub-8-1', name: 'Χριστουγεννιάτικα Δέντρα', href: '/category/xristougenniatika/dentra', image: 'https://picsum.photos/seed/xmas-dentra/200/200' },
        { id: 'sub-8-2', name: 'Χριστουγεννιάτικα Στολίδια', href: '/category/xristougenniatika/stolidia', image: 'https://picsum.photos/seed/xmas-stolidia/200/200' },
        { id: 'sub-8-3', name: 'Χριστουγεννιάτικα Λαμπάκια', href: '/category/xristougenniatika/lampakia', image: 'https://picsum.photos/seed/xmas-lampakia/200/200' },
    ],
    promoImage: 'https://picsum.photos/seed/promo-xmas/400/600'
  }
];


const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { image?: string }
>(({ className, title, children, image, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'group flex h-full w-full select-none flex-col items-center justify-start gap-2 rounded-md p-3 text-center no-underline outline-none transition-colors hover:bg-accent/50 focus:bg-accent/50',
            className
          )}
          {...props}
        >
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
            {image ? (
              <Image
                src={image}
                alt={title || ''}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {title}
              </div>
            )}
          </div>
          <div className="text-sm font-medium leading-tight text-foreground">
            {title}
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

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
  
  const renderMobileTree = (nodes: typeof categoryTree, parentSlug = '') => {
    return nodes.map((node) => {
      const currentSlug = `${parentSlug}/${createSlug(node.name)}`;

      if (node.children && node.children.length > 0) {
        return (
          <Collapsible key={node.id} className="group">
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
                {renderMobileTree(node.children as typeof categoryTree, currentSlug)}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      }

      return (
        <li key={node.id}>
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

  const desktopNav = (
    <NavigationMenu>
      <NavigationMenuList>
        {categoryTree.map((category) => (
          <NavigationMenuItem key={category.id}>
            <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
            <NavigationMenuContent>
                <div className="container mx-auto">
                    <div className="grid w-full grid-cols-[3fr_1fr] gap-6 p-4">
                        <ul className="grid grid-cols-6 gap-3">
                        {(category.children || []).map((child) => (
                           <ListItem
                              key={child.id}
                              title={child.name}
                              href={child.href}
                              image={child.image}
                            >
                                {child.name}
                            </ListItem>
                        ))}
                        </ul>
                        <div className="relative hidden h-full min-h-[300px] w-full overflow-hidden rounded-md lg:block">
                        <Image
                            src={category.promoImage}
                            alt={`${category.name} Promotion`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-lg font-bold">{category.name}</h3>
                                <p className="text-sm">Ανακάλυψε τις προσφορές μας</p>
                        </div>
                        </div>
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

  const mobileNav = (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`absolute right-0 top-0 h-full w-[90%] max-w-[420px] transform bg-background shadow-lg transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
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

        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <form onSubmit={handleSearch} className="p-4">
            <Input
              placeholder="Αναζήτηση..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="flex flex-col divide-y">
            {renderMobileTree(categoryTree)}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
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
              <Button
                variant="ghost"
                className="hidden md:flex items-center gap-2"
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
              className="hidden md:inline-flex relative"
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

        <div className="hidden h-12 items-center justify-center md:flex">
          {desktopNav}
        </div>
      </div>
      {mobileNav}
    </header>
  );
}
