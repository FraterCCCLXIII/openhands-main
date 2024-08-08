import AllHandsLogoVariant1 from "~/components/svgs/logo-variants/all-hands-logo-1.svg?react";
import AllHandsLogoVariant2 from "~/components/svgs/logo-variants/all-hands-logo-2.svg?react";
import AllHandsLogoVariant3 from "~/components/svgs/logo-variants/all-hands-logo-3.svg?react";
import AllHandsLogoVariant4 from "~/components/svgs/logo-variants/all-hands-logo-4.svg?react";
import AllHandsLogoVariant5 from "~/components/svgs/logo-variants/all-hands-logo-5.svg?react";
import AllHandsLogoVariant6 from "~/components/svgs/logo-variants/all-hands-logo-6.svg?react";

const LOGO_VARIANTS = [
  AllHandsLogoVariant1,
  AllHandsLogoVariant2,
  AllHandsLogoVariant3,
  AllHandsLogoVariant4,
  AllHandsLogoVariant5,
  AllHandsLogoVariant6,
];

export const getRandomLogo = () => LOGO_VARIANTS[Math.floor(Math.random() * LOGO_VARIANTS.length)];
