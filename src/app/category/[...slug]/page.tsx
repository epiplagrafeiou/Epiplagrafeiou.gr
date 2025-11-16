'use client';
import ClientCategory from "./ClientCategory";

type Props = { params: { slug: string[] } };

export default function CategoryPage({ params }: Props) {
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || '');
  return <ClientCategory slug={slugPath} />;
}
