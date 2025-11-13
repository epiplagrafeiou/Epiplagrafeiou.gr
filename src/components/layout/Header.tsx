
'use client';
import Link from 'next/link';
import { ShoppingBag, Search, User, Menu, ChevronDown, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import { useCart } from '@/lib/cart-context';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useProducts } from '@/lib/products-context';
import { createSlug } from '@/lib/utils';
import { LoginDialog } from './LoginDialog';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { type UserProfile } from '@/lib/user-actions';
import { doc } from 'firebase/firestore';

interface CategoryNode {
  name: string;
  slug: string;
  path: string;
  children: CategoryNode[];
}

function buildCategoryTree(categories: string[]): CategoryNode[] {
  const root: CategoryNode = { name: 'root', slug: '', path: '', children: [] };

  categories.forEach(categoryPath => {
    let currentNode = root;
    const parts = categoryPath.split(' > ');
    let currentPath = '';

    parts.forEach(part => {
      currentPath = currentPath ? `${currentPath}/${createSlug(part)}` : createSlug(part);
      let childNode = currentNode.children.find(child => child.name === part);
      if (!childNode) {
        childNode = {
          name: part,
          slug: createSlug(part),
          path: currentPath,
          children: [],
        };
        currentNode.children.push(childNode);
      }
      currentNode = childNode;
    });
  });

  return root.children;
}


function CategorySubMenu({ nodes }: { nodes: CategoryNode[] }) {
  return (
    <>
      {nodes.map(node => {
        if (node.children.length > 0) {
          return (
            <DropdownMenuSub key={node.slug}>
              <DropdownMenuSubTrigger>
                <Link href={`/category/${node.path}`} className="w-full text-left">{node.name}</Link>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <CategorySubMenu nodes={node.children} />
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        }
        return (
          <DropdownMenuItem key={node.slug} asChild>
            <Link href={`/category/${node.path}`}>{node.name}</Link>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

const topNavLinks = [
    { href: '/category/karekles-grafeiou', label: 'Καρέκλες Γραφείου', isDropdown: true },
    { href: '/category/grafeia', label: 'Γραφεία' },
    { href: '/category/antallaktika', label: 'Ανταλλακτικά' },
    { href: '/category/rafieres-kai-bibliothikes', label: 'Ραφιέρες και Βιβλιοθήκες' },
    { href: '/category/syrtarieres', label: 'Συρταριέρες' },
]

const bottomNavLinks = [
    { href: '/category/aksesouar-grafeiou', label: 'Αξεσουάρ Γραφείου' },
    { href: '/category/antallaktika', label: 'Ανταλλακτικά' },
    { href: '/contact', label: 'Επικοινωνία' },
]

function UserButton() {
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const handleLogout = () => {
        signOut(auth);
    };

    if (isUserLoading) {
        return <Button variant="ghost" size="icon" className="hidden md:flex"><User className="h-5 w-5" /></Button>
    }

    if (!user || user.isAnonymous) {
        return (
            <LoginDialog>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Login</span>
                </Button>
            </LoginDialog>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5 text-primary" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                       <span>{userProfile?.name}</span>
                       <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </DropdownMenuItem>
                 <DropdownMenuItem disabled>
                    <div className="flex items-center gap-2">
                       <Award className="h-4 w-4" />
                       <span>{userProfile?.points || 0} Πόντοι</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    Αποσύνδεση
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function Header() {
  const { itemCount } = useCart();
  const { allCategories } = useProducts();
  const categoryTree = buildCategoryTree(allCategories);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
        </div>

        <div className="hidden flex-col items-start gap-2 md:flex">
             <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Αρχική</Link>
                {topNavLinks.map((link) => {
                    if (link.isDropdown) {
                        return (
                             <DropdownMenu key={link.href}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="group flex items-center gap-1 p-0 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground">
                                    {link.label}
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem asChild>
                                    <Link href="/products">All Products</Link>
                                    </DropdownMenuItem>
                                    <CategorySubMenu nodes={categoryTree} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }
                    return (
                        <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            {link.label}
                        </Link>
                    )
                })}
             </nav>
             <nav className="flex items-center gap-4">
                {bottomNavLinks.map((link) => (
                     <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                    </Link>
                ))}
             </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
          </Button>
          
          <UserButton />

          <Button asChild variant="ghost" size="icon">
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">View cart</span>
            </Link>
          </Button>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex h-full flex-col">
                  <div className="border-b p-4">
                    <SheetClose asChild>
                      <Link href="/" className="flex items-center gap-2">
                        <Logo />
                      </Link>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-4 p-4">
                    <SheetClose asChild><Link href="/" className="text-lg font-medium text-foreground">Αρχική</Link></SheetClose>
                    {topNavLinks.map((link) => (
                      <SheetClose asChild key={link.href}><Link href={link.href} className="text-lg font-medium text-foreground">{link.label}</Link></SheetClose>
                    ))}
                     {bottomNavLinks.map((link) => (
                      <SheetClose asChild key={link.href}><Link href={link.href} className="text-lg font-medium text-foreground">{link.label}</Link></SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
