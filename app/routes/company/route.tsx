import { ContributorGridItem } from "~/components/contributor-grid-item";
import { YellowWave } from "~/components/yellow-wave";
import { MemberCard } from "./member-card";
import { SectionHeading } from "../../components/section-heading";
import { json, type MetaFunction } from "@remix-run/node";
import { fetchRepositoryContributors } from "~/api";
import { useLoaderData } from "@remix-run/react";

const members: Member[] = [
  { src: "", name: "Robert Brennan", title: "Cofounder", description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software." },
  { src: "", name: "Graham Neubig", title: "Cofounder", description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software." },
  { src: "", name: "Xingyao Wang", title: "Cofounder", description: "Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software." },
];

export const meta: MetaFunction = () => {
  return [
    { title: "All Hands - Company" },
    { name: "description", content: "Discover the talented team behind OpenDevin and how we leverage the power of collaboration to innovate in software development." },
  ];
};

export const loader = async () => {
  const contributors = await fetchRepositoryContributors("opendevin", "opendevin", 50);
  return json({ contributors }, { headers: { "Cache-Control": "max-age=1200" } });
}

const Company = () => {
  const { contributors } = useLoaderData<typeof loader>();

  return (
    <main>
      <section className="flex flex-col items-center gap-4 text-center py-[86px]">
        <h1 className="heading-large w-[763px] h-[266px]">Building the future takes a lot of talent. So we invited the internet.</h1>
        <p className="paragraph w-[466px] text-[#292A36]">Made with the collaborative help of over 100 engineers in the opensource community. OpenDev changes the way you can create software.</p>
      </section>

      <section className="flex flex-col items-center">
        <SectionHeading
          subheading="OUR CONTRIBUTORS"
          heading="The Internet of People"
        />
        <ul className="grid grid-cols-10 gap-4 py-[45px]">
          {contributors.map((contributor) => (
            <li key={contributor.id}>
              <ContributorGridItem contributor={contributor} />
            </li>
          ))}
        </ul>
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
        <YellowWave
          heading="Ready to start building software with software that builds software?"
        />
      </section>
    </main>
  )
};

export default Company;
