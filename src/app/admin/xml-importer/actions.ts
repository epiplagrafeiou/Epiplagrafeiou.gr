Here is the final, clean, safe, bullet-proof version of the code — including:

✅ strict parser selection
✅ no more incorrect matching
✅ full debug logs
✅ clear error messages
✅ ready to paste directly into your Firebase code editor

✅ FINAL VERSION — COPY & PASTE
'use server';

import { megapapParser, type XmlProduct } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';

// Map supplier ID → parser
const parserMap: Record<string, (url: string) => Promise<XmlProduct[]>> = {
  zougris: zougrisParser,
  b2bportal: b2bportalParser,
  megapap: megapapParser, 
};

// Create a safe, normalized key
function normalizeKey(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {

  // Diagnostic logs to detect mismatched supplier names
  console.log("🔍 RAW SUPPLIER NAME:", supplierName);

  const key = normalizeKey(supplierName);
  console.log("🔧 NORMALIZED KEY:", key);
  console.log("📦 AVAILABLE PARSERS:", Object.keys(parserMap));

  const parserFn = parserMap[key];

  if (!parserFn) {
    throw new Error(
      `❌ No parser found for supplier "${supplierName}" (normalized to "${key}"). 
Valid parser keys are: ${Object.keys(parserMap).join(', ')}

➡ FIX: Rename supplier in Firestore to exactly match one of the valid keys.`
    );
  }

  console.log(`✅ Using parser "${parserFn.name}" for supplier "${supplierName}"`);

  try {
    const products = await parserFn(url);
    console.log(`✔ Parsed ${products.length} products from ${supplierName}`);
    return products;
  } catch (error: any) {
    console.error(`❌ XML PARSE FAILURE for "${supplierName}"`, error);
    throw new Error(
      `Could not parse XML for supplier "${supplierName}".
Parser used: ${parserFn.name}
Details: ${error?.message || 'Unknown error occurred.'}`
    );
  }
}