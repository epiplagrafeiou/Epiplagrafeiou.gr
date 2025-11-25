
import ClientCategory from './ClientCategory';

export default function CategoryPage({ params }: { params: { slug: string[] }}) {
  const slug = params.slug.join('/');
  return <ClientCategory slug={slug} />;
}
