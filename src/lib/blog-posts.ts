
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  content: React.ReactNode;
  tags: string[];
}

// This array will hold all the blog posts.
// We will add articles here as we create them.
export const posts: Post[] = [];
