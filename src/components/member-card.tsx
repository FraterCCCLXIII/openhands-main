interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => (
  <article
    data-wf-el='standard-collection-list-item'
    className='relative flex w-full flex-wrap items-center justify-between gap-4 px-5 sm:w-1/2 lg:w-1/4 lg:max-w-[25%]'
    style={{ alignContent: 'space-between' }}
  >
    <div
      data-wf-el='standard-media'
      data-testid='member-card-media'
      className='h-[190px] w-[190px] overflow-hidden rounded-[6.4px]'
      style={{ borderStyle: 'none' }}
    >
      <img data-wf-el='standard-media-img' src={member.src} alt='' className='h-full w-full object-cover grayscale' style={{ borderStyle: 'none' }} />
    </div>
    <div data-wf-el='standard-wrap' className='w-fit'>
      <p data-wf-el='paragraph-lg' className='m-0 text-lg lg:text-[20.8px] font-medium leading-[24.96px] text-brand-fg'>
        {member.name}
      </p>
      <p data-wf-el='paragraph-sm' className='m-0 text-[14.4px] leading-[21.6px] text-[#5f5f5f]'>
        {member.title}
      </p>
    </div>
  </article>
);
