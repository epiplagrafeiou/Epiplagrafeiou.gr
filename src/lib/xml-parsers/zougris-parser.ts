import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { getText, findProductArray } from './parser-utils';

export async function zougrisParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
    const parser = new XMLParser({
        ignoreAttributes: true,
        isArray: (name) => name === 'Product',
        cdataPropName: '__cdata',
        textNodeName: '#text',
        trimValues: true,
    });

    const parsed = parser.parse(xmlText);
    const productArray = findProductArray(parsed);

    if (!productArray || productArray.length === 0) {
        throw new Error('Zougris XML parsing failed: Could not locate the product array within the XML structure.');
    }
    
    const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
        const images = [getText(p.B2BImage), getText(p.B2BImage2), getText(p.B2BImage3), getText(p.B2BImage4), getText(p.B2BImage5)].filter(Boolean);
        const rawCategory = [getText(p.Category1), getText(p.Category2), getText(p.Category3)].filter(Boolean).join(' > ');
        
        const retailPrice = parseFloat(getText(p.RetailPrice)?.replace(',', '.') || '0');
        const wholesalePrice = parseFloat(getText(p.WholesalePrice)?.replace(',', '.') || '0');
        const webOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

        return {
            id: getText(p.Code) || `zougris-${Math.random()}`,
            name: getText(p.Title) || 'No Name',
            description: getText(p.Description) || '',
            rawCategory: rawCategory,
            stock: parseInt(getText(p.Quantity), 10) || 0,
            retailPrice: retailPrice.toString(),
            webOfferPrice: webOfferPrice.toString(),
            mainImage: images[0] || null,
            images: images,
            sku: getText(p.Code),
            ean: getText(p.Barcode),
        };
    });

    return products;
}
