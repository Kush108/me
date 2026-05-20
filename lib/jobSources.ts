export interface JobFeed {
  id: string;
  name: string;
  url: string;
  type: "rss";
  priority: "high" | "medium" | "low";
}

export const JOB_FEEDS: JobFeed[] = [
  {
    id: "goc",
    name: "Government of Canada",
    url: "https://emploisfp-psjobs.cfp-psc.gc.ca/psrs-srfp/applicant/page1800?fswLanguageSkill=E&fswJobType=1&fswEmploymentTenure=1%2C2%2C3&fswJobCategory=IT&fswlocationCode=1534%2C1535&type=1&psrsMode=1&menu=1&toggle=1&overrideErrorStartPage=&subaction=rss",
    type: "rss",
    priority: "high",
  },
  {
    id: "indeed_it_edmonton",
    name: "Indeed — IT Edmonton",
    url: "https://ca.indeed.com/rss?q=IT+security+cybersecurity&l=Edmonton%2C+AB&sort=date&radius=50",
    type: "rss",
    priority: "high",
  },
  {
    id: "indeed_it_calgary",
    name: "Indeed — IT Calgary",
    url: "https://ca.indeed.com/rss?q=cybersecurity+network+security&l=Calgary%2C+AB&sort=date&radius=50",
    type: "rss",
    priority: "medium",
  },
  {
    id: "indeed_remote_canada",
    name: "Indeed — Remote Canada IT",
    url: "https://ca.indeed.com/rss?q=cybersecurity+analyst+remote&l=Canada&sort=date",
    type: "rss",
    priority: "medium",
  },
  {
    id: "goa",
    name: "Government of Alberta",
    url: "https://www.alberta.ca/careers-rss.aspx",
    type: "rss",
    priority: "high",
  },
];

export const MATCH_KEYWORDS = {
  high: [
    "cybersecurity",
    "security analyst",
    "information security",
    "SOC",
    "SIEM",
    "network security",
    "incident response",
    "vulnerability",
    "penetration",
    "CompTIA",
    "Azure",
    "Entra",
    "Fortinet",
    "Python",
    "PowerShell",
    "Government of Alberta",
    "Government of Canada",
    "Edmonton",
    "Calgary",
  ],
  medium: [
    "IT specialist",
    "systems administrator",
    "network administrator",
    "cloud security",
    "Microsoft 365",
    "firewall",
    "IDS",
    "IPS",
    "automation",
    "scripting",
    "full stack",
    "developer",
  ],
  low: ["IT support", "helpdesk", "desktop support", "junior"],
};
