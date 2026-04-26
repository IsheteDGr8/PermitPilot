export type AgentStatus = "approved" | "conflict" | "needs-info" | "reasoning";

export type Citation = {
  id: string;
  code: string; // e.g. "§7.32.040(b)(2)"
  title: string;
  text: string;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  iconKey: "map" | "hammer" | "heart" | "flame" | "badge" | "network";
  status: AgentStatus;
  reads: string;
  summary: string;
  reasoning: string; // markdown-ish; we'll inline-render citations by [§...]
  citationIds: string[];
};

export type ResolutionOption = {
  id: string;
  title: string;
  detail: string;
  tradeoff: string;
};

export type Conflict = {
  id: string;
  title: string;
  agents: [string, string];
  description: string;
  options: ResolutionOption[];
};

export type ChecklistItem = {
  id: string;
  phase: "Pre-application" | "Documentation" | "Inspections" | "Submission";
  title: string;
  agency: string;
  estTime: string;
  fee: string;
  dependsOn?: string[];
};

export type FormField = {
  label: string;
  value: string;
  citationId?: string;
};

export type PrefilledForm = {
  id: string;
  name: string;
  agency: string;
  fields: FormField[];
};

export const citations: Record<string, Citation> = {
  c1: {
    id: "c1",
    code: "§7.32.040(b)(2)",
    title: "Mobile Food Vendor — Permitted Zoning Districts",
    text: "Mobile food vending operations are permitted in C-1 (Neighborhood Commercial), C-2 (Downtown Commercial), and M-1 (Light Industrial) districts subject to a valid Mobile Food Vendor Permit and the operational standards of §7.32.060.",
  },
  c2: {
    id: "c2",
    code: "§7.32.060(d)",
    title: "Operational Standards — Setback from Brick-and-Mortar Restaurants",
    text: "No mobile food unit shall operate within 150 linear feet of the primary entrance of a licensed brick-and-mortar food service establishment during that establishment's posted hours of operation, unless written consent is filed with the Director.",
  },
  c3: {
    id: "c3",
    code: "§15.04.110(a)",
    title: "Building Code — Generator Enclosure Requirements",
    text: "Mobile units operating an internal combustion generator above 5kW shall provide a Class B vented enclosure with a minimum 18-inch clearance to combustible surfaces and shall comply with NFPA 37 §4.1.4.",
  },
  c4: {
    id: "c4",
    code: "§8.20.030",
    title: "Health Code — Commissary Requirement",
    text: "All mobile food units shall operate from an approved commissary inspected within the prior 12 months. Daily reporting to the commissary shall be documented in the Mobile Unit Log (Form HD-214).",
  },
  c5: {
    id: "c5",
    code: "§8.20.085(c)",
    title: "Health Code — Three-Compartment Sink and Handwash Station",
    text: "Mobile food units preparing non-prepackaged food shall be equipped with a three-compartment warewashing sink and a separate handwash sink with potable water supply of not less than 30 gallons.",
  },
  c6: {
    id: "c6",
    code: "§9.14.220",
    title: "Fire Code — LP-Gas Container Clearances on Mobile Units",
    text: "Liquefied petroleum gas containers mounted on mobile food units shall maintain a minimum clearance of 10 feet from any building opening, mechanical air intake, or ignition source. (Adopted from IFC §6104.3.)",
  },
  c7: {
    id: "c7",
    code: "§9.14.225",
    title: "Fire Code — LP-Gas Container Clearances, Variance",
    text: "The Fire Marshal may grant a written variance reducing the clearance under §9.14.220 to no less than 7 feet upon installation of a UL-listed gas leak detection system and an automatic shutoff valve.",
  },
  c8: {
    id: "c8",
    code: "§7.32.040(c)",
    title: "Operating Hours in Mixed-Use Districts",
    text: "In MU-2 districts adjacent to residential zones, mobile food vending is restricted to 7:00 AM through 9:00 PM unless a Late-Operations Endorsement is obtained.",
  },
  c9: {
    id: "c9",
    code: "§5.08.010",
    title: "Business License — Required Filings",
    text: "Every person engaged in business within the City shall first obtain a Business License under Title 5. Mobile food vendors shall additionally file Form BL-MF-1 attesting to vehicle registration and insurance.",
  },
  c10: {
    id: "c10",
    code: "§5.08.090(a)",
    title: "Workers' Compensation Attestation",
    text: "Applicants employing one or more persons shall provide proof of active workers' compensation coverage as a condition of license issuance.",
  },
  c11: {
    id: "c11",
    code: "§9.14.310",
    title: "Annual Fire Safety Affidavit",
    text: "Operators shall file an annual Fire Safety Affidavit (Form FD-77) certifying that on-board suppression systems have been serviced within the prior 12 months by a Type-K certified contractor.",
  },
  c12: {
    id: "c12",
    code: "§8.20.140",
    title: "Plan Review — Menu and Process Flow",
    text: "Plan review submissions shall include a written menu, a process flow diagram for each potentially hazardous food, and a Hazard Analysis worksheet using FDA Form 3-201.",
  },
  c13: {
    id: "c13",
    code: "§7.32.080",
    title: "Designated Vending Locations — Downtown Overlay",
    text: "Within the Downtown Overlay, mobile food units shall vend only from designated locations identified on the City's Vendor Location Map (Schedule A). Lottery assignments are issued quarterly.",
  },
};

