'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';
import { XMLParser } from 'fast-xml-parser';

const parserMap: Record<string, (json: any) => Promise<XmlProduct[]>> = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser,
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
};

const fallbackParser = megapapParser;

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase().trim();
  const parserFn = parserMap[normalizedSupplierName] || fallbackParser;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
    
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
      allowBooleanAttributes: true,
      trimValues: true,
      parseAttributeValue: true,
      parseNodeValue: true,
    });
    
    const parsedJson = xmlParser.parse(xmlText);

    return await parserFn(parsedJson);
  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}":`, error);
    throw new Error(
      `Could not process XML for "${supplierName}". Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
