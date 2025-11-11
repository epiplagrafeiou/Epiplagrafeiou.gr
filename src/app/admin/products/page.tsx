
'use client';
import { useState, useMemo } from 'react';
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
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, createSlug } from '@/lib/utils';
import Image from 'next/image';
import { useProducts, type Product } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/admin/ProductForm';

const ProductsTable = ({
    products,
    selectedProducts,
    onSelectProduct,
    onSelectAll,
    areAllSelected,
    onEdit,
}:{
    products: Product[];
    selectedProducts: Set<string>;
    onSelectProduct: (productId: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    areAllSelected: boolean;
    onEdit: (product: Product) => void;
}) => (
    <Table>
        <TableHeader>
        <TableRow>
            <TableHead className="w-[50px]">
                <Checkbox
                onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                checked={areAllSelected && products.length > 0}
                aria-label="Select all"
                />
            </TableHead>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
        {products.map((product) => {
            const image = product.imageId;
            const stock = product.stock ?? 0;
            return (
            <TableRow key={product.id} data-state={selectedProducts.has(product.id) && "selected"}>
                <TableCell>
                    <Checkbox
                    onCheckedChange={(checked) => onSelectProduct(product.id, Boolean(checked))}
                    checked={selectedProducts.has(product.id)}
                    aria-label={`Select ${product.name}`}
                    />
                </TableCell>
                <TableCell>
                <div className="relative h-12 w-12 rounded-md bg-secondary">
                    {image ? <Image src={image} alt={product.name} fill className="rounded-md object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No Image</div>}
                </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell>
                    <Badge variant={stock > 0 ? 'default' : 'destructive'} className={stock > 0 ? 'bg-green-600 text-white hover:bg-green-700' : ''}>
                    {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TableCell>
            </TableRow>
            )}
        )}
        </TableBody>
    </Table>
);


export default function AdminProductsPage() {
  const { adminProducts, deleteProducts, addProducts, updateProduct } = useProducts();
  const { suppliers } = useSuppliers();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const productsBySupplier = useMemo(() => {
    const map: Record<string, Product[]> = {};
    suppliers.forEach(supplier => {
        map[supplier.id] = adminProducts.filter(p => p.supplierId === supplier.id);
    });
    // Add a category for manually added products
    map['manual'] = adminProducts.filter(p => !suppliers.some(s => s.id === p.supplierId));
    return map;
  }, [adminProducts, suppliers]);

  const displayedProducts = activeTab === 'all' ? adminProducts : productsBySupplier[activeTab] || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(displayedProducts.map(p => p.id)));
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

  const handleDeleteAllFromSupplier = (supplierId: string) => {
    const productsToDelete = productsBySupplier[supplierId].map(p => p.id);
    deleteProducts(productsToDelete);
    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'the supplier';
    toast({
        title: `All products from ${supplierName} deleted`,
        description: `${productsToDelete.length} products have been removed.`
    });
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedProducts(new Set());
  }

  const handleOpenForm = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  const handleSaveProduct = (data: any) => {
    if (editingProduct) {
        // Update existing product
        const updatedProduct = {
            ...editingProduct,
            ...data,
            slug: createSlug(data.name),
            price: parseFloat(data.price),
            stock: parseInt(data.stock, 10),
            imageId: data.images[0] || '',
        };
        updateProduct(updatedProduct);
        toast({ title: "Product Updated", description: `${data.name} has been updated.` });
    } else {
        // Add new product
        const newProduct = {
            ...data,
            id: `manual-${Date.now()}`,
            supplierId: 'manual', // Or some other identifier
            slug: createSlug(data.name),
            price: parseFloat(data.price),
            stock: parseInt(data.stock, 10),
            imageId: data.images[0] || '',
        }
        addProducts([newProduct]);
        toast({ title: "Product Added", description: `${data.name} has been added to your store.` });
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  }


  const currentSelectionAreAll = selectedProducts.size === displayedProducts.length && displayedProducts.length > 0;
  
  const manualSupplier = { id: 'manual', name: 'Manual' };
  const allSuppliersForTabs = [...suppliers, manualSupplier];


  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center gap-2">
            {selectedProducts.size > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedProducts.size})
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
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? `Update details for ${editingProduct.name}` : 'Fill in the details for the new product.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm
                        product={editingProduct}
                        onSave={handleSaveProduct}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            {allSuppliersForTabs.map(supplier => (
                <TabsTrigger key={supplier.id} value={supplier.id}>{supplier.name}</TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="all">
            <Card>
                <CardHeader>
                    <CardTitle>All Products ({adminProducts.length})</CardTitle>
                    <CardDescription>View and manage all products in your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsTable
                        products={adminProducts}
                        selectedProducts={selectedProducts}
                        onSelectProduct={handleSelectProduct}
                        onSelectAll={handleSelectAll}
                        areAllSelected={currentSelectionAreAll}
                        onEdit={handleOpenForm}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        {allSuppliersForTabs.map(supplier => (
            <TabsContent key={supplier.id} value={supplier.id}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{supplier.name} ({productsBySupplier[supplier.id]?.length || 0})</CardTitle>
                                <CardDescription>
                                    {supplier.id === 'manual' ? 'Manually added products.' : `Products imported from ${supplier.name}.`}
                                </CardDescription>
                            </div>
                           {supplier.id !== 'manual' && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete All From Supplier
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete all products from {supplier.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete all {productsBySupplier[supplier.id]?.length || 0} products from this supplier.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteAllFromSupplier(supplier.id)}>Delete All</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ProductsTable
                            products={productsBySupplier[supplier.id] || []}
                            selectedProducts={selectedProducts}
                            onSelectProduct={handleSelectProduct}
                            onSelectAll={handleSelectAll}
                            areAllSelected={currentSelectionAreAll}
                            onEdit={handleOpenForm}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
