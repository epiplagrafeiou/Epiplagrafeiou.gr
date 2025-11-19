'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID/aliases → parser
// This allows for flexible matching of supplier names.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  // Aliases for Zougris
  "zougris": zougrisParser,
  "zougrisgr": zougrisParser,

  // Aliases for B2B Portal
  "b2bportal": b2bportalParser,
  "b2b": b2bportalParser,

  // Alias for Megapap (also the fallback)
  "megapap": megapapParser,
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  // Bullet-proof key normalization: lowercase, remove all spaces and special characters.
  // This makes matching robust against variations like "Zougris.gr", "Zougris AE", etc.
  const key = supplierName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const parserFn = parserMap[key] || megapapParser; // Fallback to megapap if no key matches

  console.log(`DEBUG: Original Supplier Name: "${supplierName}", Normalized Key: "${key}", Parser Selected: ${parserFn.name}`);
  
  if (!parserMap[key]) {
      console.warn(`No specific parser found for supplier key "${key}". Defaulting to megapapParser.`);
  }

  try {
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
