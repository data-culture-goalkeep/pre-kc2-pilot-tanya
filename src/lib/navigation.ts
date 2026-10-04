export const NAVIGATION = [
  {
    href: "/beneficiaries",
    label: "Beneficiaries",
    description: "View registered beneficiaries and manage their details.",
  },
  {
    href: "/attendance",
    label: "Daycare Attendance",
    description: "Explore monthly attendance and daily records.",
  },
  {
    href: "/hospital",
    label: "Hospital Sessions",
    description: "Review sessions for children in the hospital program.",
  },
  {
    href: "/assessments",
    label: "Assessments",
    description: "Explore Rosenberg and Stirling response distributions.",
  },
] as const;

export type NavigationItem = (typeof NAVIGATION)[number];
