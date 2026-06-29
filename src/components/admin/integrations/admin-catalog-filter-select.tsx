import { EnumFilterDropdown } from "@/src/components/ui/enum-filter-dropdown";
import {
  ADMIN_CATALOG_FILTER_LABELS,
  ADMIN_CATALOG_FILTER_VALUES,
  ADMIN_INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/admin-integrations-page";
import { cn } from "@/src/lib/utils";
import type { AdminCatalogFilter } from "@/src/types/admin-catalog";

interface AdminCatalogFilterSelectProps {
  value: AdminCatalogFilter;
  onChange: (value: AdminCatalogFilter) => void;
  className?: string;
}

export function AdminCatalogFilterSelect({
  value,
  onChange,
  className,
}: AdminCatalogFilterSelectProps) {
  return (
    <EnumFilterDropdown
      testId="admin-catalog-filter"
      triggerTestId="admin-catalog-filter-select"
      value={value}
      onChange={onChange}
      options={ADMIN_CATALOG_FILTER_VALUES}
      labelByValue={ADMIN_CATALOG_FILTER_LABELS}
      ariaLabel={ADMIN_INTEGRATIONS_PAGE_COPY.catalogFilterLabel}
      className={cn("w-full sm:w-52", className)}
      triggerClassName="h-9 w-full justify-between"
    />
  );
}
