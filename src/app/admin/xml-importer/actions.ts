
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// A map to associate supplier names (lowercase) with their specific parser functions.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser, // Matching the name from suppliers context
  'megapap': megapapParser,
  // Add other specific supplier names here as needed
};

// A fallback parser for any supplier not in the specific map.
const fallbackParser = b2bportalParser;

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase().trim();

  // Find the correct parser from the map.
  let parserFn = parserMap[normalizedSupplierName];
  
  // If no specific parser is found, use the fallback.
  if (!parserFn) {
      console.warn(`No specific parser found for "${supplierName}". Using fallback parser.`);
      parserFn = fallbackParser;
  }

  try {
    console.log(`Using parser: ${parserFn.name} for supplier: "${supplierName}"`);
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" with parser ${parserFn.name}:`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". Please check the URL and XML format. Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
