
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// The parser map uses lowercase keys for consistent, case-insensitive matching.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser,
};

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);

  // Normalize the incoming supplier name to be lowercase and trimmed.
  const normalizedSupplierName = supplierName.trim().toLowerCase();
  
  // Find the correct parser function from the map based on the normalized name.
  // Fallback to megapapParser if no specific parser is found.
  const parserFn = parserMap[normalizedSupplierName] || megapapParser;

  console.log(`[XML Sync] Supplier: "${supplierName}" -> Normalized Key: "${normalizedSupplierName}"`);
  console.log(`[XML Sync] Parser Selected: ${parserFn.name}`);

  try {
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" using ${parserFn.name}`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
