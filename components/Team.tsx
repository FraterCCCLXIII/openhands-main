import React from 'react';

const Team: React.FC = () => {
  return (
    <section>
      {/* Container */}
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-24 lg:py-32">
        {/* Heading Div */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-semibold md:text-5xl">
            All Hands AI Team
            {/* {' '} */}
            {/* <span className="bg-[url('https://assets.website-files.com/63904f663019b0d8edf8d57c/639156ce1c70c97aeb755c8a_Rectangle%2010%20(1).svg')] bg-cover bg-center px-4 text-white"></span> */}
          </h2>
          {/* <p className="mx-auto mb-8 mt-4 max-w-[528px] text-[#636262] md:mb-12 lg:mb-16">
            Lorem ipsum dolor sit amet elit ut aliquam
          </p> */}
        </div>
        {/* Team Div */}
        <div className="mx-auto grid max-w-[1040px] grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 sm:justify-items-stretch md:grid-cols-3 md:gap-4 lg:gap-6">

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-solid border-[#636262] p-4 [box-shadow:rgb(0,_0,_0)_6px_6px]">
            <img
              src="/team/robert.jpg"
              alt=""
              className="mb-4 inline-block w-full rounded-xl object-cover h-80 lg:h-80"
            />
            <p className="mb-2 font-bold">Robert Brennan</p>
            <p className="mb-2 text-sm text-[#636262]">Founder & CEO</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-solid border-[#636262] p-4 [box-shadow:rgb(0,_0,_0)_6px_6px]">
            <img
              src="/team/xingyao.jpg"
              alt=""
              className="mb-4 inline-block w-full rounded-xl object-cover h-80 lg:h-80"
            />
            <p className="mb-2 font-bold">Xingyao Wang</p>
            <p className="mb-2 text-sm text-[#636262]">Founder</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-solid border-[#636262] p-4 [box-shadow:rgb(0,_0,_0)_6px_6px]">
            <img
              src="/team/graham.jpg"
              alt=""
              className="mb-4 inline-block w-full rounded-xl object-cover h-80 lg:h-80"
            />
            <p className="mb-2 font-bold">Graham Neubig</p>
            <p className="mb-2 text-sm text-[#636262]">Founder</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Team;


{/* <div className="mt-4 flex flex-wrap">
<a
  href="#"
  className="mr-4 flex h-8 w-8 max-w-full flex-col items-center justify-center rounded-sm bg-[#ecf2ff] px-2 font-bold text-[#1353fe]"
>
  <img
    src="https://assets.website-files.com/63904f663019b0d8edf8d57c/63980be38447c887bfd955b8_InstagramLogo.svg"
    alt=""
    className="inline-block h-full w-full"
  />
</a>
<a
  href="#"
  className="mr-4 flex h-8 w-8 max-w-full flex-col items-center justify-center rounded-sm bg-[#ecf2ff] px-2 font-bold text-[#1353fe]"
>
  <img
    src="https://assets.website-files.com/63904f663019b0d8edf8d57c/63980be307547130d2e965fd_SlackLogo.svg"
    alt=""
    className="inline-block h-full w-full"
  />
</a>
<a
  href="#"
  className="flex h-8 w-8 max-w-full flex-col items-center justify-center rounded-sm bg-[#ecf2ff] px-2 font-bold text-[#1353fe]"
>
  <img
    src="https://assets.website-files.com/63904f663019b0d8edf8d57c/63980be16658297f6be979d2_TwitterLogo.svg"
    alt=""
    className="inline-block h-full w-full"
  />
</a>
</div> */}
