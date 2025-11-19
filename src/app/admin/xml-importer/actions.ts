
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID → parser. Keys MUST be clean and lowercase.
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  "zougris": zougrisParser,
  "b2bportal": b2bportalParser,
  "megapap": megapapParser,
  // Add other aliases here if needed
  "zougrissa": zougrisParser, 
};

// Normalization function to create a clean key from the supplier name.
function normalizeKey(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);
  const key = normalizeKey(supplierName);
  console.log("NORMALIZED KEY:", key);
  console.log("AVAILABLE PARSER KEYS:", Object.keys(parserMap));

  const parserFn = parserMap[key] || megapapParser; // Fallback to megapap if no exact match

  if (!parserFn) {
      throw new Error(
      `No parser found for supplier "${supplierName}" (normalized to "${key}"). 
       Valid parser keys are: ${Object.keys(parserMap).join(', ')}`
    );
  }

  try {
    const parserName = Object.keys(parserMap).find(k => parserMap[k] === parserFn) || 'megapap (fallback)';
    console.log(`Using parser: "${parserName}" for supplier: "${supplierName}"`);
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
