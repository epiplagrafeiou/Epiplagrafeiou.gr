
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
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PlusCircle, Trash2, GitMerge } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    onMerge,
    onAddSubCategory,
    isOverlay,
}: { 
    category: StoreCategory, 
    onDelete: (categoryId: string) => void, 
    onRemoveRawCategory: (categoryId: string, rawCategory: string) => void,
    onMerge: (targetCategoryId: string, sourceCategory: StoreCategory | { name: string, rawCategories: string[] }) => void,
    onAddSubCategory: (parentId: string) => void,
    isOverlay?: boolean,
}) => {
    const [isMerging, setIsMerging] = useState(false);
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
    
    const { isOver: isOverContainer, setNodeRef: droppableRef } = useDroppable({
        id: category.id,
        data: { type: 'store-category-droppable', categoryId: category.id, isContainer: true },
    });

    const { isOver: isOverMerge, setNodeRef: mergeDroppableRef } = useDroppable({
        id: `merge-${category.id}`,
        data: { type: 'merge-droppable', categoryId: category.id }
    });

    const combinedRef = (node: HTMLElement | null) => {
        setNodeRef(node);
        droppableRef(node);
    };

    return (
        <div ref={combinedRef} style={style} className={`rounded-lg border p-4 ${isOverContainer && !isOverlay ? 'bg-green-100' : 'bg-secondary/50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span {...attributes} {...listeners} className="cursor-grab p-2 active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <span className="font-semibold">{category.name}</span>
                </div>
                <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" onClick={() => onAddSubCategory(category.id)}>
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsMerging(!isMerging)}>
                        <GitMerge className={cn("h-4 w-4", isMerging ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>

            {isMerging && (
                <div 
                    ref={mergeDroppableRef}
                    className={cn(
                        "mt-2 ml-8 p-4 border-2 border-dashed rounded-md text-center text-sm",
                        isOverMerge ? "bg-blue-100 border-blue-400" : "bg-background border-border"
                    )}
                >
                    {isOverMerge ? 'Drop to Merge' : `Drag a category here to merge into "${category.name}"`}
                </div>
            )}

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
                                onMerge={onMerge}
                                onAddSubCategory={onAddSubCategory}
                            />
                        ))}
                    </div>
                  </SortableContext>
                )}

                {category.children.length === 0 && category.rawCategories.length === 0 && <p className="text-xs text-muted-foreground py-2">Drag supplier categories or other categories here</p>}
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
    const { data: fetchedCategories } = useCollection<Omit<StoreCategory, 'children'>>(categoriesQuery);

    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    useEffect(() => {
        if (fetchedCategories) {
            const categoriesById: Record<string, StoreCategory> = {};
            const rootCategories: StoreCategory[] = [];

            fetchedCategories.forEach(cat => {
                categoriesById[cat.id] = { ...cat, children: [] };
            });

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

        const flattenCategories = (categories: StoreCategory[], parentId: string | null = null): Omit<StoreCategory, 'children'>[] => {
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

        fetchedCategories?.forEach(oldCat => {
            if (!idsToKeep.has(oldCat.id)) {
                const docRef = doc(firestore, 'categories', oldCat.id);
                batch.delete(docRef);
            }
        });

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
        return Array.from(set).sort();
    }, [adminProducts]);

    const findCategory = useCallback((id: string, categories: StoreCategory[]): StoreCategory | undefined => {
        for (const category of categories) {
            if (category.id === id) return category;
            const foundInChildren = findCategory(id, category.children);
            if (foundInChildren) return foundInChildren;
        }
        return undefined;
    }, []);
    
    const findParentCategory = useCallback((childId: string, categories: StoreCategory[]): StoreCategory | undefined => {
        for (const category of categories) {
            if (category.children.some(child => child.id === childId)) {
                return category;
            }
            const parent = findParentCategory(childId, category.children);
            if (parent) return parent;
        }
        return undefined;
    }, []);
    
    const withUpdatedCategories = (updater: (cats: StoreCategory[]) => StoreCategory[]) => {
        const newCategories = updater(storeCategories);
        setStoreCategories(newCategories);
        saveCategories(newCategories);
    }

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
        withUpdatedCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
    };

    const handleAddSubCategory = (parentId: string) => {
        const newCategoryName = prompt("Enter name for new subcategory:");
        if (!newCategoryName || newCategoryName.trim() === '') return;

        const newCategory: StoreCategory = {
            id: `cat-${Date.now()}`,
            name: newCategoryName,
            rawCategories: [],
            children: [],
            parentId,
            order: 0
        };

        withUpdatedCategories(prev => {
             const addSubToParent = (categories: StoreCategory[]): StoreCategory[] => {
                return categories.map(cat => {
                    if (cat.id === parentId) {
                        return { ...cat, children: [...cat.children, newCategory] };
                    }
                    if (cat.children?.length) {
                        return { ...cat, children: addSubToParent(cat.children) };
                    }
                    return cat;
                });
            };
            return addSubToParent(prev);
        });
    };
    
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

    const handleMerge = (targetCategoryId: string, sourceCategory: StoreCategory | { name: string, rawCategories: string[] }) => {
        withUpdatedCategories(prev => {
            const mergeIntoTarget = (categories: StoreCategory[]): StoreCategory[] => {
                return categories.map(cat => {
                    if (cat.id === targetCategoryId) {
                        const newRawCategories = [...cat.rawCategories, ...sourceCategory.rawCategories];
                        return { ...cat, rawCategories: Array.from(new Set(newRawCategories)) };
                    }
                    return { ...cat, children: mergeIntoTarget(cat.children) };
                });
            };
            let newCategories = mergeIntoTarget(prev);
            
            if ('id' in sourceCategory) {
                 const removeCategory = (id: string, categories: StoreCategory[]): StoreCategory[] => {
                    return categories.filter(category => {
                        if (category.id === id) return false;
                        category.children = removeCategory(id, category.children);
                        return true;
                    });
                };
                newCategories = removeCategory((sourceCategory as StoreCategory).id, newCategories);
            }
            
            return newCategories;
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
        const activeIsStore = active.data.current?.type === 'store-category';
        
        if (over.data.current?.type === 'merge-droppable') {
            const targetCategoryId = over.data.current.categoryId;
            if (activeIsRaw) {
                const rawCategoryName = active.data.current.category;
                handleMerge(targetCategoryId, { name: rawCategoryName, rawCategories: [rawCategoryName] });
            } else if (activeIsStore) {
                const sourceCategory = active.data.current.category;
                if (targetCategoryId !== sourceCategory.id) {
                    handleMerge(targetCategoryId, sourceCategory);
                }
            }
            return;
        }

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

        if (active.id !== over.id && activeIsStore) {
            withUpdatedCategories(categories => {
                const activeId = active.id.toString();
                const overId = over.id.toString();
        
                let activeCategory: StoreCategory | undefined;
        
                const removeCategory = (cats: StoreCategory[]): StoreCategory[] => {
                    for (let i = 0; i < cats.length; i++) {
                        if (cats[i].id === activeId) {
                            activeCategory = cats[i];
                            cats.splice(i, 1);
                            return cats;
                        }
                        if (cats[i].children) {
                            cats[i].children = removeCategory(cats[i].children);
                        }
                    }
                    return cats;
                };
        
                const newCategories = removeCategory(JSON.parse(JSON.stringify(categories)));
        
                if (!activeCategory) return categories;
        
                const overIsContainer = over.data.current?.isContainer;
                
                if (overIsContainer) {
                    const findAndInsertAsChild = (cats: StoreCategory[]): boolean => {
                        for (let cat of cats) {
                            if (cat.id === overId) {
                                cat.children.unshift({ ...activeCategory!, parentId: cat.id });
                                return true;
                            }
                            if (cat.children && findAndInsertAsChild(cat.children)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    findAndInsertAsChild(newCategories);
                } else {
                    let inserted = false;
                    const findAndInsertSibling = (cats: StoreCategory[]): boolean => {
                        for (let i = 0; i < cats.length; i++) {
                            if (cats[i].id === overId) {
                                const parent = findParentCategory(overId, categories);
                                activeCategory!.parentId = parent ? parent.id : null;
                                cats.splice(i, 0, activeCategory!);
                                inserted = true;
                                return true;
                            }
                            if (cats[i].children && findAndInsertSibling(cats[i].children)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    findAndInsertSibling(newCategories);
                    
                    if(!inserted) {
                         activeCategory!.parentId = null;
                         newCategories.push(activeCategory!);
                    }
                }
        
                return newCategories;
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
                            <CardTitle>Supplier Categories</CardTitle>
                            <CardDescription>Drag a category to map it to one of your store categories.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {allRawCategories.map(cat => (
                                <RawCategoryItem key={cat} category={cat} />
                            ))}
                             {allRawCategories.length === 0 && <p className="text-sm text-muted-foreground">No supplier categories found. Try syncing products first.</p>}
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
                                          onMerge={handleMerge}
                                          onAddSubCategory={handleAddSubCategory}
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
                {activeStoreCategoryData ? <StoreCategoryItem category={activeStoreCategoryData} onDelete={()=>{}} onRemoveRawCategory={()=>{}} onMerge={()=>{}} onAddSubCategory={()=>{}} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
