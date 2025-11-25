
'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import { mapProductsCategories } from '@/lib/category-mapper';
import type { XmlProduct } from '@/lib/types/product';

type ParserFn = (xml: string) => Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]>;

const parserMap: Record<string, ParserFn> = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2b portal': b2bportalParser,
  'b2bportal.gr': b2bportalParser,
  'zougris': zougrisParser,
};

// A fallback parser in case the supplier name doesn't match known parsers.
const fallbackParser = megapapParser;

async function fetchWithTimeout(url: string, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: 'no-store', // Disable caching for XML feeds
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  console.log(`🔥 Server Action: syncProductsFromXml started for supplier: ${supplierName}`);
  try {
    const normalizedName = supplierName.toLowerCase().trim();
    const parserFn = parserMap[normalizedName] || fallbackParser;

    console.log(`[Server Action] Fetching XML from: ${url}`);
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    if (!xmlText) {
      throw new Error('Fetched XML content is empty.');
    }
    console.log(`[Server Action] XML content fetched successfully.`);
    
    // Await the async parser function
    const rawProducts = await parserFn(xmlText);
    console.log(`[Server Action] Parsed ${rawProducts.length} raw products from ${supplierName}.`);

    const productsWithCategories = await mapProductsCategories(rawProducts);
    console.log(`[Server Action] Mapped categories for ${productsWithCategories.length} products.`);

    console.log(`✅ Server Action: syncProductsFromXml finished successfully for ${supplierName}.`);
    return productsWithCategories;

  } catch (error: any) {
     console.error(`❌ Server Action: syncProductsFromXml failed for ${supplierName}:`, error);
     if (error.name === 'AbortError') {
       throw new Error("The XML feed took too long to download and the request timed out.");
     }
     // Re-throw the error to be caught by the client
     throw new Error(error.message || 'An unexpected error occurred during the sync process.');
  }
}
