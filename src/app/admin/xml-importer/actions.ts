
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';


export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
    const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
        'zougris': zougrisParser,
        'b2b portal': b2bportalParser,
    };

    const normalizedSupplierName = supplierName.trim().toLowerCase();

    // Find the correct parser key from the map
    const parserKey = Object.keys(parserMap).find(key => normalizedSupplierName.includes(key));
    
    // Select the parser function, or default to megapapParser
    const parserFn = parserKey ? parserMap[parserKey] : megapapParser;

    try {
        return await parserFn(url);
    } catch (error: any) {
        console.error(`❌ XML sync failed for "${supplierName}"`, error);
        throw new Error(
        `Could not parse XML for supplier "${supplierName}". 
        Please check the URL or XML format. 
        Details: ${error?.message || 'An unknown error occurred.'}`
        );
    }
}
