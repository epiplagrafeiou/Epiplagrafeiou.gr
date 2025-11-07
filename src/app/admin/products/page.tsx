
'use client';
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
import { PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProducts } from '@/lib/products-context';

export default function AdminProductsPage() {
  const { products } = useProducts();
  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                 const image = PlaceHolderImages.find((img) => img.id === product.imageId);
                 const stock = Math.floor(Math.random() * 100);
                 return (
                  <TableRow key={product.id}>
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
                      <Badge variant={stock > 10 ? "default" : "destructive"} className={stock > 10 ? "bg-green-100 text-green-800" : ""}>
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
