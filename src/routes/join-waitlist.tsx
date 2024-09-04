import { ActionFunctionArgs, json, useActionData, useNavigation } from "react-router-dom";
import { subscribeToWaitlist } from "~/api/mailchimp";
import { WaitlistForm } from "~/components/waitlist-form";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const user = formData.get("user");
  const org = formData.get("org");
  const first = formData.get("first");
  const last = formData.get("last");

  if (!email || typeof email !== "string") {
    return json({ result: "error", msg: "Email is required" });
  } else if (!user || typeof user !== "string") {
    return json({ result: "error", msg: "Username is required" });
  } else if (!org || typeof org !== "string") {
    return json({ result: "error", msg: "Company is required" });
  } else if (!first || typeof first !== "string") {
    return json({ result: "error", msg: "First name is required" });
  } else if (!last || typeof last !== "string") {
    return json({ result: "error", msg: "Last name is required" });
  }

  try {
    const data = await subscribeToWaitlist(email, user, org, first, last);
    return json(data);
  } catch (error) {
    return json({ result: "error", msg: "Failed to subscribe. Please try again later." });
  }
};

function JoinWaitlist() {
  const navigation = useNavigation();
  const data = useActionData() as { result: "success" | "error", msg: string } | undefined | null;

  return (
    <main className="flex flex-col items-center justify-center gap-4 pt-[45px]">
      <h1 className="heading">Join the Waitlist</h1>
      {data?.result !== "success" && (
        <p className="paragraph text-description lg:w-[466px] text-center">We're building a hosted version of OpenHands! If you'd like to be one of the first people to try it, you can reserve your spot in line by filling out the form below.</p>
      )}
      <WaitlistForm
        success={data?.result === "success" ? data.msg : undefined}
        error={data?.result === "error" ? data.msg : undefined}
        disabled={navigation.state === "submitting" || !!data}
      />
    </main>
  );
}

export default JoinWaitlist;
