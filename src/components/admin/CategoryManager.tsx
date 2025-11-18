'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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

export interface StoreCategory {
    id: string;
    name: string;
    rawCategories: string[];
    children: StoreCategory[];
    parentId: string | null;
    order: number;
}

const StoreCategoryItem = ({ 
    category, 
    onDelete, 
    onRemoveRawCategory,
    isOverlay,
}: { 
    category: StoreCategory, 
    onDelete: (categoryId: string) => void, 
    onRemoveRawCategory: (categoryId: string, rawCategory: string) => void,
    isOverlay?: boolean,
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
                
                {category.children.length > 0 && (
                  <SortableContext items={category.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="mt-2 space-y-2">
                        {category.children.map(child => (
                            <StoreCategoryItem 
                                key={child.id}
                                category={child} 
                                onDelete={onDelete} 
                                onRemoveRawCategory={onRemoveRawCategory}
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

export default function CategoryManager() {
    const { adminProducts } = useProducts();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'categories');
    }, [firestore]);
    const { data: fetchedCategories, isLoading } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    useEffect(() => {
        if (fetchedCategories) {
            const categoriesById: Record<string, StoreCategory> = {};
            const rootCategories: StoreCategory[] = [];

            // Initialize all categories with children arrays
            fetchedCategories.forEach(cat => {
                categoriesById[cat.id] = { ...cat, children: [] };
            });

            // Populate children arrays and find root categories
            fetchedCategories.forEach(cat => {
                if (cat.parentId && categoriesById[cat.parentId]) {
                    categoriesById[cat.parentId].children.push(categoriesById[cat.id]);
                } else {
                    rootCategories.push(categoriesById[cat.id]);
                }
            });
            
            const sortRecursive = (categories: StoreCategory[]) => {
                categories.sort((a,b) => a.order - b.order);
                categories.forEach(c => sortRecursive(c.children));
            }
            
            sortRecursive(rootCategories);

            setStoreCategories(rootCategories);
        }
    }, [fetchedCategories]);

    const saveCategories = useCallback(async (categoriesToSave: StoreCategory[]) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available' });
            return;
        }
        const batch = writeBatch(firestore);

        const flattenCategories = (categories: StoreCategory[], parentId: string | null = null, order = 0): Omit<StoreCategory, 'children'>[] => {
            let flatList: Omit<StoreCategory, 'children'>[] = [];
            categories.forEach((cat, index) => {
                const { children, ...rest } = cat;
                flatList.push({ ...rest, parentId, order: index });
                if (children && children.length > 0) {
                    flatList = flatList.concat(flattenCategories(children, cat.id));
                }
            });
            return flatList;
        }

        const flatListToSave = flattenCategories(categoriesToSave);
        const idsToKeep = new Set(flatListToSave.map(c => c.id));

        // Delete categories that are no longer present
        fetchedCategories?.forEach(oldCat => {
            if (!idsToKeep.has(oldCat.id)) {
                const docRef = doc(firestore, 'categories', oldCat.id);
                batch.delete(docRef);
            }
        });

        // Set (create or update) the current categories
        flatListToSave.forEach(cat => {
            const docRef = doc(firestore, 'categories', cat.id);
            batch.set(docRef, cat);
        });

        try {
            await batch.commit();
            toast({ title: "Categories Saved!", description: "Your category structure has been updated." });
        } catch (error) {
            console.error("Error saving categories:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save categories to the database.' });
        }

    }, [firestore, toast, fetchedCategories]);


    const allRawCategories = useMemo(() => {
        const set = new Set<string>();
        adminProducts.forEach(p => p.category && set.add(p.category));
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

    const uncategorized = useMemo(() => {
        const assignedRaw = new Set<string>();
        const collectAssigned = (categories: StoreCategory[]) => {
            categories.forEach(sc => {
                sc.rawCategories.forEach(rc => assignedRaw.add(rc));
                if (sc.children) collectAssigned(sc.children);
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
            order: storeCategories.length,
        };
        const newCategories = [...storeCategories, newCategory];
        setStoreCategories(newCategories);
        saveCategories(newCategories);
        setNewCategoryName('');
    };
    
    const withUpdatedCategories = (updater: (cats: StoreCategory[]) => StoreCategory[]) => {
        const newCategories = updater(storeCategories);
        setStoreCategories(newCategories);
        saveCategories(newCategories);
    }
    
    const handleDeleteStoreCategory = (categoryId: string) => {
        withUpdatedCategories(prev => {
            const removeCategory = (id: string, categories: StoreCategory[]): StoreCategory[] => {
                return categories.filter(category => {
                    if (category.id === id) return false;
                    category.children = removeCategory(id, category.children);
                    return true;
                });
            };
            return removeCategory(categoryId, prev);
        });
    };

    const handleRemoveRawCategory = (storeCategoryId: string, rawCategory: string) => {
         withUpdatedCategories(prev => {
            const remover = (categories: StoreCategory[]): StoreCategory[] => {
                return categories.map(sc => {
                    if (sc.id === storeCategoryId) {
                        return {
                            ...sc,
                            rawCategories: sc.rawCategories.filter(rc => rc !== rawCategory),
                        };
                    }
                    if(sc.children) {
                       return { ...sc, children: remover(sc.children) };
                    }
                    return sc;
                });
            };
            return remover(prev);
         });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
    
        if (!over) return;
    
        const activeIsRaw = active.data.current?.type === 'raw-category';
        
        if (activeIsRaw) {
             const overIsDroppable = over.data.current?.type === 'store-category-droppable';
             if (overIsDroppable) {
                const rawCategory = active.data.current?.category as string;
                const storeCategoryId = over.data.current?.categoryId as string;
                
                 withUpdatedCategories(prev => {
                    const addRawToTarget = (categories: StoreCategory[]): StoreCategory[] => {
                        return categories.map(sc => {
                            if (sc.id === storeCategoryId) {
                                if (!sc.rawCategories.includes(rawCategory)) {
                                     return { ...sc, rawCategories: [...sc.rawCategories, rawCategory] };
                                }
                            }
                            if (sc.children?.length > 0) {
                                return { ...sc, children: addRawToTarget(sc.children) };
                            }
                            return sc;
                        });
                    }
                    return addRawToTarget(prev);
                });
             }
             return;
        }

        const activeIsStore = active.data.current?.type === 'store-category';
        const overIsStore = over.data.current?.type === 'store-category' || over.data.current?.type === 'store-category-droppable';
        
        if (active.id !== over.id && activeIsStore && overIsStore) {
             withUpdatedCategories(categories => {
                let activeCategory: StoreCategory | undefined;
                let parentOfActive: StoreCategory | undefined;

                const findAndRemove = (cats: StoreCategory[], parent?: StoreCategory): StoreCategory[] => {
                    return cats.filter(c => {
                        if (c.id === active.id) {
                            activeCategory = c;
                            parentOfActive = parent;
                            return false;
                        }
                        c.children = findAndRemove(c.children, c);
                        return true;
                    })
                }
                const newTree = findAndRemove(categories);
                if (!activeCategory) return categories;

                const overId = over.id.toString();
                
                const findAndInsert = (cats: StoreCategory[], newParentId: string | null): boolean => {
                    for (let i = 0; i < cats.length; i++) {
                        const cat = cats[i];
                        if (cat.id === overId) { // Dropped ON another category item
                            if (over.data.current?.isContainer) { // Dropped inside the container part
                                 cat.children.unshift({ ...activeCategory, parentId: cat.id });
                            } else { // Dropped on the item itself, insert before or after
                                const newIndex = i;
                                cats.splice(newIndex, 0, { ...activeCategory, parentId: newParentId });
                            }
                            return true;
                        }
                        if (findAndInsert(cat.children, cat.id)) return true;
                    }
                     if (overId === "root" || over.data.current?.root) {
                        cats.push({ ...activeCategory, parentId: null });
                        return true;
                    }
                    return false;
                }
                
                findAndInsert(newTree, null);
                
                return newTree;
            });
        }
    };
    
    const activeRawCategory = activeId && typeof activeId === 'string' && activeId.startsWith('raw-') ? activeId.replace('raw-','') : null;
    const activeStoreCategoryData = activeId && (activeId as string).startsWith('cat-') ? findCategory(activeId as string, storeCategories) : null;
    
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
                                <div className="space-y-2">
                                  {storeCategories.map(cat => (
                                      <StoreCategoryItem 
                                          key={cat.id}
                                          category={cat} 
                                          onDelete={handleDeleteStoreCategory}
                                          onRemoveRawCategory={handleRemoveRawCategory} 
                                      />
                                  ))}
                                </div>
                            </SortableContext>
                             {storeCategories.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Add a category to get started.</p>}
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
