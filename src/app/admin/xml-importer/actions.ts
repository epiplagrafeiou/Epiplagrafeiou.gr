'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID → parser
// This provides a strict, error-proof way to select the correct parser.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  zougris: zougrisParser,
  b2bportal: b2bportalParser,
  // Add any other specific suppliers here
};

// Normalization function to create a clean key from the supplier name.
function normalize(str: string): string {
  if (!str) return '';
  // Converts to lowercase and removes all non-alphanumeric characters.
  // "Zougris AE" becomes "zougrisae"
  // "B2B Portal" becomes "b2bportal"
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  // DEBUG LOG as requested to see the exact input value.
  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);

  const key = normalize(supplierName);
  
  // Select the parser from the map using the exact key.
  // Fallback to megapapParser if no specific parser is found.
  const parserFn = parserMap[key] || megapapParser;

  // Debugging logs to confirm the correct parser is being used.
  console.log(`[XML Sync] Supplier: "${supplierName}" -> Normalized Key: "${key}"`);
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
