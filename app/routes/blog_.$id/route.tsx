import React from "react";
import { json, useLoaderData } from "@remix-run/react";
import { formatDate } from "~/utils/format-date";
import { PlaceholderImage } from "../blog/placeholder-image";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";

import { getMDXComponent } from 'mdx-bundler/client';
import invariant from "tiny-invariant";
import { getBlogByIndex } from "~/posts";


export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "No blog ID provided");

  const id = Number(params.id);
  const blog = await getBlogByIndex(id);

  invariant(blog, "No blog found");

  const { code, frontmatter } = blog;
  return json({
    title: frontmatter.title,
    date: frontmatter.date,
    cover: frontmatter.coverImage || null,
    author: {
      name: frontmatter.author.name,
      src: frontmatter.author.picture,
    },
    excerpt: frontmatter.excerpt,
    content: code,
    ogImage: frontmatter.ogImage.url,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => ([
  { title: data?.title || "Blog Details" },
  { name: "description", content: data?.excerpt || "Read more about the blog" },
  { name: "og:image", content: data?.ogImage || "" },
  { name: "og:title", content: data?.title || "Blog Details" },
  { name: "og:description", content: data?.excerpt || "Read more about the blog" },
]);

const BlogDetails = () => {
  const data = useLoaderData<typeof loader>();
  const Component = React.useMemo(() => getMDXComponent(data.content), [data.content]);

  return (
    <article className="flex flex-col items-center py-[45px] gap-8">
      <figure className="w-[600px]">
        {!data.cover && <PlaceholderImage className="aspect-video" />}
        {data.cover && (
          <img
            src={data.cover}
            alt="blog cover"
            className="rounded-[10px] bg-[#ACC8FF] flex items-center justify-center aspect-video object-contain"
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
          <Component
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

export const ErrorBoundary = () => (
  <div className="flex flex-col items-center gap-4 text-center py-[45px]">
    <h1 className="heading">Error</h1>
    <p className="paragraph">There was an error loading the blog.</p>
  </div>
);

export default BlogDetails;
