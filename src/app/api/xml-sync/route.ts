
// src/app/api/xml-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';

export const runtime = 'nodejs'; // Use Node.js runtime for long-running tasks
export const maxDuration = 300; // Set max duration to 5 minutes for Firebase App Hosting

type ParserFn = (xml: string) => Promise<XmlProduct[]>;

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

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
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

    // Use a generous timeout, but less than the function's maxDuration
    const response = await fetchWithTimeout(url, 240000); // 4 minutes
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch XML: ${response.status} ${response.statusText}`,
        },
        { status: 502 }
      );
    }

    const xmlText = await response.text();
    const products = await parserFn(xmlText);

    return NextResponse.json({ products });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'XML request to supplier timed out. The supplier server is too slow.' },
        { status: 504 }
      );
    }

    console.error('❌ XML sync API failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected server error while fetching/parsing XML.' },
      { status: 500 }
    );
  }
}
