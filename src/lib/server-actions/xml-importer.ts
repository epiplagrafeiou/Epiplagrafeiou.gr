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

const fallbackParser = b2bportalParser;

async function fetchWithTimeout(url: string, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncProductsFromXml(url: string, supplierName: string) {
  try {
    if (!url || !supplierName) {
      throw new Error('Missing url or supplierName.');
    }

    const normalizedName = supplierName.toLowerCase().trim();
    const parserFn = parserMap[normalizedName] || fallbackParser;
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    if (!xmlText) {
      throw new Error('Fetched XML content is empty.');
    }

    const rawProducts = await parserFn(xmlText);
    const productsWithCategories = await mapProductsCategories(rawProducts);
    
    return productsWithCategories;

  } catch (err: any) {
    if (err.name === 'AbortError') {
       throw new Error("The XML feed took too long to download and the request timed out.");
    }
    throw new Error(err.message || 'An unexpected error occurred during XML parsing.');
  }
}
