// src/app/api/xml-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import { mapProductsCategories } from '@/lib/mappers/categoryMapper';
import type { XmlProduct } from '@/lib/types/product';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

type ParserFn = (xml: string) => Omit<XmlProduct, 'category' | 'categoryId'>[];

// The parser map now points to the simple, synchronous parser functions.
const parserMap: Record<string, ParserFn> = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2b portal': b2bportalParser,
  'b2bportal.gr': b2bportalParser,
  'zougris': zougrisParser,
};

const fallbackParser = megapapParser;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, supplierName } = body;

    if (!url || !supplierName) {
      return NextResponse.json({ error: 'Missing url or supplierName.' }, { status: 400 });
    }
    
    console.log(`[API] Starting sync for supplier: ${supplierName}`);
    const normalizedName = supplierName.toLowerCase().trim();
    const parserFn = parserMap[normalizedName] || fallbackParser;
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const xmlText = await response.text();
    if (!xmlText) throw new Error('Fetched XML content is empty.');

    // Step 1: Parse the XML into raw product data (fast and synchronous)
    const rawProducts = parserFn(xmlText);
    console.log(`[API] Parsed ${rawProducts.length} raw products from ${supplierName}.`);

    // Step 2: Map categories for all products in one efficient batch.
    const productsWithCategories = await mapProductsCategories(rawProducts);
    console.log(`[API] Mapped categories for ${productsWithCategories.length} products.`);

    return NextResponse.json({ products: productsWithCategories });

  } catch (err: any) {
    let status = 500;
    if (err.name === 'AbortError') status = 504; // Gateway Timeout
    
    console.error(`❌ API sync failed: ${err.message}`);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status });
  }
}
