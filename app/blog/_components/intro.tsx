export function Intro() {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between my-16 md:mb-12">
      <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
        All Hands Blog
      </h1>
      <h4 className="text-center md:text-left text-lg mt-5 md:pl-8">
        News and musings from{" "}
        <a
          href="https://all-hands.dev/"
          className="underline hover:text-blue-600 duration-200 transition-colors"
        >
          All Hands AI
        </a>, makers of
        {" "}
        <a
          href="https://github.com/OpenDevin/OpenDevin"
          className="underline hover:text-blue-600 duration-200 transition-colors"
        >
          OpenDevin
        </a>.
      </h4>
    </section>
  );
}
