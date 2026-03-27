import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          nextSearchParams.append(key, entry);
        }
      }
      continue;
    }

    if (value) {
      nextSearchParams.set(key, value);
    }
  }

  redirect(
    nextSearchParams.size > 0
      ? `/integrations?${nextSearchParams.toString()}`
      : "/integrations",
  );
}
