import fetchJsonp from "fetch-jsonp";

export const subscribeToWaitlist = async (
  email: string,
  username: string,
  company: string,
  first: string,
  last: string
): Promise<{ result: string, msg: string }> => {
  const url = new URL("https://dev.us17.list-manage.com/subscribe/post?u=669d348a75588dd92a51fb0a4&id=2fa1c57c19");
  url.searchParams.append("MERGE0", email);
  url.searchParams.append("MERGE6", username);
  url.searchParams.append("MERGE5", company);
  url.searchParams.append("MERGE1", first);
  url.searchParams.append("MERGE2", last);
  const endpoint = url.toString().replace("/post", "/post-json");

  // This is a JSONP request to Mailchimp's API
  // (Mailchimp doesn't support CORS, so we have to use JSONP)
  const response = await fetchJsonp(endpoint, {
    jsonpCallback: "c",
  });

  return response.json();
};

export const subscribeToNewsletter = async (email: string) => {
  const url = new URL("https://dev.us17.list-manage.com/subscribe/post?u=669d348a75588dd92a51fb0a4&id=34795608c8");
  url.searchParams.append("EMAIL", email);
  const endpoint = url.toString();

  // This is a JSONP request to Mailchimp's API
  // (Mailchimp doesn't support CORS, so we have to use JSONP)
  const response = await fetchJsonp(endpoint, {
    jsonpCallback: "c",
  });

  const data = await response.json();
  return data;
}
