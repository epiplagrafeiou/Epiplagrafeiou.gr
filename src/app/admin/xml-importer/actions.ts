
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID → parser
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  zougris: zougrisParser,
  b2bportal: b2bportalParser,
  megapap: megapapParser, 
};

// Helper function to create a clean, consistent key from the supplier name
function normalizeKey(name: string): string {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  // Create a clean key from the supplier name to use for the map lookup
  const key = normalizeKey(supplierName);
  
  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);
  console.log("NORMALIZED KEY:", key);
  console.log("AVAILABLE PARSER KEYS:", Object.keys(parserMap));
  
  const parserFn = parserMap[key];

  if (!parserFn) {
    throw new Error(
      `No parser found for supplier "${supplierName}" (normalized to "${key}"). 
       Valid keys are: ${Object.keys(parserMap).join(', ')}`
    );
  }
  
  console.log(`Using parser: ${parserFn.name} for supplier: "${supplierName}"`);

  try {
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" using ${parserFn.name}`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
