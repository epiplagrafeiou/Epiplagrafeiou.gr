
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
    isOverlay
}: { 
    category: StoreCategory, 
    onDelete: (categoryId: string) => void, 
    onRemoveRawCategory: (categoryId: string, rawCategory: string) => void,
    isOverlay?: boolean
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
                {category.children.length === 0 && category.rawCategories.length === 0 && <p className="text-xs text-muted-foreground py-2">Drag raw categories or other categories here</p>}
                
                {/* Render children recursively */}
                {category.children.length > 0 && (
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
                )}
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

    const findCategory = (id: string, categories: StoreCategory[]): StoreCategory | undefined => {
        for (const category of categories) {
            if (category.id === id) return category;
            const foundInChildren = findCategory(id, category.children);
            if (foundInChildren) return foundInChildren;
        }
        return undefined;
    };

    const removeCategory = (id: string, categories: StoreCategory[]): StoreCategory[] => {
        return categories.reduce((acc, category) => {
            if (category.id === id) return acc; // Skip adding the category to be deleted
            
            // Recurse on children
            const newChildren = removeCategory(id, category.children);
            acc.push({ ...category, children: newChildren });
            
            return acc;
        }, [] as StoreCategory[]);
    };

    const addCategoryToParent = (child: StoreCategory, parentId: string, categories: StoreCategory[]): StoreCategory[] => {
        return categories.map(category => {
            if (category.id === parentId) {
                // Add child to this category
                return { ...category, children: [...category.children, { ...child, parentId }] };
            }
            // Recurse to find parent in children
            return { ...category, children: addCategoryToParent(child, parentId, category.children) };
        });
    };

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
                    // Check for duplicates before adding
                    if (!sc.rawCategories.includes(rawCategory)) {
                         return { ...sc, rawCategories: [...sc.rawCategories, rawCategory] };
                    }
                }
                // Recurse through children
                if (sc.children.length > 0) {
                    return { ...sc, children: addRawToTarget(sc.children) };
                }
                return sc;
            });
        }
        
        // This function now removes the raw category from any other store category it might be in.
        const removeRawFromOthers = (categories: StoreCategory[], currentCategoryId: string, rawCatToRemove: string): StoreCategory[] => {
             return categories.map(sc => {
                const newChildren = sc.children.length > 0 ? removeRawFromOthers(sc.children, currentCategoryId, rawCatToRemove) : [];
                if (sc.id !== currentCategoryId && sc.rawCategories.includes(rawCatToRemove)) {
                    return {
                        ...sc,
                        rawCategories: sc.rawCategories.filter(rc => rc !== rawCatToRemove),
                        children: newChildren,
                    };
                }
                return { ...sc, children: newChildren };
            });
        }

        setStoreCategories(prev => {
            const treeWithoutRaw = removeRawFromOthers(prev, categoryId, rawCategory);
            return addRawToTarget(treeWithoutRaw);
        });
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
    
        if (!over || active.id === over.id) return;
    
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
        const overIsStore = over.data.current?.type === 'store-category' || over.data.current?.type === 'store-category-droppable';

        if(activeIsStore && overIsStore) {
            setStoreCategories(prev => {
                let activeCategory = findCategory(active.id as string, prev);
                
                // Ensure we have the latest version of the category without children if we're moving it
                if (activeCategory) {
                    activeCategory = {...activeCategory, children: []};
                }

                if (!activeCategory) return prev;
                
                // 1. Remove the active category from its current position in the tree.
                let newTree = removeCategory(active.id as string, prev);
                
                const overId = over.id as string;
                const isOverContainer = over.data.current?.isContainer;

                // 2. Add the active category to its new position.
                if (isOverContainer) {
                    // Dropped inside another category to become a child.
                    return addCategoryToParent(activeCategory, overId, newTree);
                } else {
                     // Reordering at the same level (root or within the same parent).
                     const oldParentId = findCategory(active.id as string, prev)?.parentId;
                     const newParentId = findCategory(overId, prev)?.parentId;
                     
                     // Root level reordering
                     if(!oldParentId && !newParentId) {
                         const oldIndex = prev.findIndex(c => c.id === active.id);
                         const newIndex = prev.findIndex(c => c.id === overId);
                         return arrayMove(newTree, oldIndex, newIndex);
                     }
                     
                     // Reordering within the same parent
                     if(oldParentId && oldParentId === newParentId){
                         let parent = findCategory(oldParentId, newTree);
                         if(parent){
                             const oldIndex = parent.children.findIndex(c => c.id === active.id);
                             const newIndex = parent.children.findIndex(c => c.id === over.id);
                             parent.children = arrayMove(parent.children, oldIndex, newIndex);
                             // Need to find a way to update the parent in the newTree immutably
                             const updateParent = (categories: StoreCategory[]): StoreCategory[] => {
                                 return categories.map(cat => {
                                     if(cat.id === parent?.id) return parent as StoreCategory;
                                     return {...cat, children: updateParent(cat.children)};
                                 })
                             }
                             return updateParent(newTree);
                         }
                     }
                     
                     // Default to moving to root if logic is complex
                     newTree.push({...activeCategory, parentId: null});
                }
                
                return newTree;
            });
        }
    };
    
    const activeRawCategory = activeId && typeof activeId === 'string' && activeId.startsWith('raw-') ? activeId.replace('raw-','') : null;
    const activeStoreCategoryData = activeId && (activeId as string).startsWith('cat-') ? findCategory(activeId as string, storeCategories) : null;
    
    // Only render top-level categories in the SortableContext
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
