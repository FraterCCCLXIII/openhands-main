const MostPopularBadge = () => (
  <span
    className="bg-[#B6762E] w-[121px] h-[27px] flex items-center justify-center font-extrabold text-white text-[10px] leading-[15px] rounded-full tracking-[0.83px]"
  >
    MOST POPULAR
  </span>
);

export const MostPopularHighlight = () => (
  <div className="absolute -bottom-[20px] left-1/2 transform -translate-x-1/2 w-[295px] h-[465px] rounded-[10px] bg-party flex justify-end px-[30px] py-[20px]">
    <MostPopularBadge />
  </div>
);
