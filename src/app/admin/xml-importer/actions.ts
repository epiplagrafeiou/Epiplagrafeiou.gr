
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';

// In the future, we can add more parsers here.
const parsers: { [key: string]: (url: string) => Promise<XmlProduct[]> } = {
  'default': megapapParser, // Default for any unspecified 'megapap' format
  'Megapap': megapapParser,
  'Nordic Designs': megapapParser, // For existing mock data
  'Milano Furnishings': megapapParser,
  'Office Solutions Inc.': megapapParser,
  'b2bportal.gr': b2bportalParser, // New parser for b2bportal
};

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const parser = parsers[supplierName] || parsers['default'];

  if (!parser) {
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
