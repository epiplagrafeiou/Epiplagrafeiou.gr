
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// In the future, we can add more parsers here.
const parsers: { [key: string]: (url: string) => Promise<XmlProduct[]> } = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2b portal': b2bportalParser,
  'zougris': zougrisParser,
};

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase();
  
  // Find a parser key that is included in the supplier's name.
  let parserKey = Object.keys(parsers).find(key => normalizedSupplierName.includes(key));
  
  // If no key is found, check if the URL contains a key (e.g., 'zougris.gr').
  // This is a robust fallback.
  if (!parserKey) {
    parserKey = Object.keys(parsers).find(key => url.includes(key));
  }

  // Use the found parser, or default to a generic one if no specific parser is matched.
  const parserFn = parserKey ? parsers[parserKey] : b2bportalParser;

  if (!parserFn) {
    // This case should ideally not be reached if there's a fallback.
    throw new Error(`No suitable parser found for supplier: ${supplierName}`);
  }

  try {
    return await parserFn(url);
  } catch (error) {
    console.error(`Error syncing products for ${supplierName} from XML:`, error);
    if (error instanceof Error) {
      // Re-throw with a more user-friendly message, but include original error details.
      throw new Error(
        `Could not parse XML for ${supplierName}. Please check the URL and XML format. Details: ${error.message}`
      );
    }
    // Handle non-Error objects being thrown.
    throw new Error('An unknown error occurred during XML sync.');
  }
}
