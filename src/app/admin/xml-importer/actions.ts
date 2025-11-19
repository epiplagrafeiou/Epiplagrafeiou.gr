'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID → parser
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  zougris: zougrisParser,
  'b2b portal': b2bportalParser, // Kept the space for the existing key
  megapap: megapapParser,
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  // ALWAYS work with clean IDs, not fuzzy matching
  // First, try a direct match
  let key = supplierName.trim().toLowerCase();
  let parserFn = parserMap[key];

  // If direct match fails, try replacing spaces to match keys like "b2b portal"
  if (!parserFn) {
      key = key.replace(/\s+/g, ' ');
      parserFn = parserMap[key];
  }

  if (!parserFn) {
    // If still no match, fallback to a version without spaces, e.g. "b2bportal"
    key = key.replace(/\s+/g, '');
    parserFn = parserMap[key];
  }
  
  // Final check before defaulting
  if (!parserFn) {
      // Fallback to megapap if no specific parser is found
      console.warn(`No specific parser found for supplier "${supplierName}". Defaulting to megapap parser.`);
      parserFn = megapapParser;
  }


  try {
    console.log(`Using parser for key: ${key} for supplier: "${supplierName}"`);
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Details: ${error?.message || 'Unknown error.'}`
    );
  }
}