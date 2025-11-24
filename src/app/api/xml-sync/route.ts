// src/app/api/xml-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';

export const runtime = 'nodejs'; // Use Node.js runtime for long-running tasks
export const maxDuration = 300; // Set max duration to 5 minutes for Firebase App Hosting

type ParserFn = (xmlText: string) => Promise<XmlProduct[]>;

const parserMap: Record<string, ParserFn> = {
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2b portal': b2bportalParser,
  'b2bportal.gr': b2bportalParser,
  'zougris': zougrisParser,
};

const fallbackParser: ParserFn = megapapParser;

async function fetchWithTimeout(url: string, timeoutMs: number = 45000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const url = body?.url as string | undefined;
    const supplierName = body?.supplierName as string | undefined;

    if (!url || !supplierName) {
      return NextResponse.json(
        { error: 'Missing url or supplierName in request body.' },
        { status: 400 }
      );
    }

    const normalizedName = supplierName.toLowerCase().trim();
    const parserFn = parserMap[normalizedName] || fallbackParser;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch XML from supplier: ${response.status} ${response.statusText}`,
        },
        { status: 502 } // Bad Gateway
      );
    }

    const xmlText = await response.text();
    const products = await parserFn(xmlText);

    return NextResponse.json({ products });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        {
          error:
            'XML request to supplier timed out (45s limit). The supplier server is too slow or the file is too large.',
        },
        { status: 504 } // Gateway Timeout
      );
    }

    console.error('❌ XML sync API route failed:', err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          'An unexpected error occurred while fetching or parsing the XML.',
      },
      { status: 500 }
    );
  }
}