export const agents: Agent[] = [
  {
    id: "zoning",
    name: "Zoning",
    role: "Land use & district compatibility",
    iconKey: "map",
    status: "conflict",
    reads: "Municipal Code Title 7 — Zoning & Land Use",
    summary:
      "Downtown C-2 and the requested midday window are compatible. Preferred site at 4th & Alder is inside the Downtown Overlay, which restricts vendors to designated locations.",
    reasoning:
      "Mobile food vending is a permitted use in C-2 districts under [c1]. The requested operating window (11:00–14:30) sits comfortably inside the allowed envelope of [c8]. However, the applicant's preferred curbside location at 4th & Alder falls inside the Downtown Overlay, where vending is restricted to designated lottery sites under [c13]. Two of the three nearest designated sites are available this quarter — but neither offers the 10-foot propane clearance the Fire Agent is asking for, which is the source of the disagreement currently flagged.",
    citationIds: ["c1", "c8", "c13"],
  },
  {
    id: "building",
    name: "Building",
    role: "Structural & generator code",
    iconKey: "hammer",
    status: "approved",
    reads: "Building Code Title 15 + adopted NFPA 37",
    summary:
      "Truck does not run an internal generator (shoreline power at commissary). No structural review required.",
    reasoning:
      "The applicant has indicated power is drawn from a 30A shoreline at the commissary and from a battery bank on-site. Since no internal combustion generator above 5kW is operated, the enclosure requirements of [c3] do not apply. No further building review is triggered.",
    citationIds: ["c3"],
  },
  {
    id: "health",
    name: "Health",
    role: "Food safety & sanitation",
    iconKey: "heart",
    status: "needs-info",
    reads: "Health Code Title 8 + FDA Food Code 2022",
    summary:
      "Commissary on file. Plan review needs the menu and a process flow for the al pastor (cooked, held, reheated).",
    reasoning:
      "Riverbend Commissary Co. on E 9th appears in our database with an inspection dated 4 months ago — current under [c4]. The unit is equipped with a three-compartment sink and a 32-gallon handwash supply, which satisfies [c5]. To complete plan review the Health Agent needs a written menu and a process flow diagram for the al pastor, which is a multi-step potentially-hazardous food (see [c12]). The applicant has uploaded the menu; the process flow is the only outstanding item.",
    citationIds: ["c4", "c5", "c12"],
  },
  {
    id: "fire",
    name: "Fire",
    role: "LP-gas, suppression, life safety",
    iconKey: "flame",
    status: "conflict",
    reads: "Fire Code Title 9 (adopted IFC 2021)",
    summary:
      "Truck carries two 40-lb LP cylinders. Standard rule requires 10 ft clearance from openings; preferred site offers 7 ft.",
    reasoning:
      "The unit operates two 40-lb propane cylinders feeding a flat-top and a vertical trompo. Under [c6], LP-gas containers on mobile units must maintain a 10-foot clearance from building openings, mechanical air intakes, and ignition sources. The preferred designated vending site at 4th & Alder measures 7 feet to the awning vent of the adjacent café. The Fire Agent will issue a variance under [c7] if the applicant installs a UL-listed gas leak detection system with automatic shutoff. Annual affidavit under [c11] will also be required at issuance.",
    citationIds: ["c6", "c7", "c11"],
  },
  {
    id: "licensing",
    name: "Business Licensing",
    role: "Filings, insurance, workers' comp",
    iconKey: "badge",
    status: "approved",
    reads: "Business Code Title 5",
    summary:
      "Sole proprietor with two part-time employees. Form BL-MF-1 prefilled. Workers' comp on file.",
    reasoning:
      "Applicant qualifies for a standard Mobile Food business license under [c9]. Form BL-MF-1 has been pre-populated with vehicle VIN, registration, and a $1M general liability certificate naming the City as additional insured. Two part-time employees triggers [c10]; the workers' comp policy from Cascade Mutual (effective 2025-08-01) satisfies the attestation. Ready to issue on submission.",
    citationIds: ["c9", "c10"],
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Sequencing & conflict resolution",
    iconKey: "network",
    status: "reasoning",
    reads: "All five agency outputs + dependency graph",
    summary:
      "One genuine conflict to resolve (Fire ↔ Zoning on clearance). Three resolution paths surfaced. Otherwise on track for 12-day issuance.",
    reasoning:
      "Cross-referencing all agency positions: four of five agents are clear or close to clear. The single open question is the propane-clearance disagreement at 4th & Alder. I've surfaced three resolution paths weighted by time-to-issuance and cost. If the applicant accepts the variance route under [c7], the critical path collapses to 12 calendar days. The dependency graph is built and the unified checklist is ordered.",
    citationIds: ["c7"],
  },
];

