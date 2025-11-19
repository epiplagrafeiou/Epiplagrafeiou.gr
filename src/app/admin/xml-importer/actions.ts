
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// A map of supplier-specific keywords to their dedicated parsers.
const parsers: { [key: string]: (url: string) => Promise<XmlProduct[]> } = {
  'zougris': zougrisParser,
  'megapap': megapapParser,
  'nordic designs': megapapParser, // Assuming megapap format
  'milano furnishings': megapapParser, // Assuming megapap format
  'office solutions inc.': megapapParser, // Assuming megapap format
  'b2b portal': b2bportalParser,
};

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase();
  
  // Find the appropriate parser function.
  // We iterate through our parser keys and see if the supplier name includes any of them.
  // This is more robust than relying on an exact match.
  const parserKey = Object.keys(parsers).find(key => normalizedSupplierName.includes(key));
  
  // If a specific key is found, use its parser. Otherwise, fall back to a default parser.
  const parserFn = parserKey ? parsers[parserKey] : b2bportalParser;

  try {
    // Execute the chosen parser function.
    return await parserFn(url);
  } catch (error) {
    // Provide a detailed error message if parsing fails.
    console.error(`Error syncing products for ${supplierName} using parser for '${parserKey || 'default: b2bportal'}' from URL ${url}:`, error);
    if (error instanceof Error) {
      throw new Error(
        `Could not parse XML for ${supplierName}. Please check the URL and XML format. Details: ${error.message}`
      );
    }
    // Handle cases where a non-Error object is thrown.
    throw new Error('An unknown error occurred during XML sync.');
  }
}
