import { MY_PROFILE } from "@/lib/profile";

export interface JobSource {
  id: string;
  name: string;
  query: string;
  location: string;
  priority: "high" | "medium" | "low";
  group: "gov" | "security" | "sysadmin" | "dev" | "remote" | "iam";
}

export const CORE_JOB_SOURCES: JobSource[] = [
  {
    id: "goa",
    name: "Government of Alberta",
    query: "information technology cybersecurity SAP security Government of Alberta",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
    group: "gov",
  },
  {
    id: "goc",
    name: "Government of Canada",
    query: "information technology security identity Government of Canada",
    location: "Canada",
    priority: "high",
    group: "gov",
  },
  {
    id: "indeed_it_edmonton",
    name: "Indeed — IT Edmonton",
    query: "cybersecurity SOC analyst systems administrator Edmonton",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
    group: "security",
  },
  {
    id: "indeed_remote_canada",
    name: "Indeed — Remote Canada IT",
    query: "cybersecurity remote SIEM vulnerability",
    location: "Canada",
    priority: "medium",
    group: "remote",
  },
];

export const ROTATING_JOB_SOURCES: JobSource[] = [
  {
    id: "role_sap_goa",
    name: "SAP / IAM — GoA style",
    query: "SAP security analyst access management GRC",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
    group: "iam",
  },
  {
    id: "role_security_analyst",
    name: "Security Analyst — Edmonton",
    query: "security analyst SOC SIEM incident response",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
    group: "security",
  },
  {
    id: "role_vuln_analyst",
    name: "Vulnerability Analyst",
    query: "vulnerability assessment analyst CVE",
    location: "Alberta, Canada",
    priority: "medium",
    group: "security",
  },
  {
    id: "role_sysadmin",
    name: "Systems Administrator — Alberta",
    query: "systems administrator Microsoft 365 Entra Azure",
    location: "Alberta, Canada",
    priority: "medium",
    group: "sysadmin",
  },
  {
    id: "role_cloud_security",
    name: "Cloud Security — Canada",
    query: "cloud security engineer Defender CIS",
    location: "Canada",
    priority: "medium",
    group: "security",
  },
  {
    id: "role_network_engineer",
    name: "Network Engineer — Edmonton",
    query: "network engineer security Fortinet",
    location: "Edmonton, Alberta, Canada",
    priority: "medium",
    group: "security",
  },
  {
    id: "role_dev_automation",
    name: "Developer / Automation",
    query: "Python automation developer AI integration",
    location: "Edmonton, Alberta, Canada",
    priority: "low",
    group: "dev",
  },
  {
    id: "employer_ahs",
    name: "Alberta Health Services IT",
    query: "information technology cybersecurity Alberta Health Services",
    location: "Alberta, Canada",
    priority: "medium",
    group: "gov",
  },
  {
    id: "employer_city_edmonton",
    name: "City of Edmonton IT",
    query: "information technology security City of Edmonton",
    location: "Edmonton, Alberta, Canada",
    priority: "medium",
    group: "gov",
  },
  {
    id: "employer_uofa",
    name: "University of Alberta IT",
    query: "information technology University of Alberta",
    location: "Edmonton, Alberta, Canada",
    priority: "low",
    group: "gov",
  },
  {
    id: "employer_atb",
    name: "ATB Financial IT",
    query: "cybersecurity information technology ATB Financial",
    location: "Alberta, Canada",
    priority: "low",
    group: "security",
  },
];

export const JOB_SOURCES: JobSource[] = [
  ...CORE_JOB_SOURCES,
  ...ROTATING_JOB_SOURCES,
];

export const ALL_SOURCE_IDS = JOB_SOURCES.map((s) => s.id);

export const JSEARCH_HOST = "jsearch.p.rapidapi.com";
export const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search";

const ROTATING_BATCH_SIZE = 3;

export function getActiveJobSources(refreshGeneration: number): JobSource[] {
  const start =
    (refreshGeneration * ROTATING_BATCH_SIZE) % ROTATING_JOB_SOURCES.length;
  const rotating: JobSource[] = [];
  for (let i = 0; i < ROTATING_BATCH_SIZE; i++) {
    rotating.push(
      ROTATING_JOB_SOURCES[(start + i) % ROTATING_JOB_SOURCES.length]
    );
  }
  return [...CORE_JOB_SOURCES, ...rotating];
}

export function getProfileSearchHints(): string[] {
  return [
    ...MY_PROFILE.prioritySearchThemes,
    ...MY_PROFILE.targetRoles.slice(0, 6),
    ...MY_PROFILE.preferredEmployers.slice(0, 4),
  ];
}
