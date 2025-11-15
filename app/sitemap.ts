
import { MetadataRoute } from 'next'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://epiplagrafeiou.gr';

  const staticRoutes = [
    '',
    '/products',
    '/contact',
    '/privacy-policy',
    '/refund-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  // For now, we will only return static routes to avoid any server-side errors.
  // Dynamic routes can be added back later once the app is stable.
  
  return staticRoutes;
}
