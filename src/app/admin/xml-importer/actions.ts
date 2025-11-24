
// src/app/admin/xml-importer/actions.ts
'use server';

import type { XmlProduct } from '@/lib/types/product';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

type ParserFn = (url: string) => Promise<XmlProduct[]>;

const parserMap: Record<string, ParserFn> = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,

  'b2b portal': b2bportalParser,
  'b2bportal': b2bportalParser,
  'b2bportal.gr': b2bportalParser,

  'zougris': zougrisParser,
};

const fallbackParser: ParserFn = megapapParser;

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const normalized = supplierName.toLowerCase().trim();
  const parserFn = parserMap[normalized] || fallbackParser;

  try {
    console.log(`[ACTION] 🚀 Starting sync for "${supplierName}" with parser: ${parserFn.name}`);
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}" (${url}):`, error);
    throw new Error(
      `Could not parse XML for ${supplierName}. Please check the URL and XML format. Details: ${
        error?.message || 'Unknown error.'
      }`
    );
  }
}
