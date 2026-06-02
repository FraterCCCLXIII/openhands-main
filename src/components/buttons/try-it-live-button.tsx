import clsx from 'clsx';
import { Link } from 'react-router';
import { GET_OPENHANDS_CTA } from '~/constants/site-shell';

interface TryItLiveButtonProps {}

export const TryItLiveButton: React.FC<TryItLiveButtonProps> = () => (
  <Link
    to={GET_OPENHANDS_CTA.href}
    target='_blank'
    rel='noopener noreferrer'
    className={clsx(
      'font-semibold px-4 py-2 text-sm rounded-lg',
      'bg-black text-white',
      'hover:bg-[#4B5563] hover:text-white transition-colors duration-50',
      'flex items-center gap-[15px]'
    )}
  >
    {GET_OPENHANDS_CTA.label}
  </Link>
);
