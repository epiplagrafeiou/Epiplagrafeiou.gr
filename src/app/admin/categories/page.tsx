
'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { DndContext, useDraggable, useDroppable, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const RawCategoryItem = ({ category }: { category: string }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `raw-${category}`,
        data: { type: 'raw-category', category },
    });

    return (
        <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="mb-2 flex cursor-grab items-center rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing"
        >
        <GripVertical className="mr-2 h-5 w-5 text-muted-foreground" />
        <span className="text-sm">{category}</span>
        </div>
    );
};

interface StoreCategory {
    id: string;
    name: string;
    rawCategories: string[];
    children: StoreCategory[];
}

const StoreCategoryItem = ({ category, onAddRawCategory }: { category: StoreCategory, onAddRawCategory: (categoryId: string, rawCategory: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: category.id, data: { type: 'store-category', category } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const { isOver, setNodeRef: droppableRef } = useDroppable({
        id: category.id,
        data: { type: 'store-category-droppable', categoryId: category.id },
    });

    const combinedRef = (node: HTMLElement | null) => {
        setNodeRef(node);
        droppableRef(node);
    };

    return (
        <div ref={combinedRef} style={style} className={`mb-2 rounded-lg border p-4 ${isOver ? 'bg-green-100' : 'bg-secondary/50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span {...attributes} {...listeners} className="cursor-grab p-2 active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <span className="font-semibold">{category.name}</span>
                </div>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <div className="ml-8 mt-2 space-y-1 pl-4 border-l-2">
                {category.rawCategories.map(raw => (
                    <div key={raw} className="flex items-center justify-between rounded-md bg-white p-2 text-sm">
                        <span>{raw}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="h-3 w-3 text-muted-foreground"/>
                        </Button>
                    </div>
                ))}
                {category.rawCategories.length === 0 && <p className="text-xs text-muted-foreground py-2">Drag raw categories here</p>}
            </div>
        </div>
    )
}

export default function AdminCategoriesPage() {
    const { adminProducts } = useProducts();
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([
        { id: 'cat-1', name: 'Office Chairs', rawCategories: ['Καρέκλες Γραφείου', 'Gaming Chairs'], children: [] },
        { id: 'cat-2', name: 'Desks', rawCategories: ['Γραφεία'], children: [] },
    ]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);

    const allRawCategories = useMemo(() => {
        const set = new Set<string>();
        adminProducts.forEach(p => set.add(p.category));
        return Array.from(set);
    }, [adminProducts]);

    const uncategorized = useMemo(() => {
        const assignedRaw = new Set<string>();
        storeCategories.forEach(sc => {
            sc.rawCategories.forEach(rc => assignedRaw.add(rc));
        });
        return allRawCategories.filter(rc => !assignedRaw.has(rc));
    }, [allRawCategories, storeCategories]);

    const handleAddCategory = () => {
        if (newCategoryName.trim() === '') return;
        const newCategory: StoreCategory = {
            id: `cat-${Date.now()}`,
            name: newCategoryName,
            rawCategories: [],
            children: []
        };
        setStoreCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleAddRawToStoreCategory = useCallback((categoryId: string, rawCategory: string) => {
        setStoreCategories(prev => {
            const newStoreCategories = prev.map(sc => {
                if (sc.id === categoryId) {
                    if (!sc.rawCategories.includes(rawCategory)) {
                         return { ...sc, rawCategories: [...sc.rawCategories, rawCategory] };
                    }
                }
                // Also remove from other categories if it exists
                 return { ...sc, rawCategories: sc.rawCategories.filter(rc => rc !== rawCategory) };
            });

            // This ensures adding to the correct category even if it was previously in another
             const targetCategoryIndex = newStoreCategories.findIndex(sc => sc.id === categoryId);
             if (targetCategoryIndex !== -1) {
                 if (!newStoreCategories[targetCategoryIndex].rawCategories.includes(rawCategory)) {
                     newStoreCategories[targetCategoryIndex].rawCategories.push(rawCategory);
                 }
             }

            return newStoreCategories;
        });
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
    
        if (!over) return;
    
        const activeIsRaw = active.id.toString().startsWith('raw-');
        const overIsStoreCategoryDroppable = over.data.current?.type === 'store-category-droppable';
    
        // Handle dragging a raw category into a store category
        if (activeIsRaw && overIsStoreCategoryDroppable) {
            const rawCategory = active.data.current?.category as string;
            const storeCategoryId = over.data.current?.categoryId as string;
            if (rawCategory && storeCategoryId) {
                handleAddRawToStoreCategory(storeCategoryId, rawCategory);
            }
            return;
        }

        const activeIsStore = active.data.current?.type === 'store-category';
        const overIsStore = over.data.current?.type === 'store-category';

        // Handle reordering store categories
        if (activeIsStore && overIsStore && active.id !== over.id) {
            setStoreCategories((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    const activeRawCategory = activeId && activeId.startsWith('raw-') ? activeId.replace('raw-','') : null;
    const activeStoreCategory = activeId && storeCategories.find(c => c.id === activeId);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Uncategorized</CardTitle>
                            <CardDescription>Raw categories from suppliers. Drag them to a store category.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {uncategorized.map(cat => (
                                <RawCategoryItem key={cat} category={cat} />
                            ))}
                             {uncategorized.length === 0 && <p className="text-sm text-muted-foreground">All categories are organized!</p>}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>My Store Categories</CardTitle>
                             <CardDescription>Organize your store's navigation structure here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex gap-2 mb-4">
                                <Input 
                                    placeholder="New category name..." 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                />
                                <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4"/> Add Category</Button>
                             </div>

                             <SortableContext items={storeCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {storeCategories.map(cat => (
                                    <StoreCategoryItem key={cat.id} category={cat} onAddRawCategory={handleAddRawToStoreCategory} />
                                ))}
                            </SortableContext>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DragOverlay>
                {activeRawCategory ? <div className="flex cursor-grabbing items-center rounded-md border bg-card p-3 shadow-lg"><GripVertical className="mr-2 h-5 w-5 text-muted-foreground" /> {activeRawCategory}</div> : null}
                {activeStoreCategory ? <div className="flex cursor-grabbing items-center rounded-lg border bg-secondary/80 p-4 shadow-lg backdrop-blur-sm"><GripVertical className="mr-2 h-5 w-5 text-muted-foreground" /> {activeStoreCategory.name}</div> : null}
            </DragOverlay>
        </DndContext>
    );
}
