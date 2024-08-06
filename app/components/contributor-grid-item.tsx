interface ContributorGridItemProps {
  contributor: Contributor;
}

export const ContributorGridItem: React.FC<ContributorGridItemProps> = ({ contributor }) => (
  <img
    src={contributor.avatar_url}
    alt={`contributor ${contributor.login}`}
    className="bg-[#D4CABD] rounded-[7px] w-[76px] h-[76px] lg:w-[113px] lg:h-[113px]"
  />
);
