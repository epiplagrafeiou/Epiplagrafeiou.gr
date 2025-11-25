import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { getText, findProductArray } from './parser-utils';

export async function megapapParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
    const parser = new XMLParser({
        ignoreAttributes: true,
        isArray: (name) => name === 'product' || name === 'image',
        cdataPropName: '__cdata',
        textNodeName: '_text',
        trimValues: true,
    });

    const parsed = parser.parse(xmlText);
    const productArray = findProductArray(parsed);

    if (!productArray || productArray.length === 0) {
        throw new Error('Megapap XML parsing failed: Could not locate the product array within the XML structure.');
    }
    
    const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
        let images = (Array.isArray(p.images?.image) ? p.images.image : [p.images?.image]).map(getText).filter(Boolean);
        const mainImage = getText(p.main_image);
        if (mainImage && !images.includes(mainImage)) {
            images.unshift(mainImage);
        }

        return {
            id: getText(p.id),
            name: getText(p.name),
            description: getText(p.description),
            rawCategory: [getText(p.category), getText(p.subcategory)].filter(Boolean).join(' > '),
            stock: Number(getText(p.quantity) || getText(p.qty) || 0),
            retailPrice: getText(p.retail_price_with_vat),
            webOfferPrice: getText(p.weboffer_price_with_vat),
            mainImage: images[0] || null,
            images: images,
            sku: getText(p.id),
            ean: getText(p.barcode),
        };
    });

    return products;
}
