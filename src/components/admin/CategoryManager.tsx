
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
import { DndContext, useDraggable, useDroppable, closestCenter, DragEndEvent, DragStartEvent, UniqueIdentifier, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PlusCircle, Trash2, GitMerge, Pencil, Save, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn, createSlug } from '@/lib/utils';
import { getCategoryMapping } from '@/lib/category-mapper';

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
    onRename,
    isOverlay,
}: { 
    category: StoreCategory, 
    onDelete: (categoryId: string) => void, 
    onRemoveRawCategory: (categoryId: string, rawCategory: string) => void,
    onMerge: (targetCategoryId: string, sourceCategory: StoreCategory | { name: string, rawCategories: string[] }) => void,
    onAddSubCategory: (parentId: string) => void,
    onRename: (categoryId: string) => void,
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
                    <Button variant="ghost" size="icon" onClick={() => onRename(category.id)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
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
                                onRename={onRename}
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

    const handleSeedCategories = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Database error', description: 'Firestore is not available.' });
            return;
        }
    
        const confirmation = confirm("Are you sure you want to clear all existing categories and seed the new structure? This action cannot be undone.");
        if (!confirmation) return;
    
        try {
            // 1. Clear all existing categories
            toast({ title: 'Clearing old categories...', description: 'Please wait.' });
            const categoriesCollectionRef = collection(firestore, 'categories');
            const existingDocs = await getDocs(categoriesCollectionRef);
            const deleteBatch = writeBatch(firestore);
            if(!existingDocs.empty) {
                existingDocs.forEach(doc => deleteBatch.delete(doc.ref));
                await deleteBatch.commit();
                toast({ title: 'Old categories cleared!', description: 'Now seeding new structure.' });
            } else {
                 toast({ title: 'No old categories to clear.', description: 'Proceeding to seed.' });
            }
    
            // 2. Seed the new structure
            const categoryMapping = await getCategoryMapping();
            const seedBatch = writeBatch(firestore);
            const categoriesToCreate = new Map<string, Partial<StoreCategory>>();
    
            for (const mapping of categoryMapping) {
                const { raw, mapped } = mapping;
                const pathParts = mapped.split(' > ');
                let parentId: string | null = null;
    
                for (let i = 0; i < pathParts.length; i++) {
                    const partName = pathParts[i];
                    const currentPath = pathParts.slice(0, i + 1).join(' > ');
                    const categoryId = `cat-${createSlug(currentPath)}`;
    
                    if (!categoriesToCreate.has(categoryId)) {
                        categoriesToCreate.set(categoryId, {
                            id: categoryId,
                            name: partName,
                            rawCategories: [],
                            parentId: parentId,
                            order: i,
                        });
                    }
    
                    if (i === pathParts.length - 1) {
                        const cat = categoriesToCreate.get(categoryId);
                        if (cat && cat.rawCategories && !cat.rawCategories.includes(raw)) {
                            cat.rawCategories.push(raw);
                        }
                    }
                    parentId = categoryId;
                }
            }
    
            categoriesToCreate.forEach((categoryData, categoryId) => {
                const docRef = doc(firestore, "categories", categoryId);
                seedBatch.set(docRef, categoryData);
            });
    
            await seedBatch.commit();
            toast({ title: 'Success!', description: `Category structure has been seeded successfully.` });
        } catch (error: any) {
            console.error("Error seeding categories:", error);
            toast({ variant: 'destructive', title: 'Seed Failed', description: error.message || 'An unexpected error occurred.' });
        }
    };

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

        const categoriesCollectionRef = collection(firestore, 'categories');
        const existingDocs = await getDocs(categoriesCollectionRef);
        existingDocs.forEach(oldDoc => {
            if (!idsToKeep.has(oldDoc.id)) {
                batch.delete(oldDoc.ref);
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

    }, [firestore, toast]);


    const allRawCategories = useMemo(() => {
        const set = new Set<string>();
        adminProducts.forEach(p => p.rawCategory && set.add(p.rawCategory));
        return Array.from(set).sort();
    }, [adminProducts]);
    
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
    
    const handleRenameCategory = (categoryId: string) => {
        withUpdatedCategories(prev => {
            const renameCategory = (categories: StoreCategory[]): StoreCategory[] => {
                return categories.map(cat => {
                    if (cat.id === categoryId) {
                        const newName = prompt("Enter new category name:", cat.name);
                        return { ...cat, name: newName || cat.name };
                    }
                    return { ...cat, children: renameCategory(cat.children) };
                });
            };
            return renameCategory(prev);
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
                     <Button onClick={() => saveCategories(storeCategories)}>
                        <Save className="mr-2 h-4 w-4"/>
                        Save All Changes
                    </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Supplier Categories</CardTitle>
                            <CardDescription>Drag a category to map it to one of your store categories.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {uncategorized.map(cat => (
                                <RawCategoryItem key={cat} category={cat} />
                            ))}
                             {uncategorized.length === 0 && <p className="text-sm text-muted-foreground">All raw categories have been mapped!</p>}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>My Store Categories</CardTitle>
                                    <CardDescription>Organize your store's navigation structure here.</CardDescription>
                                </div>
                                <Button onClick={handleSeedCategories} variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Clear & Seed Categories
                                </Button>
                            </div>
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
                                          onRename={handleRenameCategory}
                                      />
                                  ))}
                                </div>
                            </SortableContext>
                             {storeCategories.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Add a category or seed the main ones to get started.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DragOverlay>
                {activeRawCategory ? <div className="flex cursor-grabbing items-center rounded-md border bg-card p-3 shadow-lg"><GripVertical className="mr-2 h-5 w-5 text-muted-foreground" /> {activeRawCategory}</div> : null}
                {activeStoreCategoryData ? <StoreCategoryItem category={activeStoreCategoryData} onDelete={()=>{}} onRemoveRawCategory={()=>{}} onMerge={()=>{}} onAddSubCategory={()=>{}} onRename={()=>{}} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
