import { ContributorGridPlaceholder } from "~/components/contributor-grid-placeholder";
import { MemberCard } from "~/components/member-card";
import { SectionHeading } from "~/components/section-heading";
import { YellowWaveSection } from "~/components/yellow-wave-section";

const members: Member[] = [
  {
    src: "/assets/founders/robert.jpg",
    name: "Robert Brennan",
    title: "Cofounder",
    description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
  },
  {
    src: "/assets/founders/graham.jpg",
    name: "Graham Neubig",
    title: "Cofounder",
    description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
  },
  {
    src: "/assets/founders/xingyao.jpg",
    name: "Xingyao Wang",
    title: "Cofounder",
    description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
  },
];

const About = () => {
  return (
    <main>
      <section className="flex flex-col items-center gap-4 text-center py-[86px]">
        <h1 className="heading-large w-[763px] h-[266px]">Building the future takes a lot of talent. So we invited the internet.</h1>
        <p className="paragraph w-[466px] text-description">Made with the collaborative help of over 100 engineers in the opensource community. OpenDev changes the way you can create software.</p>
      </section>

      <section className="flex flex-col items-center">
        <SectionHeading
          subheading="OUR CONTRIBUTORS"
          heading="The Internet of People"
        />
        <div className="py-[45px]">
          <ContributorGridPlaceholder variant="large" />
        </div>
      </section>

      <section>
        <SectionHeading
          subheading="OUR TEAM"
          heading="With our power combined!"
        />

        <div className="flex justify-center">
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
    </main>
  )
};

export default About;
