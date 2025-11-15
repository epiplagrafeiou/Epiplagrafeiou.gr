
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
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useSuppliers, type MarkupRule, type Supplier } from '@/lib/suppliers-context';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';


const SupplierForm = ({
    supplier,
    onSave,
    onCancel,
  }: {
    supplier: Partial<Supplier>;
    onSave: (data: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => void;
    onCancel: () => void;
  }) => {
    const [name, setName] = useState(supplier.name || '');
    const [url, setUrl] = useState(supplier.url || '');
    const [rules, setRules] = useState<MarkupRule[]>(
      supplier.markupRules || [
        { from: 0, to: 100, markup: 50 },
        { from: 101, to: 500, markup: 40 },
        { from: 501, to: 99999, markup: 30 },
      ]
    );
  
    const handleRuleChange = (index: number, field: keyof MarkupRule, value: string) => {
      const newRules = [...rules];
      newRules[index] = { ...newRules[index], [field]: Number(value) };
      setRules(newRules);
    };
  
    const addRule = () => {
      setRules([...rules, { from: 0, to: 0, markup: 0 }]);
    };
  
    const removeRule = (index: number) => {
      const newRules = rules.filter((_, i) => i !== index);
      setRules(newRules);
    };
  
    const handleSave = () => {
      if (name && url) {
        onSave({ name, url, markupRules: rules });
      }
    };
  
    return (
      <>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Supplier Name" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">XML URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" placeholder="https://example.com/feed.xml" />
          </div>
          <div>
            <Label className="font-semibold">Markup Rules</Label>
            <p className="text-sm text-muted-foreground mb-4">Set markup percentages based on product retail price ranges.</p>
            <ScrollArea className="h-[300px] pr-6">
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-1 text-sm text-muted-foreground">From:</div>
                    <div className="col-span-3"><Input type="number" value={rule.from} onChange={(e) => handleRuleChange(index, 'from', e.target.value)} placeholder="€0" /></div>
                    <div className="col-span-1 text-sm text-muted-foreground">To:</div>
                    <div className="col-span-3"><Input type="number" value={rule.to} onChange={(e) => handleRuleChange(index, 'to', e.target.value)} placeholder="€100" /></div>
                    <div className="col-span-3"><Input type="number" value={rule.markup} onChange={(e) => handleRuleChange(index, 'markup', e.target.value)} placeholder="Markup %" /></div>
                    <div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeRule(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={addRule} variant="outline" size="sm" className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Rule</Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </>
    );
  };


export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleAddSupplier = (data: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => {
    addSupplier(data);
    setIsAddDialogOpen(false);
  };

  const handleUpdateSupplier = (data: Omit<Supplier, 'id' | 'conversionRate' | 'profitability'>) => {
    if (editingSupplier) {
      updateSupplier({ ...editingSupplier, ...data });
      setEditingSupplier(null);
    }
  };
  
  const handleDeleteSupplier = (supplierId: string) => {
    deleteSupplier(supplierId);
  }

  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the details and markup rules for the new supplier.
              </DialogDescription>
            </DialogHeader>
            <SupplierForm 
              supplier={{}} 
              onSave={handleAddSupplier} 
              onCancel={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>
            Manage your product suppliers and their settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>XML Feed URL</TableHead>
                <TableHead className="text-center">Markup Rules</TableHead>
                <TableHead className="text-center">Conversion</TableHead>
                <TableHead className="text-right">Profitability</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <a
                      href={supplier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {supplier.url}
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {supplier.markupRules?.map((rule, i) => (
                         <Badge key={i} variant="secondary">{`${formatCurrency(rule.from)} - ${formatCurrency(rule.to)}: ${rule.markup}%`}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{`${(supplier.conversionRate * 100).toFixed(0)}%`}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(supplier.profitability)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingSupplier(supplier)}>
                          <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(isOpen) => !isOpen && setEditingSupplier(null)}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Edit Supplier</DialogTitle>
                  <DialogDescription>Update the details and markup rules for {editingSupplier?.name}.</DialogDescription>
              </DialogHeader>
              {editingSupplier && (
                <SupplierForm 
                  supplier={editingSupplier} 
                  onSave={handleUpdateSupplier} 
                  onCancel={() => setEditingSupplier(null)} 
                />
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