export const conflict: Conflict = {
  id: "k1",
  title: "Propane clearance at preferred vending site",
  agents: ["fire", "zoning"],
  description:
    "The Fire Agent reads §9.14.220 to require 10 feet of clearance from LP-gas cylinders to the nearest building opening. The Zoning Agent's preferred designated site at 4th & Alder measures 7 feet to the adjacent café's awning vent. Both readings are correct under their respective titles. Three reconciliation paths are available.",
  options: [
    {
      id: "o1",
      title: "Install gas-leak detection + auto-shutoff (variance route)",
      detail:
        "Fire Marshal grants a written variance under §9.14.225 reducing clearance to 7 ft, contingent on a UL-listed leak detection system with automatic shutoff valve. ~$1,400 equipment + 2-day install. Adds 3 days to the timeline.",
      tradeoff: "Fastest path. Modest equipment cost. Recommended.",
    },
    {
      id: "o2",
      title: "Switch to alternate designated site (Vine & 6th)",
      detail:
        "Vine & 6th is also in the Downtown Overlay lottery and offers 14 ft clearance — comfortably above the 10-ft minimum. Foot traffic is ~30% lower per the 2024 city pedestrian count.",
      tradeoff: "No equipment cost, no variance. Lower expected revenue.",
    },
    {
      id: "o3",
      title: "Reorient cylinders to opposite side of unit",
      detail:
        "Reposition the LP cylinder bank to the curb side. Re-measurement to the nearest opening becomes 11.5 ft, satisfying §9.14.220 outright. Requires a re-plumb and Fire re-inspection.",
      tradeoff: "No variance needed but adds ~$900 plumbing and 5 days for re-inspection.",
    },
  ],
};

export const checklist: ChecklistItem[] = [
  { id: "t1", phase: "Pre-application", title: "Confirm commissary contract on file", agency: "Health", estTime: "Done", fee: "—" },
  { id: "t2", phase: "Pre-application", title: "Lottery: claim designated vending location", agency: "Zoning", estTime: "1 day", fee: "$45" },
  { id: "t3", phase: "Pre-application", title: "Choose conflict resolution path", agency: "Orchestrator", estTime: "Today", fee: "—" },
  { id: "t4", phase: "Documentation", title: "Upload process flow for al pastor", agency: "Health", estTime: "30 min", fee: "—", dependsOn: ["t1"] },
  { id: "t5", phase: "Documentation", title: "Sign Form BL-MF-1 (Business License)", agency: "Licensing", estTime: "10 min", fee: "$185" },
  { id: "t6", phase: "Documentation", title: "Sign Mobile Food Vendor Permit application", agency: "Zoning", estTime: "10 min", fee: "$320" },
  { id: "t7", phase: "Documentation", title: "Sign Fire Safety Affidavit (Form FD-77)", agency: "Fire", estTime: "10 min", fee: "—" },
  { id: "t8", phase: "Documentation", title: "Sign Health Plan Review submission", agency: "Health", estTime: "10 min", fee: "$140", dependsOn: ["t4"] },
  { id: "t9", phase: "Inspections", title: "Schedule LP-gas + suppression inspection", agency: "Fire", estTime: "3–5 days", fee: "$95", dependsOn: ["t3"] },
  { id: "t10", phase: "Inspections", title: "Health pre-opening inspection at commissary", agency: "Health", estTime: "2 days", fee: "$110", dependsOn: ["t8"] },
  { id: "t11", phase: "Inspections", title: "Vehicle equipment verification (VIN + insurance)", agency: "Licensing", estTime: "Same-day", fee: "—", dependsOn: ["t5"] },
  { id: "t12", phase: "Submission", title: "Bundle and submit packet to Permit Center", agency: "Orchestrator", estTime: "Auto", fee: "—", dependsOn: ["t6", "t7", "t9", "t10", "t11"] },
  { id: "t13", phase: "Submission", title: "Pay consolidated fees", agency: "Finance", estTime: "5 min", fee: "$895 total", dependsOn: ["t12"] },
  { id: "t14", phase: "Submission", title: "Receive issued permits + decals", agency: "Permit Center", estTime: "2 days", fee: "—", dependsOn: ["t13"] },
];

