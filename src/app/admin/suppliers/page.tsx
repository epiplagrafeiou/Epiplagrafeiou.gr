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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export default function SuppliersPage() {
  const { suppliers, addSupplier: contextAddSupplier } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierUrl, setNewSupplierUrl] = useState('');
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([
    { from: 0, to: 100, markup: 50 },
    { from: 101, to: 500, markup: 40 },
    { from: 501, to: 99999, markup: 30 },
  ]);

  const handleRuleChange = (index: number, field: keyof MarkupRule, value: string) => {
    const newRules = [...markupRules];
    newRules[index] = { ...newRules[index], [field]: Number(value) };
    setMarkupRules(newRules);
  };

  const addRule = () => {
    setMarkupRules([...markupRules, { from: 0, to: 0, markup: 0 }]);
  };

  const removeRule = (index: number) => {
    const newRules = markupRules.filter((_, i) => i !== index);
    setMarkupRules(newRules);
  };

  const handleAddSupplier = () => {
    if (newSupplierName && newSupplierUrl) {
      contextAddSupplier({
        name: newSupplierName,
        url: newSupplierUrl,
        markup: 0, // No longer the primary source
        markupRules,
      });
      setDialogOpen(false);
      // Reset form
      setNewSupplierName('');
      setNewSupplierUrl('');
      setMarkupRules([
        { from: 0, to: 100, markup: 50 },
        { from: 101, to: 500, markup: 40 },
        { from: 501, to: 99999, markup: 30 },
      ]);
    }
  };

  return (
    <div className="p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="col-span-3"
                  placeholder="Supplier Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  XML URL
                </Label>
                <Input
                  id="url"
                  value={newSupplierUrl}
                  onChange={(e) => setNewSupplierUrl(e.target.value)}
                  className="col-span-3"
                  placeholder="https://example.com/feed.xml"
                />
              </div>
              <div>
                <Label className="font-semibold">Markup Rules</Label>
                <p className="text-sm text-muted-foreground mb-4">Set markup percentages based on product retail price ranges.</p>
                <div className="space-y-4">
                  {markupRules.map((rule, index) => (
                    <div key={index} className="grid grid-cols-12 items-center gap-2">
                      <div className="col-span-1 text-sm text-muted-foreground">From:</div>
                       <div className="col-span-3">
                          <Input
                            type="number"
                            value={rule.from}
                            onChange={(e) => handleRuleChange(index, 'from', e.target.value)}
                            placeholder="€0"
                          />
                       </div>
                       <div className="col-span-1 text-sm text-muted-foreground">To:</div>
                       <div className="col-span-3">
                          <Input
                            type="number"
                            value={rule.to}
                            onChange={(e) => handleRuleChange(index, 'to', e.target.value)}
                            placeholder="€100"
                          />
                        </div>
                        <div className="col-span-3">
                           <Input
                            type="number"
                            value={rule.markup}
                            onChange={(e) => handleRuleChange(index, 'markup', e.target.value)}
                            placeholder="Markup %"
                          />
                        </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" onClick={() => removeRule(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                 <Button onClick={addRule} variant="outline" size="sm" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
                  </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleAddSupplier}>Save Supplier</Button>
            </DialogFooter>
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
                      )) || <Badge variant="secondary">{supplier.markup}%</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{`${(supplier.conversionRate * 100).toFixed(0)}%`}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(supplier.profitability)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
