
import { posts } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return {
      title: 'Άρθρο δεν βρέθηκε',
    };
  }

  return {
    title: `${post.title} | Epiplagrafeiou.gr Blog`,
    description: post.excerpt,
    openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.date,
        authors: [post.author],
        images: [
            {
                url: post.image,
                width: 1200,
                height: 630,
                alt: post.title,
            },
        ],
    },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
            {post.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{post.title}</h1>
        <p className="text-muted-foreground text-sm">
          Από {post.author} στις {new Date(post.date).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      <div className="relative h-96 w-full rounded-lg overflow-hidden mb-8">
        <Image src={post.image} alt={post.title} fill className="object-cover" priority />
      </div>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        {post.content}
      </div>

       <footer className="mt-12 border-t pt-8">
        <Link href="/blog" className="text-primary hover:underline">
          &larr; Επιστροφή στο Blog
        </Link>
      </footer>
    </article>
  );
}
