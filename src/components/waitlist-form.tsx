import React from "react";
import { RegularButton } from "./regular-button";
import { Form } from "react-router-dom";

interface WaitlistFormProps {
  error?: string;
  success?: string;
  disabled?: boolean;
}

export const WaitlistForm: React.FC<WaitlistFormProps> = ({ error, success, disabled }) => (
  <div>
    {!success && (
      <Form
        data-testid="Waitlist-form"
        className="flex gap-2 w-full flex-col items-start justify-center"
        method="post"
      >
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          pattern="[^@]+@[^.]+\..+"
          className="bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]"
        />
        <input
          type="text"
          name="user"
          placeholder="GitHub Username"
          required
          className="bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]"
        />
        <input
          type="text"
          name="org"
          placeholder="Company/Organization"
          required
          className="bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]"
        />
        <input
          type="text"
          name="first"
          placeholder="First Name"
          required
          className="bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]"
        />
        <input
          type="text"
          name="last"
          placeholder="Last Name"
          required
          className="bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]"
        />
        <RegularButton
          type="submit"
          disabled={disabled}
          className="w-full"
        >
          Subscribe
        </RegularButton>
      </Form>
    )}

    {success && (
      <div className="flex flex-col items-center gap-4">
        <p className="description text-green-600">{success || "Success!"}</p>
        <p className="paragraph text-description lg:w-[466px] text-center">
          We'll let you know you as soon as it's ready! In the meantime, you can
          {" "}
          <a
            href="https://github.com/All-Hands-AI/OpenHands"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline underline-offset-2"
          >
            download OpenHands on GitHub
          </a>
          {" "}
          to try it locally.
        </p>
      </div>
    )}
    {error && <p className="description mb-4 text-red-600">{error}</p>}
  </div>
);
