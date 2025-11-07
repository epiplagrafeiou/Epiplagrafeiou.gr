
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSuppliers } from '@/lib/suppliers-context';
import { syncProductsFromXml } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useProducts } from '@/lib/products-context';
import { useToast } from '@/hooks/use-toast';


interface SyncedProduct {
  name: string;
  price: string;
  description: string;
  category: string;
}

export default function XmlImporterPage() {
  const { suppliers } = useSuppliers();
  const { addProducts } = useProducts();
  const { toast } = useToast();
  const [loadingSupplier, setLoadingSupplier] = useState<string | null>(null);
  const [syncedProducts, setSyncedProducts] = useState<SyncedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (supplierId: string, url: string) => {
    setLoadingSupplier(supplierId);
    setError(null);
    setSyncedProducts([]);
    try {
      const products = await syncProductsFromXml(url);
      setSyncedProducts(products);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSupplier(null);
    }
  };

  const handleAddToStore = () => {
    const productsToadd = syncedProducts.map(p => ({
        name: p.name,
        price: parseFloat(p.price) || 0,
        description: p.description,
        category: p.category,
        imageId: '' // We don't have images from XML yet
    }));

    addProducts(productsToadd);
    
    toast({
        title: "Products Added!",
        description: `${productsToadd.length} products have been added to your store.`
    });

    setSyncedProducts([]);
  }

  return (
    <div className="p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">XML Importer</h2>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sync Products from Suppliers</CardTitle>
          <CardDescription>
            Fetch and review products from your suppliers' XML feeds before adding them to your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <h3 className="font-semibold">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.url}</p>
                </div>
                <Button
                  onClick={() => handleSync(supplier.id, supplier.url)}
                  disabled={loadingSupplier === supplier.id}
                >
                  {loadingSupplier === supplier.id ? 'Syncing...' : 'Sync Products'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {syncedProducts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Synced Products</CardTitle>
            <CardDescription>
              Review the products below. You can add them to your store from here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncedProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(parseFloat(product.price) || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <div className="flex justify-end mt-4">
                <Button onClick={handleAddToStore}>Add All Products to Store</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
