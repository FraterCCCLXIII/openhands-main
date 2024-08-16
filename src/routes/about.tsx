import { Helmet } from "react-helmet-async";
import { ContributorGrid } from "~/components/contributor-grid";
import { MemberCard } from "~/components/member-card";
import { SectionHeading } from "~/components/section-heading";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import contributors from "~/data/contributors.json";

const members: Member[] = [
  {
    src: "/assets/members/robert.webp",
    name: "Robert Brennan",
    title: "CEO",
  },
  {
    src: "/assets/members/graham.webp",
    name: "Graham Neubig",
    title: "Chief Scientist",
  },
  {
    src: "/assets/members/xingyao.webp",
    name: "Xingyao Wang",
    title: "Chief AI Officer",
  },
  {
    src: "/assets/members/tim.webp",
    name: "Tim O'Farrell",
    title: "Founding Principal Engineer",
  },
];

const About = () => {
  return (
    <main>
      <Helmet>
        <title>All Hands AI - About Us</title>
        <meta
          name="description"
          content="Discover the talented team behind OpenDevin and how we leverage the power of collaboration to innovate in software development."
        />
      </Helmet>

      <section className="flex flex-col items-center gap-4 text-center py-[86px] px-[53px]">
        <h1 className="heading-large max-w-[763px]">It takes a village to build the future. So we invited the internet.</h1>
      </section>

      <section className="flex flex-col items-center">
        <SectionHeading
          subheading="OUR CONTRIBUTORS"
          heading="An Internet of People"
        >
          <p className="paragraph h-[75px]">Over 150 developers have contributed. Come join us!</p>
        </SectionHeading>
      </section>

      <section className="flex flex-col items-center py-[45px]">
        <div className="h-[calc(88px*4+40px)] lg:h-auto overflow-hidden relative">
          <ContributorGrid
            variant="large"
            contributors={contributors}
          />
          <div className="lg:hidden absolute bottom-0 bg-gradient-to-t from-[#F1EAE0] to-transparent h-[40px] w-full" />
        </div>
      </section>

      <section className="flex flex-col items-center">
        <SectionHeading
          subheading="OUR FULL-TIME TEAM"
        />

        <div className="flex flex-col justify-center lg:flex-row">
          {members.map((member) => (
            <MemberCard
              key={member.name}
              member={member}
            />
          ))}
        </div>
      </section>

      <section className="mb-[104px]">
        <YellowWaveSection
          heading="Ready to start building software with software that builds software?"
        />
      </section>
    </main >
  )
};

export default About;
