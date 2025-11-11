import { MetadataRoute } from 'next'
import { products } from '@/lib/data'; // Using static data for now
import { createSlug } from '@/lib/utils';

// This is a placeholder for fetching real data in a server environment.
// In a real app, you would fetch products and categories from your database.
const getProductsForSitemap = () => {
  return products.map(p => ({
      slug: p.slug,
      updatedAt: new Date(),
  }));
};

const getCategoriesForSitemap = () => {
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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://epiplagrafeiou.gr';

  const productEntries: MetadataRoute.Sitemap = getProductsForSitemap().map(({ slug, updatedAt }) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = getCategoriesForSitemap().map(({ path, updatedAt }) => ({
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
