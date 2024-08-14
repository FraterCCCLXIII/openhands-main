import { Form, LoaderFunctionArgs, useLoaderData, useNavigation } from "react-router-dom";
import { json } from "react-router-dom";
import { isConfig, } from "~/utils/share";
import { MetaHeader, TrajectoryMeta } from "~/components/share/meta-header";
import { TrajectoryList } from "~/components/share/trajectory-list";
import { fetchTrajectoryData, TrajectoryData } from "~/api/share";
import clsx from "clsx";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('share_id');

  if (!id) return json({ status: 400 });

  try {
    const data = await fetchTrajectoryData(id);

    const config = data.trajectory.find(isConfig);
    const trajectory = data.trajectory.filter((item) => !isConfig(item));

    const meta: TrajectoryMeta = {
      feedback: data.feedback,
      permissions: data.permissions,
      timestamp: data.timestamp,
      agent: config?.args.AGENT || "",
      language: config?.args.LANGUAGE || "",
      model: config?.args.LLM_MODEL || "",
    }
    return json({ id, trajectory, meta });
  } catch (error) {
    return json({ status: 404 });
  }
};

const Share = () => {
  const navigation = useNavigation();
  const data = useLoaderData() as {
    id: string;
    trajectory: TrajectoryData["trajectory"];
    meta: TrajectoryMeta;
  } | { status: number };

  return (
    <main className="flex flex-col items-center gap-4 py-[45px]">
      <h1 className="heading-large">Share</h1>
      <p className="description h-[25px]">
        {navigation.state === "loading" && "Loading..."}
      </p>
      <Form className="flex gap-2">
        <input
          name="share_id"
          type="text"
          placeholder="Enter Share ID"
          className="w-[500px] rounded-md px-4 py-2"
          defaultValue={"id" in data ? data.id : ""}
        />
        <button
          type="submit"
          className={clsx(
            "bg-black text-white",
            "font-semibold px-4 rounded-lg hover:bg-[#4B5563] hover:text-white",
          )}
        >
          Search
        </button>
      </Form>

      {"status" in data && (
        <div className="flex flex-col items-center gap-4 text-center py-[45px]">
          {data.status === 400 && (
            <p className="paragraph">Enter the share ID in the input above to view the full trajectory.</p>
          )}

          {data.status === 404 && (
            <>
              <h1 className="heading">Error</h1>
              <p className="paragraph">Share not found.</p>
            </>
          )}
        </div>
      )}

      {!("status" in data) && (
        <>
          <MetaHeader meta={data.meta} />
          <TrajectoryList trajectory={data.trajectory} />
        </>
      )}
    </main>
  );
};

export default Share;
