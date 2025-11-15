
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { formatCurrency } from '@/lib/utils';
import { type Product } from '@/lib/products-context';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem extends Product {
    quantity: number;
}

interface Order {
    id: string;
    customerDetails: { name: string; email: string; phone: string; };
    shippingAddress: { address: string; city: string; postalCode: string; country: string; };
    items: OrderItem[];
    total: number;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: Timestamp;
}

export default function OrdersPage() {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'orders');
    }, [firestore]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
    };

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Pending': return 'secondary';
            case 'Shipped': return 'default';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return [...orders].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }, [orders]);


    return (
        <div className="p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            <Card className="mt-6">
                <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>
                    View and manage all customer orders.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                sortedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{order.customerDetails.name}</div>
                                            <div className="text-sm text-muted-foreground">{order.customerDetails.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="Set Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Shipped">Shipped</SelectItem>
                                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                        <TableCell>
                                            <ul className="list-disc pl-5 text-sm">
                                                {order.items.map(item => (
                                                    <li key={item.id}>{item.name} (x{item.quantity})</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && orders?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No orders yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
