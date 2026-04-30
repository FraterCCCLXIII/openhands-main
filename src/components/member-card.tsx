interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => (
  <article className='space-y-4'>
    <div className='overflow-hidden rounded-[8px]'>
      <img src={member.src} alt='' className='aspect-square w-full object-cover grayscale' />
    </div>
    <div className='w-fit'>
      <p className='m-0 inline-block text-[20.8px] font-medium leading-[24.96px] text-brand-fg'>
        {member.name}
      </p>
      <p className='m-0 inline-block text-[14.4px] leading-[21.6px] text-[#5f5f5f]'>
        {member.title}
      </p>
    </div>
  </article>
);
