import {
  Form,
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { isConfig } from '~/utils/share';
import {
  MetaHeader,
  type TrajectoryMeta,
} from '~/components/share/meta-header';
import { TrajectoryList } from '~/components/share/trajectory-list';
import { fetchTrajectoryData, type TrajectoryData } from '~/api/share';
import clsx from 'clsx';
import type { Route } from './+types/share';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('share_id');

  if (!id) return { status: 400 };

  try {
    const data = await fetchTrajectoryData(id);

    const config = data.trajectory.find(isConfig);
    const trajectory = data.trajectory.filter((item) => !isConfig(item));

    const meta: TrajectoryMeta = {
      feedback: data.feedback,
      permissions: data.permissions,
      timestamp: data.timestamp,
      agent: config?.args.AGENT || '',
      language: config?.args.LANGUAGE || '',
      model: config?.args.LLM_MODEL || '',
    };
    return { id, trajectory, meta };
  } catch (error) {
    return { status: 404 };
  }
};

export const meta: Route.MetaFunction = ({ data, location }) => {
  if (!data || 'status' in data) {
    return [
      { title: 'All Hands AI - Shared Trajectory' },
      { name: 'description', content: 'View shared OpenHands AI agent trajectories and interactions.' },
      { property: 'og:title', content: 'All Hands AI - Shared Trajectory' },
      { property: 'og:description', content: 'View shared OpenHands AI agent trajectories and interactions.' },
      { property: 'og:image', content: '/assets/all-hands-text-logo.png' },
      { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'All Hands AI' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'All Hands AI - Shared Trajectory' },
      { name: 'twitter:description', content: 'View shared OpenHands AI agent trajectories and interactions.' },
      { name: 'twitter:image', content: '/assets/all-hands-text-logo.png' },
      { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
    ];
  }

  const agent = data.meta?.agent || 'Unknown Agent';
  const model = data.meta?.model || 'Unknown Model';

  return [
    { title: `All Hands AI - Shared Trajectory (${agent})` },
    { name: 'description', content: `View a shared OpenHands AI agent trajectory using ${model} model.` },
    { property: 'og:title', content: `All Hands AI - Shared Trajectory (${agent})` },
    { property: 'og:description', content: `View a shared OpenHands AI agent trajectory using ${model} model.` },
    { property: 'og:image', content: '/assets/all-hands-text-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `All Hands AI - Shared Trajectory (${agent})` },
    { name: 'twitter:description', content: `View a shared OpenHands AI agent trajectory using ${model} model.` },
    { name: 'twitter:image', content: '/assets/all-hands-text-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Share = () => {
  const navigation = useNavigation();
  const data = useLoaderData() as
    | {
        id: string;
        trajectory: TrajectoryData['trajectory'];
        meta: TrajectoryMeta;
      }
    | { status: number };

  return (
    <main className='flex flex-col items-center gap-4 py-[45px]'>
      <h1 className='heading-large'>Share</h1>
      <p className='description h-[25px]'>
        {navigation.state === 'loading' && 'Loading...'}
      </p>
      <Form className='flex gap-2'>
        <input
          name='share_id'
          type='text'
          placeholder='Enter Share ID'
          className='lg:w-[500px] rounded-md px-4 py-2'
          defaultValue={'id' in data ? data.id : ''}
        />
        <button
          type='submit'
          disabled={navigation.state === 'loading'}
          className={clsx(
            'bg-black text-white',
            'font-semibold px-4 rounded-lg hover:bg-[#4B5563] hover:text-white disabled:opacity-50 transition-colors duration-50'
          )}
        >
          Search
        </button>
      </Form>

      {'status' in data && (
        <div className='flex flex-col items-center gap-4 text-center py-[45px] px-[42px]'>
          {data.status === 400 && (
            <p className='paragraph'>
              Enter the share ID in the input above to view the full trajectory.
            </p>
          )}

          {data.status === 404 && (
            <>
              <h1 className='heading'>Error</h1>
              <p className='paragraph'>Share not found.</p>
            </>
          )}
        </div>
      )}

      {!('status' in data) && (
        <>
          <MetaHeader meta={data.meta} />
          <TrajectoryList trajectory={data.trajectory} />
        </>
      )}
    </main>
  );
};

export default Share;
