/**
 * Server-side candidate profile — synced with resume/Kushal_Grover_Resume.docx
 * and GoA SAP cover letter (resume/Kushal_Grover_GoA_SAP_CoverLetter.docx).
 */
export const MY_PROFILE = {
  name: "Kushal Grover",
  location: "Edmonton, AB",
  email: "grover.kushal@outlook.com",
  phone: "(587) 986-2003",
  linkedin: "ca.linkedin.com/in/kgrover404",
  address: "446 Allard Blvd, Edmonton, AB",

  targetRoles: [
    "IT Security Analyst",
    "Cybersecurity Analyst",
    "SOC Analyst",
    "SAP Junior Security Analyst",
    "SAP Security Analyst",
    "Identity and Access Management Analyst",
    "GRC Analyst",
    "Cloud Security Engineer",
    "Network Security Analyst",
    "Vulnerability Assessment Analyst",
    "Systems Administrator",
    "IT Specialist",
    "Microsoft 365 Administrator",
    "AI Automation Developer",
    "Full Stack Developer",
  ],

  targetLocations: ["Edmonton", "Calgary", "Alberta", "Remote", "Canada"],

  preferredEmployers: [
    "Government of Alberta",
    "Government of Canada",
    "Alberta Technology and Innovation",
    "1GX",
    "City of Edmonton",
    "City of Calgary",
    "Alberta Health Services",
    "NAIT",
    "University of Alberta",
    "ATB Financial",
    "Telus",
  ],

  summary: `Edmonton-based cybersecurity and IT professional with 3 years full-time MSP experience 
across 15+ client environments. Expertise in SIEM (Security Onion, ELK, Sentinel), vulnerability 
assessment, incident response, Fortinet FortiGate, Microsoft 365/Azure/Entra ID, Conditional Access, 
and access-management workflows parallel to SAP security (provisioning, RBAC, access reviews, audit). 
CompTIA Security+, ISC2 CC, Cisco CyberOps Associate (52-lab programme), Fortinet NSE 1-3, 
Microsoft SC-900, AZ-900, AZ-AI. NAIT Network Engineering Technology Diploma (2023). 
Founder of FlowGrid (flowgrid.ca) and WageChecker (wagechecker.ca) — production AI-powered platforms.`,

  skills: [
    "Security Onion",
    "ELK Stack",
    "Microsoft Sentinel",
    "Microsoft Defender for Cloud",
    "Conditional Access",
    "Identity Protection",
    "Azure Entra ID",
    "Microsoft 365 Admin",
    "access reviews",
    "user provisioning",
    "role-based access control",
    "Fortinet FortiGate",
    "Snort IDS",
    "OPNsense",
    "SIEM",
    "SOC operations",
    "Vulnerability assessment",
    "CVE/CWE analysis",
    "incident response",
    "Python",
    "PowerShell",
    "Kali Linux",
    "Nmap",
    "Burp Suite",
    "CIS Benchmarks",
    "GRC",
    "risk registers",
    "Next.js",
    "React",
    "AI workflow integration",
    "CompTIA Security+",
    "ISC2 CC",
    "Cisco CyberOps",
    "Fortinet NSE",
  ],

  experience: `
IT & Security Specialist — Hearthstone Consulting & Development Ltd. (June 2023 – Present)
- Continuous SIEM monitoring (Security Onion, ELK, Microsoft Defender) across 15+ MSP clients
- Fortinet FortiGate, IPS/IDS, VPN; vulnerability assessments with CVE/CWE risk ratings
- Microsoft 365, Entra ID, Conditional Access, Identity Protection, Secure Score
- Azure misconfiguration remediation (Defender for Cloud, CIS Benchmarks)
- Python/PowerShell automation — port scanning, log parsing, access reviews
- Client-facing risk communication and incident documentation with evidence trails

Student Lab Monitor — NAIT (Jan 2022 – Apr 2023)
- 30-station IT lab access control, patching, security coursework support
  `,

  education: `
Diploma — Network Engineering Technology, NAIT, Edmonton AB (2021–2023)
Coursework: Network Security, Ethical Hacking, Routing & Switching, Cloud Computing, Windows Server
Capstone: Hybrid on-prem/Azure deployment with IDS, firewall, security runbook
  `,

  certifications: [
    "CompTIA Security+ (SY0-701)",
    "ISC2 Certified in Cybersecurity (CC)",
    "Cisco CyberOps Associate (May 2025)",
    "Microsoft SC-900",
    "Microsoft AZ-900",
    "Microsoft AZ-AI",
    "Fortinet NSE 1, 2, 3",
  ],

  projects: `
FlowGrid (flowgrid.ca) — AI-powered SaaS for field-service operations with automated lead pipeline.
WageChecker (wagechecker.ca) — Public compliance tool with AI-structured analysis.
Network Security Home Lab — OPNsense, Snort IDS, ELK SIEM, Metasploitable/DVWA practice.
NAIT Capstone — Hybrid on-prem/Azure network for real client with IDS and security runbook.
Cisco CyberOps 52-Lab Programme — IDS, malware analysis, forensics, SOC metrics (May 2025).
  `,

  /** Roles with direct evidence in resume/cover letter — prioritize in search rotation */
  prioritySearchThemes: [
    "SAP security analyst Government of Alberta",
    "identity access management GRC Azure",
    "cybersecurity SOC analyst Edmonton",
    "vulnerability assessment analyst",
    "systems administrator Microsoft 365",
  ],
};
