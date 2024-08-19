import fetchJsonp from "fetch-jsonp";

export const subscribeToNewsletter = async (email: string): Promise<{ result: string, msg: string }> => {
  const url = "https://dev.us17.list-manage.com/subscribe/post?u=669d348a75588dd92a51fb0a4&id=34795608c8";
  const query = new URLSearchParams({ EMAIL: email }).toString();
  const endpoint = url.replace("/post", "/post-json") + `&${query}`;

  // This is a JSONP request to Mailchimp's API
  // (Mailchimp doesn't support CORS, so we have to use JSONP)
  const response = await fetchJsonp(endpoint, {
    jsonpCallback: "c",
  });

  return response.json();
}
