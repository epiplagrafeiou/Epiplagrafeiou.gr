// This file is obsolete as all logic has been centralized into the API route.
// It is kept to prevent breaking imports but should be considered deprecated.
// The primary action is now a client-side fetch in the page component.

'use server';

import type { XmlProduct } from '@/lib/types/product';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';


export async function syncProductsFromXml(url: string, supplierName: string): Promise<XmlProduct[]> {
  console.warn("DEPRECATED: syncProductsFromXml in actions.ts is called. This should be handled by the /api/xml-sync route.");

  const parsers: { [key: string]: (url: string) => Promise<any[]> } = {
    'megapap': megapapParser as any,
    'nordic designs': megapapParser as any,
    'milano furnishings': megapapParser as any,
    'office solutions inc.': megapapParser as any,
    'b2b portal': b2bportalParser as any,
    'zougris': zougrisParser as any,
  };
  
  const normalizedSupplierName = supplierName.toLowerCase();
  let parser = Object.keys(parsers).find(key => normalizedSupplierName.includes(key));
  const parserFn = parser ? parsers[parser] : b2bportalParser as any;

  if (!parserFn) {
    throw new Error(`No suitable parser found for supplier: ${supplierName}`);
  }

  try {
     const response = await fetch(url);
     if (!response.ok) {
       throw new Error(`Failed to fetch XML: ${response.statusText}`);
     }
     const xmlText = await response.text();
     return await parserFn(xmlText);
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
