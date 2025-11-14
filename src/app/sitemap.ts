import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/user-actions';
import { createSlug } from '@/lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/user-actions'; // Import a modified getDb

async function getCategoriesForSitemap() {
    const products = await getProducts();
    const categoryPaths = new Set(products.map(p => p.category));
    const uniquePaths: { path: string, updatedAt: Date }[] = [];

    categoryPaths.forEach(categoryPath => {
        const parts = categoryPath.split(' > ');
        let currentPath = '';
        parts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${createSlug(part)}` : createSlug(part);
            if (!uniquePaths.some(p => p.path === `/category/${currentPath}`)) {
                 uniquePaths.push({ path: `/category/${currentPath}`, updatedAt: new Date() });
            }
        });
    });

    return uniquePaths;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://epiplagrafeiou.gr';
  
  let products: any[] = [];
  let categories: { path: string; updatedAt: Date; }[] = [];

  try {
    products = await getProducts();
    categories = await getCategoriesForSitemap();
  } catch (e) {
    console.error("Sitemap generation failed:", e);
    // Return a minimal sitemap on error to avoid breaking the build
     return [
        {
          url: baseUrl,
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 1,
        },
     ]
  }


  const productEntries: MetadataRoute.Sitemap = products.map(({ slug, id }) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: new Date(), 
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map(({ path, updatedAt }) => ({
    url: `${baseUrl}${path}`,
    lastModified: updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
     {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return [
    ...staticPages,
    ...productEntries,
    ...categoryEntries,
  ]
}
