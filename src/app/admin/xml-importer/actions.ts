
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

function normalizeKey(str: string): string {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}


export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  const key = normalizeKey(supplierName);
  const parserFn = parserMap[key] || megapapParser; // Fallback to a default

  console.log("RAW SUPPLIER NAME RECEIVED:", supplierName);
  console.log("NORMALIZED:", key);
  console.log("Matched parser:", parserFn === zougrisParser ? "Zougris" :
                                  parserFn === b2bportalParser ? "B2B Portal" :
                                  "Megapap (Fallback)");


  if (!parserFn) {
      throw new Error(
      `No parser found for supplier "${supplierName}" (normalized to "${key}"). 
       Valid parser keys are: ${Object.keys(parserMap).join(', ')}`
    );
  }

  try {
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
