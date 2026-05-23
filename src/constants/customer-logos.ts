export interface CustomerLogo {
  name: string;
  src: string;
  alt: string;
}

export const CUSTOMER_LOGOS = [
  { name: 'Flextract', src: '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png', alt: '' },
  { name: 'TikTok', src: '/assets/webflow/logos/69137f6974b71a1a4a932f82_TikTok_logo.svg', alt: '' },
  { name: 'VMware', src: '/assets/webflow/logos/69137f523b08f91a5aa905b9_Vmware.svg', alt: '' },
  { name: 'Roche', src: '/assets/webflow/logos/69137f2cb537758796a9dba1_Roche_Logo.svg', alt: '' },
  { name: 'Amazon', src: '/assets/webflow/logos/69137f10c3975e28b3932320_Amazon_logo1.svg', alt: '' },
  { name: 'Cloudera', src: '/assets/webflow/misc/69137efe8466ac374a9bc8a1_idlJcLIGV__17611861580951.svg', alt: '' },
  { name: 'Fujitsu', src: '/assets/webflow/misc/69137eedd7c29cc9046de43f_Group.svg', alt: '' },
  { name: 'C3.ai', src: '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg', alt: '' },
  { name: 'Netflix', src: '/assets/webflow/logos/69137eac8f27ca27f5e48420_Netflix_2015_logo1.svg', alt: '' },
  { name: 'Mastercard', src: '/assets/webflow/misc/69137e8df2c028b9e1506ede_mastercard1.svg', alt: '' },
  { name: 'Red Hat', src: '/assets/webflow/logos/69137e783790933dd06f9d59_Red_Hat_Logo_20191.svg', alt: '' },
  { name: 'MongoDB', src: '/assets/webflow/logos/69137e5fa006d963a1d1904d_mongodb-ar211.svg', alt: '' },
  { name: 'Apple', src: '/assets/webflow/logos/69137e47b45195da10c50f49_apple-111.svg', alt: '' },
  { name: 'Nvidia', src: '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg', alt: '' },
  { name: 'Google', src: '/assets/webflow/logos/69137e199ce2cb594b0210ab_google-ar211.svg', alt: '' },
  { name: 'AMD', src: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg', alt: '' },
] as const satisfies readonly CustomerLogo[];

export const HOME_CUSTOMER_LOGOS = CUSTOMER_LOGOS.filter((logo) => logo.name !== 'Flextract');
export const CONTACT_CUSTOMER_LOGOS = CUSTOMER_LOGOS;
