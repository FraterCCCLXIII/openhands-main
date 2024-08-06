interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => (
  <div className="flex flex-col gap-8 px-[42px] py-[45px]">
    <img src={member.src} alt={member.name} className="w-full aspect-square rounded-[10px] bg-[#FFD93A]" />
    <div className="flex flex-col gap-4">
      <h2 className="font-quincy text-[33px] leading-[33px] font-normal">{member.name}</h2>
      <h3 className="font-poppins font-semibold text-lg leading-[25px] text-[#292A36]">{member.title}</h3>
      <p className="paragraph text-[#292A36]">{member.description}</p>
    </div>
  </div>
);
