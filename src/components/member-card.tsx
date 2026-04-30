interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => (
  <div className='flex w-full items-center gap-4 px-5 sm:w-1/2 lg:w-1/4'>
    <img src={member.src} alt='' className='h-[190px] w-[190px] shrink-0 object-cover' />
    <div className='space-y-1'>
      <p className='m-0 text-[20.8px] font-medium leading-[24.96px] text-brand-fg'>
        {member.name}
      </p>
      <p className='m-0 text-[14.4px] leading-[21.6px] text-[#5f5f5f]'>
        {member.title}
      </p>
    </div>
  </div>
);
