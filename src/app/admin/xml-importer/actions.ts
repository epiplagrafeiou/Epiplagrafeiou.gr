
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  "zougris": zougrisParser,
  "b2bportal": b2bportalParser,
  "megapap": megapapParser,
};

function normalize(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  const key = normalize(supplierName);
  const parserFn = parserMap[key];
  
  // Defensive logging as requested
  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);
  console.log("NORMALIZED KEY:", key);
  console.log("AVAILABLE PARSER KEYS:", Object.keys(parserMap));


  if (!parserFn) {
    throw new Error(
      `No parser found for supplier "${supplierName}" (normalized to "${key}"). Please ensure the supplier name in Firestore matches one of the following keys: ${Object.keys(parserMap).join(', ')}`
    );
  }
  
  console.log("MATCHED PARSER:", parserFn.name);

  try {
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" with parser ${parserFn.name}:`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
