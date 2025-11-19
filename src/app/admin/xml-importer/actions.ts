'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  "zougris": zougrisParser,
  "b2bportal": b2bportalParser,
};

function normalize(str: string) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const key = normalize(supplierName);
  // Default to megapapParser if no exact match is found
  const parser = parserMap[key] || megapapParser;

  console.log(`Normalized Key: "${key}" for Supplier: "${supplierName}"`);
  console.log("Matched parser:", parser === zougrisParser ? "Zougris" :
                                  parser === b2bportalParser ? "B2B Portal" :
                                  "Megapap (Default)");

  try {
    return await parser(url);
  } catch (err: any) {
    console.error(`❌ XML sync failed for "${supplierName}" using parser "${parser.name}"`, err);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". Details: ${err?.message}`
    );
  }
}
