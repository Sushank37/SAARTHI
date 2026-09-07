/**
 * SAARTHI — Centralized Role Configuration
 * Single source of truth for prototype user personas and permissions.
 */

export const ROLE_IDS = {
  MP: "MP",
  DISTRICT_AUTHORITY: "DISTRICT_AUTHORITY",
  IMPLEMENTING_AGENCY: "IMPLEMENTING_AGENCY",
  MOSPI: "MOSPI",
  CITIZEN: "CITIZEN",
};

export const ROLES = {
  [ROLE_IDS.MP]: {
    id: ROLE_IDS.MP,
    displayName: "Member of Parliament",
    shortName: "Hon'ble MP",
    path: "/mp",
    badge: "MP Portal",
    icon: "🎖️",
    badgeType: "primary",
    tagline: "Constituency Recommendations & Quota Management",
    description:
      "Hon'ble Member of Parliament access for recommending community infrastructure, monitoring ₹5.00 Cr annual entitlement earmarking, and inspecting constituency works.",
    scope: "Constituency-level works and local recommendation registers",
    scopeDescription:
      "Filtered to works recommended by or assigned to the Hon'ble MP's parliamentary constituency.",
    scopeKey: "MP_NAME",
  },
  [ROLE_IDS.DISTRICT_AUTHORITY]: {
    id: ROLE_IDS.DISTRICT_AUTHORITY,
    displayName: "District Authority (DA / Collector)",
    shortName: "District Authority",
    path: "/da",
    badge: "District Nodal",
    icon: "⚖️",
    badgeType: "warning",
    tagline: "District Administration & Sanction Oversight",
    description:
      "District Collector / District Magistrate (Nodal District Authority) portal for administrative scrutiny, pre-sanction feasibility clearance, duplicate blocking, and fund release.",
    scope: "District-level jurisdiction works under Nodal District Authority",
    scopeDescription:
      "Jurisdiction-scoped works managed by District Collectorates and Planning Committees.",
    scopeKey: "IDA_NAME",
  },
  [ROLE_IDS.IMPLEMENTING_AGENCY]: {
    id: ROLE_IDS.IMPLEMENTING_AGENCY,
    displayName: "Implementing Agency (IA / Vendor)",
    shortName: "Implementing Agency",
    path: "/ia",
    badge: "Executing Agency",
    icon: "👷",
    badgeType: "accent",
    tagline: "Execution Oversight & Milestone Reporting",
    description:
      "Implementing Agency (PWD, Rural Engineering, Zila Parishad) and contractor portal for milestone updates, Measurement Book (MB) verification, and geo-tagged photo evidence.",
    scope: "Assigned execution works, contractor milestones, and site evidence",
    scopeDescription:
      "Execution tracking for designated implementing bodies and civil infrastructure contractors.",
    scopeKey: "IDA_NAME",
  },
  [ROLE_IDS.MOSPI]: {
    id: ROLE_IDS.MOSPI,
    displayName: "MoSPI / Central Nodal Authority",
    shortName: "Central MoSPI",
    path: "/mospi",
    badge: "Central Nodal",
    icon: "🏛️",
    badgeType: "success",
    tagline: "National Macro Surveillance & Audit",
    description:
      "Ministry of Statistics & Programme Implementation (MoSPI) Central Nodal Agency oversight: pan-India surveillance, cross-state benchmarking, duplicate detection, and fund audit.",
    scope: "All-India macro surveillance across 36 States & UTs (102,703 works)",
    scopeDescription:
      "Unrestricted national visibility across all 36 States and Union Territories.",
    scopeKey: "STATE_NAME",
  },
  [ROLE_IDS.CITIZEN]: {
    id: ROLE_IDS.CITIZEN,
    displayName: "Citizen Transparency Portal",
    shortName: "Citizen View",
    path: "/citizen",
    badge: "Public Transparency",
    icon: "👥",
    badgeType: "info",
    tagline: "Public Transparency & Social Audit",
    description:
      "Open public transparency dashboard for citizens to view sanctioned development projects in their constituency, verify physical completion, and participate in social audit.",
    scope: "Publicly visible sanctioned projects and physical completion records",
    scopeDescription:
      "Open transparency register for community verification and physical asset tracking.",
    scopeKey: "PUBLIC",
  },
};

export const ROLE_LIST = Object.values(ROLES);

export function getRoleConfig(roleId) {
  if (!roleId) return null;
  const normalized = String(roleId).trim().toUpperCase();
  return ROLES[normalized] || null;
}

export function isValidRole(roleId) {
  if (!roleId) return false;
  const normalized = String(roleId).trim().toUpperCase();
  return Boolean(ROLES[normalized]);
}
