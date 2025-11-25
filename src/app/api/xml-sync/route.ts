
// src/app/api/xml-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { mapProductsCategories } from '@/lib/mappers/categoryMapper';
import type { XmlProduct } from '@/lib/types/product';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// --- UNIVERSAL PARSER LOGIC ---

const xmlParser = new XMLParser({
    ignoreAttributes: true, // Simplified to ignore attributes for robustness
    isArray: (name) => name === 'product' || name === 'image', // Universal rule
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
});

function getText(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
    if (typeof node === 'object') {
        if (node.__cdata != null) return String(node.__cdata).trim();
        if (node._text != null) return String(node._text).trim();
        if (node['#text'] != null) return String(node['#text']).trim();
    }
    return '';
}

function findProductArray(node: any): any[] | null {
    if (!node || typeof node !== 'object') return null;

    // Direct match for common structures like <products><product> or <mywebstore><products><product>
    if (node.products?.product) {
        return Array.isArray(node.products.product) ? node.products.product : [node.products.product];
    }
    
    // Direct match for Zougris-style <Products><Product>
    if (node.Product && Array.isArray(node.Product)) {
        return node.Product;
    }

    // Recursive search for deeper nesting
    for (const key of Object.keys(node)) {
        const value = node[key];
        if (typeof value === 'object') {
            const result = findProductArray(value);
            if (result) return result;
        }
    }

    return null;
}

async function universalParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
    console.log("🔥 UNIVERSAL PARSER EXECUTING - FINAL VERSION");
    const parsed = xmlParser.parse(xmlText);
    const productArray = findProductArray(parsed);

    if (!productArray) {
        console.error("UNIVERSAL PARSER DEBUG: Could not find product array. Root keys:", Object.keys(parsed));
        throw new Error('Universal XML parsing failed: Could not locate a valid product array within the XML structure.');
    }

    const products = productArray.map((p: any): Omit<XmlProduct, 'category' | 'categoryId'> => {
        const images: string[] = [];
        const mainImageCandidate = getText(p.image) || getText(p.thumb) || getText(p.main_image) || getText(p.B2BImage);
        if (mainImageCandidate) images.push(mainImageCandidate);

        const galleryNode = p.gallery || p.images;
        if (galleryNode?.image) {
            const galleryImages = Array.isArray(galleryNode.image) ? galleryNode.image : [galleryNode.image];
            const extra = galleryImages.map((img: any) => getText(img)).filter(Boolean);
            images.push(...extra.filter((img: string) => !images.includes(img)));
        } else {
             const extraImages = [getText(p.B2BImage2),getText(p.B2BImage3),getText(p.B2BImage4),getText(p.B2BImage5)].filter(Boolean);
             images.push(...extraImages.filter(img => !images.includes(img)));
        }

        const availabilityText = getText(p.availability).toLowerCase();
        const isAvailable = availabilityText === '1' || availabilityText.includes('διαθέσιμο') || availabilityText.includes('ναι');
        const stock = Number(getText(p.quantity) || getText(p.qty) || getText(p.stock) || '0') || (isAvailable ? 1 : 0);

        const retailPriceNum = parseFloat(getText(p.retail_price_with_vat) || getText(p.retail_price) || '0');
        let wholesalePriceNum = parseFloat(getText(p.weboffer_price_with_vat) || getText(p.price) || '0');
        // Specific price logic for Megapap (sofa)
        if( (p.name?.toLowerCase() || '').includes('καναπ') ) {
            wholesalePriceNum += 75;
        }
        const finalPrice = wholesalePriceNum > 0 ? wholesalePriceNum : retailPriceNum;
        
        const name = getText(p.name) || getText(p.Title) || 'No Name';

        return {
            id: String(p.id ?? getText(p.code) ?? getText(p.sku) ?? `prod-${Math.random()}`),
            sku: getText(p.sku) || getText(p.code),
            model: getText(p.model),
            ean: getText(p.barcode),
            name: name,
            description: getText(p.descr) || getText(p.description),
            retailPrice: retailPriceNum.toString(),
            webOfferPrice: finalPrice.toString(),
            rawCategory: [getText(p.category), getText(p.subcategory), getText(p.Category1), getText(p.Category2), getText(p.Category3)].filter(Boolean).join(' > '),
            mainImage: images[0] || null,
            images: Array.from(new Set(images)),
            stock,
            isAvailable,
            manufacturer: getText(p.manufacturer),
            url: getText(p.url),
            variantGroupKey: p.variantGroupKey || undefined,
            color: p.color || undefined,
        };
    });

  return products;
}

// --- API ROUTE HANDLER ---

async function fetchWithTimeout(url: string, timeoutMs = 120000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, supplierName } = body;

    if (!url || !supplierName) {
      return NextResponse.json({ error: 'Missing url or supplierName.' }, { status: 400 });
    }

    console.log(`[API] Starting sync for supplier: ${supplierName}`);
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

    const xmlText = await response.text();
    if (!xmlText) throw new Error('Fetched XML content is empty.');

    const rawProducts = await universalParser(xmlText);

    console.log(`[API] Parsed ${rawProducts.length} raw products from ${supplierName}.`);

    const productsWithCategories = await mapProductsCategories(rawProducts);

    console.log(`[API] Mapped categories for ${productsWithCategories.length} products.`);

    return NextResponse.json({ products: productsWithCategories });

  } catch (err: any) {
    let status = 500;
    if (err.name === 'AbortError') {
      status = 504; // Gateway Timeout
      err.message = "The XML feed took too long to download and the request timed out."
    }

    console.error(`❌ API sync failed: ${err.message}`);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status });
  }
}
