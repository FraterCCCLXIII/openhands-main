import { Form, Link } from "@remix-run/react";
import { SectionHeading } from "~/components/section-heading";

const Login = () => {
  return (
    <main className="flex flex-col items-center py-[45px]">
      <SectionHeading
        heading="Login"
        subheading="Welcome back!"
      />

      <Form className="flex flex-col gap-4 text-sm font-poppins w-[418px]">
        <label className="flex flex-col gap-1 text-[#374151] font-semibold">
          Email
          <input
            className="font-normal py-[9px] px-[13px] rounded-[6px] border border-[#D1D5DB]"
            type="text"
            placeholder="johnsmith@mail.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-[#374151] font-semibold">
          Password
          <input
            className="font-normal py-[9px] px-[13px] rounded-[6px] border border-[#D1D5DB]"
            type="password"
          />
        </label>

        <div>
          <span className="text-gray-500">Forgot your password?</span>
          {" "}
          <span className="text-[#0554F2] font-bold">Reset it here</span>
        </div>

        <button className="bg-black text-white text-lg font-bold rounded-[10px] py-[13px]">Login</button>
      </Form>

      <div className="paragraph mt-4">
        <span className="text-[#292A36]">Don&apos;t have an account?</span>
        {" "}
        <Link to="/signup" className="text-[#0554F2] font-bold">Sign up here</Link>
      </div>
    </main>
  );
};

export default Login;
