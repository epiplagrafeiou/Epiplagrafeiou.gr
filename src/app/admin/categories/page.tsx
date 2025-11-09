
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import the CategoryManager component with SSR turned off.
// This ensures that the dnd-kit library, which causes hydration errors,
// only runs on the client-side.
const CategoryManager = dynamic(() => import('@/components/admin/CategoryManager'), { 
  ssr: false,
  // Provide a loading skeleton to prevent layout shift while the component loads.
  loading: () => (
    <div className="p-8 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2">
                 <Skeleton className="h-96 w-full" />
            </div>
        </div>
    </div>
  )
})

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
