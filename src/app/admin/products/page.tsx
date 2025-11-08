
'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProducts } from '@/lib/products-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function AdminProductsPage() {
  const { adminProducts, deleteProducts } = useProducts();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(adminProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };
  
  const handleDeleteSelected = () => {
    deleteProducts(Array.from(selectedProducts));
    toast({
        title: "Products Deleted",
        description: `${selectedProducts.size} products have been removed from your store.`
    });
    setSelectedProducts(new Set());
  }

  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center gap-2">
            {selectedProducts.size > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedProducts.size})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {selectedProducts.size} product(s).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            )}
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Button>
        </div>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            View and manage all products in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                   <Checkbox
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    checked={selectedProducts.size === adminProducts.length && adminProducts.length > 0}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminProducts.map((product) => {
                 const image = PlaceHolderImages.find((img) => img.id === product.imageId);
                 const stock = product.stock ?? 0;
                 return (
                  <TableRow key={product.id} data-state={selectedProducts.has(product.id) && "selected"}>
                    <TableCell>
                       <Checkbox
                        onCheckedChange={(checked) => handleSelectProduct(product.id, Boolean(checked))}
                        checked={selectedProducts.has(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-md bg-secondary">
                        {image ? <Image src={image.imageUrl} alt={product.name} fill className="rounded-md object-cover" data-ai-hint={image.imageHint} /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No Image</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant={stock > 0 ? "secondary" : "destructive"}>
                        {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  </TableRow>
                )}
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