export const forms: PrefilledForm[] = [
  {
    id: "f1",
    name: "Mobile Food Vendor Permit",
    agency: "Zoning / Permit Center",
    fields: [
      { label: "Legal business name", value: "Maria's Tacos LLC" },
      { label: "DBA", value: "Maria's Tacos" },
      { label: "Operating district", value: "C-2 Downtown (Overlay)", citationId: "c1" },
      { label: "Designated vending location", value: "4th & Alder — Site A-12", citationId: "c13" },
      { label: "Operating hours", value: "11:00 AM – 2:30 PM, Tue–Sat", citationId: "c8" },
      { label: "Vehicle VIN", value: "1FTBR1Y89PKA32117" },
      { label: "Commissary on file", value: "Riverbend Commissary Co., 412 E 9th St", citationId: "c4" },
    ],
  },
  {
    id: "f2",
    name: "Business License — Form BL-MF-1",
    agency: "Business Licensing",
    fields: [
      { label: "Owner name", value: "Maria Elena Vargas" },
      { label: "Entity type", value: "LLC, sole member" },
      { label: "FEIN", value: "•••-••-4419" },
      { label: "Employees", value: "2 part-time", citationId: "c10" },
      { label: "Workers' comp carrier", value: "Cascade Mutual, policy #CM-228841", citationId: "c10" },
      { label: "General liability", value: "$1,000,000 — City named additional insured", citationId: "c9" },
    ],
  },
  {
    id: "f3",
    name: "Fire Safety Affidavit — Form FD-77",
    agency: "Fire",
    fields: [
      { label: "LP-gas cylinder count", value: "2 × 40 lb" },
      { label: "Clearance to nearest opening at site", value: "7 ft (variance pending)", citationId: "c6" },
      { label: "Leak detection system", value: "To be installed (Sentinel LP-2, UL-listed)", citationId: "c7" },
      { label: "Suppression system", value: "Ansul R-102, last serviced 2025-09-14", citationId: "c11" },
      { label: "Suppression contractor", value: "PNW Fire Systems, Type-K certified" },
    ],
  },
  {
    id: "f4",
    name: "Health Plan Review",
    agency: "Health",
    fields: [
      { label: "Menu submitted", value: "Yes — 12 items, uploaded 2025-04-22", citationId: "c12" },
      { label: "Three-compartment sink", value: "Confirmed, stainless 16×20", citationId: "c5" },
      { label: "Handwash supply", value: "32 gallons potable", citationId: "c5" },
      { label: "Process flow — al pastor", value: "Pending applicant upload", citationId: "c12" },
      { label: "Commissary inspection date", value: "2024-12-18 (within 12 mo.)", citationId: "c4" },
    ],
  },
];

export const applicant = {
  business: "Maria's Tacos",
  owner: "Maria Elena Vargas",
  city: "Riverbend, OR",
  permit: "Mobile Food Vendor Permit",
  summary: "Propane food truck • Downtown C-2 overlay • Lunch service Tue–Sat",
  estDays: 12,
};

export const permitTypes = [
  { id: "food-truck", label: "Food Truck", blurb: "Mobile food vendor permit + fire + health" },
  { id: "adu", label: "ADU", blurb: "Accessory dwelling unit — zoning + building" },
  { id: "block-party", label: "Block Party", blurb: "Street closure + insurance + notice" },
  { id: "sidewalk-cafe", label: "Sidewalk Café", blurb: "ROW encroachment + ADA path" },
  { id: "home-daycare", label: "Home Daycare", blurb: "State licensing + zoning + fire" },
  { id: "str", label: "Short-Term Rental", blurb: "Registration + lodging tax + safety" },
];
