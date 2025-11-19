
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';


export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  const parsers: Record<string, (url: string) => Promise<XmlProduct[]>> = {
    'b2b portal': b2bportalParser,
    'zougris': zougrisParser,
    'megapap': megapapParser,
    'nordic designs': megapapParser,
    'milano furnishings': megapapParser,
    'office solutions inc.': megapapParser,
  };

  const key = supplierName.trim().toLowerCase();

  // 1) Validate supplier
  const parser = Object.keys(parsers).find(parserKey => key.includes(parserKey));

  if (!parser) {
    throw new Error(
      `No XML parser found for supplier "${supplierName}". Available suppliers: ${Object.keys(parsers).join(", ")}`
    );
  }

  const parserFn = parsers[parser];

  try {
    return await parserFn(url);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}". 
       Please check the URL or XML format. 
       Details: ${error?.message || error}`
    );
  }
}
