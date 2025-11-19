
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase();

  let parserFn: (url: string) => Promise<XmlProduct[]>;

  // Use a clear if-else-if structure to ensure the correct parser is chosen.
  if (normalizedSupplierName.includes('zougris')) {
    parserFn = zougrisParser;
  } else if (normalizedSupplierName.includes('b2b portal')) {
    parserFn = b2bportalParser;
  } else {
    // Default to megapap for other known formats or as a general fallback.
    parserFn = megapapParser;
  }

  try {
    // Execute the chosen parser function.
    return await parserFn(url);
  } catch (error) {
    // Provide a detailed error message if parsing fails.
    console.error(`Error syncing products for ${supplierName} using its dedicated parser from URL ${url}:`, error);
    if (error instanceof Error) {
      throw new Error(
        `Could not parse XML for ${supplierName}. Please check the URL and XML format. Details: ${error.message}`
      );
    }
    // Handle cases where a non-Error object is thrown.
    throw new Error('An unknown error occurred during XML sync.');
  }
}
