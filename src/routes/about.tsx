import { Helmet } from "react-helmet-async";
import { ContributorGrid } from "~/components/contributor-grid";
import { MemberCard } from "~/components/member-card";
import { SectionHeading } from "~/components/section-heading";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import contributors from "~/data/contributors.json";
import statistics from "~/data/statistics.json";
import { formatContributorCount } from "~/utils/format-contributor-count";

const founders: Member[] = [
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
];

const members: Member[] = [
  {
    src: "/assets/members/tim.webp",
    name: "Tim O'Farrell",
    title: "Founding Principal Engineer",
  },
  {
    src: "https://avatars.githubusercontent.com/u/12611964?v=4",
    name: "Calvin Smith",
    title: "Senior Agent Researcher",
  },
  {
    src: "/assets/members/stephan.webp",
    name: "Stephan Psaras",
    title: "Senior Software Engineer",
  },
  {
    src: "https://ca.slack-edge.com/T07E1S2M2Q6-U082RR02VGQ-59331e932841-512",
    name: "Rohit Malhotra",
    title: "Software Engineer",
  },
  {
    src: "/assets/members/mahmoud.webp",
    name: "Mahmoud Hosseini",
    title: "Community Manager",
  },
  {
    src: "/assets/members/ray.webp",
    name: "Ray Myers",
    title: "Chief Architect",
  }, 
  {
    src: "https://ca.slack-edge.com/T06P212QSEA-U08DZAR5JR3-14c091a83032-512",
    name: "Chuck Butkus",
    title: "Principal Engineer",
  },
];

const About = () => {
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

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
        >
          <p className="paragraph h-[75px]">
            {formatContributorCount(statistics.contributors_count)} developers have contributed.
            {" "}
            <a
              className="underline"
              href="https://github.com/All-Hands-AI/OpenHands"
              target="_blank"
              rel="noopener noreferrer"
            >
              Come join us!
            </a>
          </p>
          <div className="h-[calc(88px*4+40px)] lg:h-auto overflow-hidden relative">
            <ContributorGrid
              variant="large"
              contributors={contributors}
            />
            <div className="lg:hidden absolute bottom-0 bg-gradient-to-t from-[#F1EAE0] to-transparent h-[40px] w-full" />
          </div>
        </SectionHeading>
      </section>

      <section className="flex flex-col items-center">
        <SectionHeading
          subheading="THE ALL HANDS TEAM"
        />

        <div className="flex flex-col justify-center lg:flex-row flex-wrap max-w-[1228px]">
          {founders.map((founder) => (
            <MemberCard
              key={founder.name}
              member={founder}
            />
          ))}
          {shuffledMembers.map((member) => (
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
          cta={{
            text: "View open jobs",
            to: "https://allhandsai.applytojob.com/apply/"
          }}
        />
      </section>
    </main >
  )
};

export default About;
