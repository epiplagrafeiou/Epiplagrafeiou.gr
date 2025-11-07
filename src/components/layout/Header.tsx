'use client';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/icons/Logo';
import { useCart } from '@/lib/cart-context';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { useProducts } from '@/lib/products-context';
import { createSlug } from '@/lib/utils';

const navLinks = [
  { href: '/admin', label: 'Admin Panel' },
];

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

export default function Header() {
  const { itemCount } = useCart();
  const { allCategories } = useProducts();

  const categoryTree = buildCategoryTree(allCategories);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-6 w-auto text-foreground" />
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Shop by Category
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden w-64 items-center gap-2 md:flex">
            <Input type="search" placeholder="Search products..." className="h-9" />
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          </div>

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
                        <Logo className="h-6 w-auto text-foreground" />
                      </Link>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-4 p-4">
                    <SheetClose asChild>
                      <Link href="/products" className="text-lg font-medium text-foreground">
                        Products
                      </Link>
                    </SheetClose>
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className="text-lg font-medium text-foreground"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
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
