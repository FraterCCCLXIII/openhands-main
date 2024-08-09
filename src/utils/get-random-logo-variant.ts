import AllHandsLogo2 from "~/svgs/brand/all-hands-logo-2.svg?react";
import AllHandsLogo3 from "~/svgs/brand/all-hands-logo-3.svg?react";
import AllHandsLogo4 from "~/svgs/brand/all-hands-logo-4.svg?react";
import AllHandsLogo5 from "~/svgs/brand/all-hands-logo-5.svg?react";
import AllHandsLogo6 from "~/svgs/brand/all-hands-logo-6.svg?react";

const LOGO_VARIANTS = [
  AllHandsLogo2,
  AllHandsLogo3,
  AllHandsLogo4,
  AllHandsLogo5,
  AllHandsLogo6,
];

export const getRandomLogo = () => LOGO_VARIANTS[Math.floor(Math.random() * LOGO_VARIANTS.length)];
