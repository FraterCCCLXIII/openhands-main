import { Helmet } from "react-helmet-async";
import Markdown from "react-markdown";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import invariant from "tiny-invariant";
import { blogAPI } from "~/api/blog";
import { PlaceholderImage } from "~/components/placeholder-image";
import { formatDate } from "~/utils/format-date";

export const loader = ({ params }: LoaderFunctionArgs) => {
  invariant(params.slug, "No blog ID provided");

  const slug = params.slug.toString();
  const blog = blogAPI.getBlogBySlug(slug);

  invariant(blog, "No blog found");
  const { content, data } = blog;

  return {
    content,
    title: data.title,
    date: data.date,
    cover: data.coverImage || null,
    author: {
      name: data.author.name,
      src: data.author.picture,
    },
    excerpt: data.excerpt,
    ogImage: data.ogImage.url,
  }
};

export const ErrorBoundary = () => (
  <div className="flex flex-col items-center gap-4 text-center py-[45px]">
    <h1 className="heading">Error</h1>
    <p className="paragraph">There was an error loading the blog.</p>
  </div>
);

const BlogDetails = () => {
  const data = useLoaderData() as ReturnType<typeof loader>;

  return (
    <article className="flex flex-col items-center py-[45px] gap-8">
      <Helmet>
        <title>{data.title}</title>
        <meta
          name="description"
          content={data.excerpt}
        />
        <meta
          property="og:image"
          content={data.ogImage}
        />
      </Helmet>

      <figure className="w-[600px]">
        {!data.cover && <PlaceholderImage className="aspect-video" />}
        {data.cover && (
          <img
            src={data.cover}
            alt="blog cover"
            className="rounded-[10px] flex items-center justify-center aspect-video object-contain"
          />
        )}
      </figure>

      <main className="flex flex-col gap-4 w-[600px]">
        <h1 className="heading">{data.title}</h1>

        <header className="flex items-center gap-4 text-[17px] leading-6 font-semibold text-description">
          <img
            src={data.author.src}
            alt="author"
            width={40}
            height={40}
            className="bg-placeholder rounded-[10px]"
          />
          <span>By {data.author.name}</span>
          <span>&#8226;</span>
          <time dateTime={data.date}>{formatDate(data.date)}</time>
        </header>

        <section className="paragraph flex flex-col gap-4">
          <Markdown
            children={data.content}
            components={{
              a: (props) => <a rel="noreferrer" target="_blank" className="text-blue-600" {...props}>{props.children}</a>,
              h2: (props) => <h2 className="font-quincy text-5xl" {...props}>{props.children}</h2>,
              li: (props) => <li className="list-disc ml-5" {...props}>{props.children}</li>,
              img: (props) => <img className="rounded-lg" {...props} alt={props.alt} />,
              p: (props) => <p className="text-description" {...props}>{props.children}</p>,
            }}
          />
        </section>
      </main>
    </article>
  );
};

export default BlogDetails;
