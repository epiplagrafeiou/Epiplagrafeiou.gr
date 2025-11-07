import { ProductCard } from '@/components/products/ProductCard';
import { products, categories } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ProductsPage() {
  return (
    <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 md:grid-cols-4">
      <aside className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox id={category} />
                    <Label htmlFor={category}>{category}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="mb-4 font-semibold">Price Range</h3>
              <Slider
                defaultValue={[500]}
                max={2000}
                step={10}
                className="my-4"
              />
               <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(0)}</span>
                <span>{formatCurrency(2000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
      <main className="md:col-span-3">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
