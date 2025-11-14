import type { Metadata } from 'next';
import { createSlug } from '@/lib/utils';
import { getProducts } from '@/lib/user-actions';

type Props = {
  params: { slug: string | string[] };
};

function toTitleCase(str: string) {
    return str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
  
  // Find the category display name from products
  const products = await getProducts();
  const categoryData = products.find(p => {
    const pSlug = p.category.split(' > ').map(createSlug).join('/');
    return pSlug === slugPath;
  });

  const lastPart = categoryData?.category.split(' > ').pop() || slugPath.split('/').pop() || '';
  const pageTitle = toTitleCase(lastPart);

  return {
    title: `${pageTitle} - Epipla Graphiou AI eShop`,
    description: `Browse our collection of ${pageTitle.toLowerCase()} and other office furniture.`,
     alternates: {
      canonical: `/category/${slugPath}`,
    },
    openGraph: {
        title: `${pageTitle} - Epipla Graphiou AI eShop`,
        description: `Find the best ${pageTitle.toLowerCase()} for your office.`,
        url: `/category/${slugPath}`,
        type: 'website',
    }
  };
}
