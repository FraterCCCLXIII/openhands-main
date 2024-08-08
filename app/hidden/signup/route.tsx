import { MetaFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { FormInput } from "~/components/form-input";
import { SectionHeading } from "~/components/section-heading";

export const meta: MetaFunction = () => ([
  { title: "All Hands - Signup" },
  { name: "description", content: "Create an account on All Hands." },
]);

const Signup = () => {
  return (
    <main className="flex flex-col items-center py-[45px]">
      <SectionHeading
        heading="Create your Account"
        subheading="Let&apos;s get started!"
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

        <label
          htmlFor="retype-password"
          className="flex flex-col gap-1 text-gray-700 font-semibold"
        >
          Retype Password
          <FormInput
            id="retype-password"
            type="password"
          />
        </label>

        <label className="flex gap-[12px] items-start">
          <input
            className="w-4 h-4 rounded border border-[#D1D5DB] mt-0.5"
            type="checkbox"
          />
          <div className="leading-">
            <span className="text-gray-500">By creating an account you agree to our</span>
            {" "}
            <Link to="/tos" target="_blank" className="text-[#0554F2] font-bold">terms of services</Link>
            .
          </div>
        </label>


        <button className="bg-black text-white text-lg font-bold rounded-[10px] py-[13px]">Create Account</button>
      </Form>

      <div className="paragraph mt-4">
        <span className="text-description">Already have an account?</span>
        {" "}
        <Link to="/login" className="text-[#0554F2] font-bold">Click here to login</Link>
      </div>
    </main>
  );
};

export default Signup;
