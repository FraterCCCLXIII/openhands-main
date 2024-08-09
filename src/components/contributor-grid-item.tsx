export const ContributorGridItemPlaceholder = () => (
  <div className="bg-placeholder rounded-[7px] w-[76px] aspect-square lg:w-[113px]" />
);

interface ContributorGridItemProps {
  contributor: Contributor;
}

export const ContributorGridItem: React.FC<ContributorGridItemProps> = ({ contributor }) => (
  <img
    src={contributor.avatar_url}
    alt={`contributor ${contributor.login}`}
    className="bg-placeholder rounded-[7px] w-[76px] aspect-square lg:w-[113px]"
  />
);
