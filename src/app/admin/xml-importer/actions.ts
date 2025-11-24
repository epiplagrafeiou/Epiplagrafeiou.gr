// src/app/admin/xml-importer/actions.ts
'use client';

import type { XmlProduct } from '@/lib/types/product';

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const res = await fetch('/api/xml-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, supplierName }),
  });

  if (!res.ok) {
    let message = `Could not parse XML for ${supplierName}. The server returned an error.`;
    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
       message = `An unexpected error occurred: ${res.statusText}`;
    }
    throw new Error(message);
  }

  const data = await res.json();
  return (data.products || []) as XmlProduct[];
}
