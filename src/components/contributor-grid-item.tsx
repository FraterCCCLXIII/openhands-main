export const ContributorGridItemPlaceholder = () => (
  <div className="bg-placeholder rounded-[7px] w-[76px] aspect-square lg:w-[113px]" />
);

interface ContributorGridItemProps {
  contributor: Contributor;
}

export const ContributorGridItem: React.FC<ContributorGridItemProps> = ({ contributor }) => (
  <img
    src={`https://avatars.githubusercontent.com/u/${contributor.id}?v=4`}
    alt={contributor.login}
    className="bg-placeholder rounded-[10px] w-[80px] aspect-square lg:w-[100px]"
  />
);
