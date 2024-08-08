import { MetaFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { FormInput } from "~/components/form-input";
import { SectionHeading } from "~/components/section-heading";

export const meta: MetaFunction = () => ([
  { title: "All Hands - Login" },
  { name: "description", content: "Login to your All Hands account." },
]);

const Login = () => {
  return (
    <main className="flex flex-col items-center py-[45px]">
      <SectionHeading
        heading="Login"
        subheading="Welcome back!"
      />

      <Form className="flex flex-col gap-4 text-sm w-[418px]">
        <label
          htmlFor="email"
          className="flex flex-col gap-1 text-gray-700 font-semibold"
        >
          Email
          <FormInput
            id="email"
            type="email"
            placeholder="johnsmith@mail.com"
          />
        </label>

        <label
          htmlFor="password"
          className="flex flex-col gap-1 text-gray-700 font-semibold"
        >
          Password
          <FormInput
            id="password"
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
        <span className="text-description">Don&apos;t have an account?</span>
        {" "}
        <Link to="/signup" className="text-[#0554F2] font-bold">Sign up here</Link>
      </div>
    </main>
  );
};

export default Login;
