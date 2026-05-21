export interface JobSource {
  id: string;
  name: string;
  query: string;
  location: string;
  priority: "high" | "medium" | "low";
}

/** JSearch queries — same labels as the original RSS source dropdown */
export const JOB_SOURCES: JobSource[] = [
  {
    id: "goa",
    name: "Government of Alberta",
    query: "information technology Government of Alberta",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
  },
  {
    id: "goc",
    name: "Government of Canada",
    query: "information technology Government of Canada",
    location: "Canada",
    priority: "high",
  },
  {
    id: "indeed_it_edmonton",
    name: "Indeed — IT Edmonton",
    query: "IT cybersecurity helpdesk network",
    location: "Edmonton, Alberta, Canada",
    priority: "high",
  },
  {
    id: "indeed_remote_canada",
    name: "Indeed — Remote Canada IT",
    query: "IT cybersecurity remote",
    location: "Canada",
    priority: "medium",
  },
];

export const JSEARCH_HOST = "jsearch.p.rapidapi.com";
export const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search";
