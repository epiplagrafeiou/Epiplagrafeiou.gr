
'use client';

import { useParams } from 'next/navigation';
import ClientCategory from "./ClientCategory";

export default function CategoryPage() {
  const params = useParams();
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || '');
  return <ClientCategory slug={slugPath} />;
}
