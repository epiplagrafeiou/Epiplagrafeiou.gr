
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
import { DndContext, useDraggable, useDroppable, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
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
    parentId: string | null;
}

const StoreCategoryItem = ({ 
    category, 
    onDelete, 
    onRemoveRawCategory,
    isOverlay,
    items,
}: { 
    category: StoreCategory, 
    onDelete: (categoryId: string) => void, 
    onRemoveRawCategory: (categoryId: string, rawCategory: string) => void,
    isOverlay?: boolean,
    items?: StoreCategory[],
}) => {
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
        data: { type: 'store-category-droppable', categoryId: category.id, isContainer: true },
    });

    const combinedRef = (node: HTMLElement | null) => {
        setNodeRef(node);
        droppableRef(node);
    };

    return (
        <div ref={combinedRef} style={style} className={`rounded-lg border p-4 ${isOver && !isOverlay ? 'bg-green-100' : 'bg-secondary/50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span {...attributes} {...listeners} className="cursor-grab p-2 active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <span className="font-semibold">{category.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <div className="ml-8 mt-2 space-y-1 pl-4 border-l-2">
                {category.rawCategories.map(raw => (
                    <div key={raw} className="flex items-center justify-between rounded-md bg-white p-2 text-sm">
                        <span>{raw}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveRawCategory(category.id, raw)}>
                            <Trash2 className="h-3 w-3 text-muted-foreground"/>
                        </Button>
                    </div>
                ))}
                
                {/* Render children recursively */}
                {category.children.length > 0 && (
                  <SortableContext items={category.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="mt-2 space-y-2">
                        {category.children.map(child => (
                            <StoreCategoryItem 
                                key={child.id}
                                category={child} 
                                onDelete={onDelete} 
                                onRemoveRawCategory={onRemoveRawCategory}
                                items={category.children}
                            />
                        ))}
                    </div>
                  </SortableContext>
                )}

                {category.children.length === 0 && category.rawCategories.length === 0 && <p className="text-xs text-muted-foreground py-2">Drag raw categories or other categories here</p>}
            </div>
        </div>
    )
}

export default function AdminCategoriesPage() {
    const { adminProducts } = useProducts();
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([
        { id: 'cat-1', name: 'Καρέκλες Γραφείου', rawCategories: ['Καρέκλες Γραφείου', 'Gaming Chairs'], children: [], parentId: null },
        { id: 'cat-2', name: 'Γραφεία', rawCategories: ['Γραφεία'], children: [], parentId: null },
        { id: 'cat-3', name: 'Βιβλιοθήκες', rawCategories: ['Βιβλιοθήκες'], children: [], parentId: null },
        { id: 'cat-4', name: 'Ραφιέρες Τοίχου', rawCategories: ['Ραφιέρες Τοίχου', 'Ραφιέρες/Ράφια Τοίχου'], children: [], parentId: null },
        { id: 'cat-5', name: 'Φωτιστικά Οροφής', rawCategories: ['Φωτιστικά Οροφής', 'Οροφής Φωτιστικά'], children: [], parentId: null },
        { id: 'cat-6', name: 'Διακοσμητικοί Καθρέπτες', rawCategories: ['Καθρέπτες', 'Διακοσμητικοί Καθρέπτες'], children: [], parentId: null },
        { id: 'cat-7', name: 'Διακόσμηση & Ατμόσφαιρα', rawCategories: ['Μαξιλάρια Διακοσμητικά'], children: [], parentId: null },
        { 
            id: 'cat-8', 
            name: 'Κεριά', 
            rawCategories: ['Κεριά'], 
            children: [
                { id: 'cat-8-1', name: 'Κεριά LED', rawCategories: ['Κεριά LED'], children: [], parentId: 'cat-8' }
            ], 
            parentId: null 
        },

    ]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const allRawCategories = useMemo(() => {
        const set = new Set<string>();
        adminProducts.forEach(p => set.add(p.category));
        return Array.from(set);
    }, [adminProducts]);

    const findCategory = useCallback((id: string, categories: StoreCategory[]): StoreCategory | undefined => {
        for (const category of categories) {
            if (category.id === id) return category;
            const foundInChildren = findCategory(id, category.children);
            if (foundInChildren) return foundInChildren;
        }
        return undefined;
    }, []);

    const removeCategory = useCallback((id: string, categories: StoreCategory[]): StoreCategory[] => {
        const newCategories = [];
        for (const category of categories) {
            if (category.id === id) continue; // Skip the category to be removed
            
            const newChildren = removeCategory(id, category.children);
            newCategories.push({ ...category, children: newChildren });
        }
        return newCategories;
    }, []);

    const addCategoryToParent = useCallback((child: StoreCategory, parentId: string, categories: StoreCategory[]): StoreCategory[] => {
        return categories.map(category => {
            if (category.id === parentId) {
                return { ...category, children: [...category.children, { ...child, parentId }] };
            }
            if (category.children.length > 0) {
                return { ...category, children: addCategoryToParent(child, parentId, category.children) };
            }
            return category;
        });
    }, []);
    
    const findParent = useCallback((childId: string, categories: StoreCategory[]): StoreCategory | null => {
        for (const category of categories) {
            if (category.children.some(child => child.id === childId)) {
                return category;
            }
            const parent = findParent(childId, category.children);
            if (parent) return parent;
        }
        return null;
    }, []);

    const uncategorized = useMemo(() => {
        const assignedRaw = new Set<string>();
        const collectAssigned = (categories: StoreCategory[]) => {
            categories.forEach(sc => {
                sc.rawCategories.forEach(rc => assignedRaw.add(rc));
                collectAssigned(sc.children);
            });
        }
        collectAssigned(storeCategories);
        return allRawCategories.filter(rc => !assignedRaw.has(rc));
    }, [allRawCategories, storeCategories]);

    const handleAddCategory = () => {
        if (newCategoryName.trim() === '') return;
        const newCategory: StoreCategory = {
            id: `cat-${Date.now()}`,
            name: newCategoryName,
            rawCategories: [],
            children: [],
            parentId: null,
        };
        setStoreCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
    };

    const handleDeleteStoreCategory = (categoryId: string) => {
         setStoreCategories(prev => removeCategory(categoryId, prev));
    };

    const handleRemoveRawCategory = (storeCategoryId: string, rawCategory: string) => {
        const remover = (categories: StoreCategory[]): StoreCategory[] => {
            return categories.map(sc => {
                if (sc.id === storeCategoryId) {
                    return {
                        ...sc,
                        rawCategories: sc.rawCategories.filter(rc => rc !== rawCategory),
                    };
                }
                return { ...sc, children: remover(sc.children) };
            });
        };
        setStoreCategories(prev => remover(prev));
      };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleAddRawToStoreCategory = useCallback((categoryId: string, rawCategory: string) => {
        const addRawToTarget = (categories: StoreCategory[]): StoreCategory[] => {
             return categories.map(sc => {
                if (sc.id === categoryId) {
                    if (!sc.rawCategories.includes(rawCategory)) {
                         return { ...sc, rawCategories: [...sc.rawCategories, rawCategory] };
                    }
                }
                if (sc.children.length > 0) {
                    return { ...sc, children: addRawToTarget(sc.children) };
                }
                return sc;
            });
        }
        
        const removeRawFromSource = (categories: StoreCategory[]): StoreCategory[] => {
             return categories.map(sc => {
                const newRawCategories = sc.rawCategories.filter(rc => rc !== rawCategory);
                const newChildren = removeRawFromSource(sc.children);
                return {...sc, rawCategories: newRawCategories, children: newChildren};
            });
        }

        setStoreCategories(prev => {
            const treeWithRawRemoved = removeRawFromSource(prev);
            return addRawToTarget(treeWithRawRemoved);
        });
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
    
        if (!over || active.id === over.id) return;
    
        const activeIsRaw = active.id.toString().startsWith('raw-');
        const overIsStoreCategoryDroppable = over.data.current?.type === 'store-category-droppable';
    
        if (activeIsRaw && overIsStoreCategoryDroppable) {
            const rawCategory = active.data.current?.category as string;
            const storeCategoryId = over.data.current?.categoryId as string;
            if (rawCategory && storeCategoryId) {
                handleAddRawToStoreCategory(storeCategoryId, rawCategory);
            }
            return;
        }

        const activeIsStore = active.data.current?.type === 'store-category';
        const overIsStore = over.data.current?.type === 'store-category' || over.data.current?.type === 'store-category-droppable';

        if(activeIsStore && overIsStore) {
            setStoreCategories(prev => {
                // Find the dragged category
                let movingCategory = findCategory(active.id as string, prev);
                if (!movingCategory) return prev;
    
                // Remove the category from its current location
                let tempTree = removeCategory(active.id as string, prev);
    
                const overId = over.id as string;
                const isOverContainer = over.data.current?.isContainer;
    
                // Scenario 1: Dropping a category INTO another to make it a subcategory
                if (isOverContainer) {
                    return addCategoryToParent({ ...movingCategory, parentId: overId, children: movingCategory.children || [] }, overId, tempTree);
                }
    
                // Scenario 2: Reordering categories at the same level
                const overCategory = findCategory(overId, prev);
                const movingParent = findParent(active.id as string, prev);
                const overParent = findParent(overId, prev);

                // If reordering within the same parent (or at root level)
                if (movingParent?.id === overParent?.id) {
                    const parentId = movingParent?.id;
                    if (parentId) {
                        // Reorder within a parent
                        const updateChildren = (categories: StoreCategory[]): StoreCategory[] => {
                            return categories.map(cat => {
                                if (cat.id === parentId) {
                                    const oldIndex = cat.children.findIndex(c => c.id === active.id);
                                    const newIndex = cat.children.findIndex(c => c.id === overId);
                                    cat.children = arrayMove(cat.children, oldIndex, newIndex);
                                } else {
                                    cat.children = updateChildren(cat.children);
                                }
                                return cat;
                            });
                        };
                        return updateChildren(tempTree);
                    } else {
                        // Reorder at root level
                        const oldIndex = prev.filter(c => c.parentId === null).findIndex(c => c.id === active.id);
                        const newIndex = prev.filter(c => c.parentId === null).findIndex(c => c.id === overId);
                        const rootCategories = tempTree.filter(c => c.parentId === null);
                        const otherCategories = tempTree.filter(c => c.parentId !== null);
                        const reorderedRoot = arrayMove(rootCategories, oldIndex, newIndex);
                        return [...reorderedRoot, ...otherCategories];
                    }
                } else {
                    // Moving a category to a different level (e.g., from subcategory to root)
                    // Find the index of the 'over' category to place the moving one before/after
                    const targetParent = overParent;
                    if (targetParent) {
                        const newChildren = [...targetParent.children];
                        const overIndex = newChildren.findIndex(c => c.id === overId);
                        newChildren.splice(overIndex, 0, { ...movingCategory, parentId: targetParent.id });
                        
                        const updateTargetParent = (categories: StoreCategory[]): StoreCategory[] => {
                            return categories.map(cat => {
                                if (cat.id === targetParent.id) return {...cat, children: newChildren};
                                if (cat.children.length) return {...cat, children: updateTargetParent(cat.children)};
                                return cat;
                            });
                        }
                        return updateTargetParent(tempTree);

                    } else {
                        // Dropping at the root level
                        const rootCategories = tempTree.filter(c => !c.parentId);
                        const overIndex = rootCategories.findIndex(c => c.id === overId);
                        rootCategories.splice(overIndex, 0, { ...movingCategory, parentId: null });
                        
                        const nonRootCategories = tempTree.filter(c => c.parentId);
                        const finalTree = [...rootCategories, ...nonRootCategories];

                        // This is a simplified re-assembly. A full tree reconstruction is better.
                        const buildTree = (items: StoreCategory[], parentId: string | null = null): StoreCategory[] => {
                            const children = items.filter(item => item.parentId === parentId);
                            return children.map(child => ({
                                ...child,
                                children: buildTree(items, child.id)
                            }));
                        }
                        const allItems = [...rootCategories, ...nonRootCategories];
                        const uniqueItems = allItems.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
                        
                        return buildTree(uniqueItems);
                    }
                }
            });
        }
    };
    
    const activeRawCategory = activeId && typeof activeId === 'string' && activeId.startsWith('raw-') ? activeId.replace('raw-','') : null;
    const activeStoreCategoryData = activeId && (activeId as string).startsWith('cat-') ? findCategory(activeId as string, storeCategories) : null;
    
    const topLevelCategories = storeCategories.filter(c => !c.parentId);

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

                             <SortableContext items={topLevelCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                  {topLevelCategories.map(cat => (
                                      <StoreCategoryItem 
                                          key={cat.id}
                                          category={cat} 
                                          onDelete={handleDeleteStoreCategory}
                                          onRemoveRawCategory={handleRemoveRawCategory} 
                                          items={topLevelCategories}
                                      />
                                  ))}
                                </div>
                            </SortableContext>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DragOverlay>
                {activeRawCategory ? <div className="flex cursor-grabbing items-center rounded-md border bg-card p-3 shadow-lg"><GripVertical className="mr-2 h-5 w-5 text-muted-foreground" /> {activeRawCategory}</div> : null}
                {activeStoreCategoryData ? <StoreCategoryItem category={activeStoreCategoryData} onDelete={()=>{}} onRemoveRawCategory={()=>{}} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
