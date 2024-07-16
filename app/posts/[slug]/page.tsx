import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CMS_NAME } from "app/api/blog/constants";
import markdownToHtml from "app/api/blog/markdownToHtml";
import { getAllPosts, getPostBySlug } from "app/api/blog/post";
import Alert from "app/blog/_components/alert";
import Container from "app/blog/_components/container";
import { PostBody } from "app/blog/_components/post-body";
import { PostHeader } from "app/blog/_components/post-header";
import Navbar from "components/NavBar";
import Footer from "components/Footer";


export default async function Post({ params }: Params) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  return (
    <main>
      <Navbar />
      <Alert preview={post.preview} />
      <Container>
        <article className="mx-auto max-w-7xl flex-grow mb-32 mt-20">
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
          />
          <PostBody content={content} />
        </article>
      </Container>
      <Footer />
    </main>
  );
}

type Params = {
  params: {
    slug: string;
  };
};

export function generateMetadata({ params }: Params): Metadata {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | Blog | All Hands AI`;

  return {
    title,
    openGraph: {
      title,
      images: [post.ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
