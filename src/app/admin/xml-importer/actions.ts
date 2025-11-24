
'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';

// Which supplier uses which parser
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'zougris': zougrisParser,
};

// B2B Portal is special (needs { url })
function callB2B(url: string) {
  return b2bportalParser({ url });
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const name = supplierName.toLowerCase().trim();

  // Choose parser
  let parserFn: (url: string) => Promise<XmlProduct[]> = parserMap[name];

  if (!parserFn) {
    if (name === 'b2b portal') {
      parserFn = callB2B;
    } else {
      parserFn = megapapParser; // fallback
    }
  }

  try {
    console.log(`📥 Fetching XML from: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed fetching XML: ${response.status} ${response.statusText}`);
    }

    // Send the parser ONLY the URL
    console.log(`🔍 Running parser for supplier: ${supplierName}`);
    const products = await parserFn(url);

    console.log(`✅ Parser returned ${products.length} products`);
    return products;

  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}":`, error);
    throw new Error(
      `Could not process XML for "${supplierName}". Details: ${error.message}`
    );
  }
}
