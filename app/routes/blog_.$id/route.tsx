const BlogDetails = () => {
  return (
    <article className="flex flex-col items-center py-[45px] gap-8">
      <figure className="w-[600px]">
        <img src="" alt="" className="bg-[#ACC8FF] aspect-video rounded-[10px]" />
      </figure>

      <main className="flex flex-col gap-4 w-[600px]">
        <h1 className="heading">Lorem Ipsum</h1>

        <header className="flex items-center gap-4 text-[17px] leading-6 font-semibold font-poppins text-[#292A36]">
          <img src="" alt="author" width={40} height={40} className="bg-[#D4CABD] rounded-[10px]" />
          <span>By Robert Brennan</span>
          <span>&#8226;</span>
          <time dateTime="2024-12-30">Dec 30, 2024</time>
        </header>

        <section className="paragraph flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <p key={index}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          ))}
        </section>
      </main>
    </article>
  );
};

export default BlogDetails;
