interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => (
  <article className='flex flex-col gap-4 px-5'>
    <div
      data-testid='member-card-media'
      className='h-[190px] w-[190px] overflow-hidden rounded-[8px]'
    >
      <img src={member.src} alt='' className='h-full w-full object-cover grayscale' />
    </div>
    <div className='w-fit'>
      <p className='m-0 text-lg lg:text-[20.8px] font-medium leading-[24.96px] text-brand-fg'>
        {member.name}
      </p>
      <p className='m-0 text-[14.4px] leading-[21.6px] text-[#5f5f5f]'>
        {member.title}
      </p>
    </div>
  </article>
);
