'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map multiple potential aliases/keys to the correct parser function.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  // Aliases for Zougris
  "zougris": zougrisParser,
  "zougrisgr": zougrisParser,
  "zougrisae": zougrisParser,
  
  // Aliases for B2B Portal
  "b2bportal": b2bportalParser,
  "b2b": b2bportalParser,

  // Fallback/Default
  "megapap": megapapParser,
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  // Normalize the supplier name aggressively to create a reliable key.
  // This removes spaces, special characters, and converts to lowercase.
  const key = supplierName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // Find the correct parser function from the map using the normalized key.
  const parserFn = parserMap[key];

  console.log(`DEBUG: Supplier: "${supplierName}" -> Normalized Key: "${key}" -> Parser Found: ${parserFn ? parserFn.name : 'None'}`);

  // If no parser is found for the generated key, throw a clear error.
  if (!parserFn) {
    throw new Error(
      `No parser found for supplier "${supplierName}" (normalized to "${key}"). 
       Valid parser keys are: ${Object.keys(parserMap).join(', ')}`
    );
  }

  try {
    // Execute the correctly selected parser.
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" with parser ${parserFn.name}`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Parser Used: ${parserFn.name}. 
       Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
