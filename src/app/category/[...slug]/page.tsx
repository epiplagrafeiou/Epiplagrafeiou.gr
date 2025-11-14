
import ClientCategory from './ClientCategory';

type Props = { params: { slug: string[] } };

// This is now a Server Component. Its only job is to get the slug
// and pass it down to the Client Component that handles the UI.
export default function CategoryPage({ params }: Props) {
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || '');
  return <ClientCategory slug={slugPath} />;
}
