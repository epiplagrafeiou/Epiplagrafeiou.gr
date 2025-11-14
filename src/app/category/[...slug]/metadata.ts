import type { Metadata } from 'next';

type Props = {
  params: { slug: string | string[] };
};

function toTitleCase(str: string) {
    if (!str) return '';
    return str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || '');
  const pageTitlePart = Array.isArray(params.slug) ? params.slug[params.slug.length - 1] : (params.slug || '');
  
  const pageTitle = toTitleCase(pageTitlePart);

  return {
    title: `${pageTitle} - Epipla Graphiou AI eShop`,
    description: `Browse our collection of ${pageTitle.toLowerCase()} and other office furniture.`,
     alternates: {
      canonical: `/category/${slugPath}`,
    },
    openGraph: {
        title: `${pageTitle} - Epipla Graphiou AI eShop`,
        description: `Find the best ${pageTitle.toLowerCase()} for your office.`,
        url: `/category/${slugPath}`,
        type: 'website',
    }
  };
}
