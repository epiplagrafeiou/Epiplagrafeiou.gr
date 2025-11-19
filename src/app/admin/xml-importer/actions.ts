
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// A map to associate lowercase supplier names with their specific parsers.
const parserMap: { [key: string]: (url: string) => Promise<XmlProduct[]> } = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser,
  // Add other specific suppliers here if needed
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.trim().toLowerCase();

  // Find a specific parser key that is included in the supplier name.
  // This allows for variations like "Zougris" or "Zougris AE" to match "zougris".
  const parserKey = Object.keys(parserMap).find(key => normalizedSupplierName.includes(key));
  
  // If a specific key is found, use its parser. Otherwise, default to megapapParser.
  const parserFn = parserKey ? parserMap[parserKey] : megapapParser;

  try {
    console.log(`Using parser for key: "${parserKey || 'default (megapap)'}" for supplier: "${supplierName}"`);
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Please check the URL or XML format. 
       Details: ${error?.message || 'An unknown error occurred.'}`
    );
  }
}
