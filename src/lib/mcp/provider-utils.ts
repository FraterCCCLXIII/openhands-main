export const toToolText = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

export const toToolResult = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: toToolText(value),
    },
  ],
});

const readErrorBody = async (response: Response) => {
  const clonedResponse = response.clone();

  const jsonBody = await clonedResponse.json().catch(() => null);
  if (jsonBody) {
    return JSON.stringify(jsonBody);
  }

  const textBody = await response.text().catch(() => "");
  return textBody || response.statusText;
};

export const fetchJson = async <T>(
  input: string | URL,
  init: RequestInit,
  label: string,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(
      `${label} failed (${response.status}): ${await readErrorBody(response)}`,
    );
  }

  return (await response.json()) as T;
};
