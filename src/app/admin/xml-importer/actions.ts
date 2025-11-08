
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';

// In the future, we can add more parsers here.
const parsers: { [key: string]: (url: string) => Promise<XmlProduct[]> } = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2bportal.gr': b2bportalParser,
  'b2b portal': b2bportalParser,
};

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase();
  const parser = parsers[normalizedSupplierName] || megapapParser;

  if (!parser) {
    // This case should ideally not be reached with the fallback, but it's good practice.
    throw new Error(`No parser found for supplier: ${supplierName}`);
  }

  try {
    return await parser(url);
  } catch (error) {
    console.error(`Error syncing products for ${supplierName} from XML:`, error);
    if (error instanceof Error) {
      throw new Error(
        `Could not parse XML for ${supplierName}. Please check the URL and XML format. Details: ${error.message}`
      );
    }
    throw new Error('An unknown error occurred during XML sync.');
  }
}
