
'use server';

import { syncProductsFromXml as syncWithApi } from '@/lib/server-actions/xml-importer';
import type { XmlProduct } from '@/lib/types/product';

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  console.log(`🔥 Server Action started for supplier: ${supplierName}, URL: ${url}`);
  try {
    const products = await syncWithApi(url, supplierName);
    console.log(`✅ Synced ${products.length} products from ${supplierName} via Server Action.`);
    return products;
  } catch (error) {
    console.error(`❌ Server Action error syncing ${supplierName}:`, error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred during XML sync.');
  }
}
