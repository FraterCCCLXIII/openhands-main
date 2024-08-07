import { json, useLoaderData } from "@remix-run/react";
import { formatDate } from "~/utils/format-date";

export const loader = async () => {
  // fetch blog details here
  return json({
    title: "Lorem Ipsum",
    date: new Date().toISOString(),
    author: "Author Name",
    content: Array
      .from({ length: 5 })
      .map(() => "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."),
  });
};

const BlogDetails = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <article className="flex flex-col items-center py-[45px] gap-8">
      <figure className="w-[600px]">
        <img src="" alt="" className="bg-[#ACC8FF] aspect-video rounded-[10px]" />
      </figure>

      <main className="flex flex-col gap-4 w-[600px]">
        <h1 className="heading">{data.title}</h1>

        <header className="flex items-center gap-4 text-[17px] leading-6 font-semibold font-poppins text-[#292A36]">
          <img src="" alt="author" width={40} height={40} className="bg-[#D4CABD] rounded-[10px]" />
          <span>By {data.author}</span>
          <span>&#8226;</span>
          <time dateTime={data.date}>{formatDate(data.date)}</time>
        </header>

        <section className="paragraph flex flex-col gap-4">
          {data.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      </main>
    </article>
  );
};

export default BlogDetails;
