import clsx from "clsx";
import { ContributorGridItem, ContributorGridItemPlaceholder } from "./contributor-grid-item";

interface ContributorGridProps {
  contributors: Contributor[];
  variant: "small" | "large";
}

export const ContributorGridPlaceholder: React.FC<Omit<ContributorGridProps, "contributors">> = ({ variant }) => (
  <ul
    className={clsx(
      "grid gap-4",
      variant === "small" && "grid-cols-4",
      variant === "large" && "grid-cols-10",
    )}
  >
    {Array
      .from({ length: variant === "small" ? 12 : 50 })
      .map((_, index) => (
        <li key={index}>
          <ContributorGridItemPlaceholder />
        </li>
      ))}
  </ul>
);

export const ContributorGrid: React.FC<ContributorGridProps> = ({ contributors, variant }) => (
  <ul
    data-testid="contributors"
    className={clsx(
      "grid gap-4",
      variant === "small" && "grid-cols-4",
      variant === "large" && "grid-cols-10",
    )}
  >
    {contributors.slice(0, variant === "small" ? 12 : 50).map((contributor) => (
      <li key={contributor.id}>
        <ContributorGridItem contributor={contributor} />
      </li>
    ))}
  </ul>
);
