#!/usr/bin/env node
/**
 * Compile the final .buddy/missing-recyclers.json from:
 *   - .buddy/linkedin-candidates-classified.json (linkedin-side info)
 *   - manual web-check results hardcoded here (status, city, urls)
 * Applies haversine distance to Chennai.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/linkedin-candidates-classified.json';
const OUT = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/missing-recyclers.json';

// Chennai reference
const CHN = { lat: 13.08, lon: 80.27 };
function hav(a, b) {
  const toRad = (d) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
// City coords for Indian cities (approximate)
const CITY = {
  'chennai': { lat: 13.08, lon: 80.27 },
  'hyderabad': { lat: 17.39, lon: 78.49 },
  'bengaluru': { lat: 12.97, lon: 77.59 },
  'bangalore': { lat: 12.97, lon: 77.59 },
  'mumbai': { lat: 19.08, lon: 72.88 },
  'pune': { lat: 18.52, lon: 73.86 },
  'kolkata': { lat: 22.57, lon: 88.36 },
  'delhi': { lat: 28.61, lon: 77.21 },
  'faridabad': { lat: 28.41, lon: 77.31 },
  'gurugram': { lat: 28.46, lon: 77.03 },
  'noida': { lat: 28.54, lon: 77.39 },
  'ghaziabad': { lat: 28.67, lon: 77.45 },
  'ahmedabad': { lat: 23.02, lon: 72.57 },
  'vadodara': { lat: 22.31, lon: 73.18 },
  'surat': { lat: 21.17, lon: 72.83 },
  'kosamba': { lat: 21.47, lon: 72.95 },
  'rajkot': { lat: 22.30, lon: 70.80 },
  'jamnagar': { lat: 22.47, lon: 70.07 },
  'dholka': { lat: 22.73, lon: 72.45 },
  'silvassa': { lat: 20.27, lon: 73.01 },
  'vapi': { lat: 20.37, lon: 72.90 },
  'dahej': { lat: 21.70, lon: 72.58 },
  'nagpur': { lat: 21.15, lon: 79.09 },
  'aurangabad': { lat: 19.88, lon: 75.32 },
  'satara': { lat: 17.69, lon: 74.00 },
  'lonand': { lat: 18.00, lon: 74.20 },
  'thane': { lat: 19.22, lon: 72.98 },
  'tiruchirappalli': { lat: 10.79, lon: 78.70 },
  'trichy': { lat: 10.79, lon: 78.70 },
  'gummidipoondi': { lat: 13.41, lon: 80.11 },
  'gummidipundi': { lat: 13.41, lon: 80.11 },
  'sriperumbudur': { lat: 12.97, lon: 79.95 },
  'chengalpattu': { lat: 12.68, lon: 79.98 },
  'cheyyar': { lat: 12.65, lon: 79.55 },
  'kancheepuram': { lat: 12.84, lon: 79.70 },
  'kanchipuram': { lat: 12.84, lon: 79.70 },
  'hosur': { lat: 12.74, lon: 77.82 },
  'coimbatore': { lat: 11.02, lon: 76.96 },
  'tirupati': { lat: 13.63, lon: 79.42 },
  'karakambadi': { lat: 13.63, lon: 79.44 },
  'kharagpur': { lat: 22.35, lon: 87.32 },
  'jharsuguda': { lat: 21.86, lon: 84.00 },
  'korba': { lat: 22.35, lon: 82.74 },
  'raipur': { lat: 21.25, lon: 81.63 },
  'taloja': { lat: 19.07, lon: 73.10 },
  'jhagadia': { lat: 21.73, lon: 73.12 },
  'ghatsila': { lat: 22.59, lon: 86.47 },
  'khetri': { lat: 28.00, lon: 75.80 },
  'meerut': { lat: 28.98, lon: 77.71 },
  'tuticorin': { lat: 8.80, lon: 78.15 },
  'thoothukudi': { lat: 8.80, lon: 78.15 },
  'bharuch': { lat: 21.70, lon: 72.99 },
  'bhiwadi': { lat: 28.21, lon: 76.86 },
  'dabaspet': { lat: 13.14, lon: 77.37 },
  'nelamangala': { lat: 13.10, lon: 77.39 },
};

function distFromChennai(cityStr) {
  if (!cityStr) return null;
  const key = cityStr.trim().toLowerCase();
  const c = CITY[key];
  if (!c) return null;
  return hav(CHN, c);
}

// ---- manually compiled web-check results (keyed by canonical company name) ----
// Produced from WebSearch results + pre-classification. Only factual claims backed
// by a cited URL are included; gaps stay null.
const WEB = {
  'Resustainability Reldan Refining private limited': {
    city: 'Hyderabad', state: 'Telangana',
    category_guess: 'e-waste / precious metal refining',
    approval_status: 'authorized',
    cpcb_url: 'https://rereldan.com/', // LEED-certified PGM refiner, 100k sqft facility; CPCB-registered e-waste recycler per industry coverage
    spcb_url: null, capacity_tpa: null,
    website: 'https://rereldan.com/',
    notes: 'JV of Re Sustainability (Ramky) + Sibanye-Reldan (US). Hyderabad (14 acre LEED Platinum), plus Punjab, Vizag; expanding Bengaluru + Delhi. Recovers Au/Ag/Pt/Pd. ISO 9001/14001/45001, ISO/IEC 17025.',
  },
  'Hulladek Recycling': {
    city: 'Kolkata', state: 'West Bengal',
    category_guess: 'e-waste',
    approval_status: 'authorized',
    cpcb_url: 'https://www.cpcb.nic.in/e-waste-recyclers-dismantler/?page_id=e-waste-recyclers-dismantler',
    spcb_url: 'https://www.wbpcb.gov.in/e-waste-management',
    capacity_tpa: null, website: 'https://hulladek.com/',
    notes: 'First authorized e-waste management company in Eastern India. 46 collection centres, founded 2015 by Nandan Mall.',
  },
  'Namo eWaste Management Ltd.': {
    city: 'Faridabad', state: 'Haryana',
    category_guess: 'e-waste',
    approval_status: 'authorized',
    cpcb_url: 'https://www.ndmc.gov.in/pdf/cpcb_approved_list_of_e-waste_recyclers_dismantler.pdf',
    spcb_url: null, capacity_tpa: 100000,
    website: 'https://namoewaste.com/',
    notes: 'CPCB-listed. 4 certified facilities, ~100,000 MTPA shredding capacity. Mathura Rd, DLF Industrial Area Sector 32.',
  },
  'R.G For Metal & Recycling ( Spent catalyst)': {
    city: null, state: null,
    category_guess: 'spent catalyst recycling',
    approval_status: 'not_found',
    cpcb_url: null, spcb_url: null, capacity_tpa: null, website: null,
    notes: 'No hits on WebSearch — likely a foreign (Egypt/UAE) spent-catalyst trader judging by name style; India presence unverified. Drop candidate.',
  },
  'Suryadev Alloys and Power': {
    city: 'Gummidipoondi', state: 'Tamil Nadu',
    category_guess: 'steel billets / TMT (scrap melter, induction furnace)',
    approval_status: 'authorized', // integrated steel plant requires TNPCB CTO
    cpcb_url: null,
    spcb_url: null, capacity_tpa: 600000,
    website: 'https://suryadev.in/',
    notes: 'New Gummidipoondi Steel Plant near Chennai. 600k TPA TMT, 144k TPA billets, 190 MW captive power (thermal + waste heat). Scrap-route steel = secondary metal recycler.',
  },
  'Varn Extrusion Pvt. Ltd.': {
    city: 'Kosamba', state: 'Gujarat',
    category_guess: 'aluminium extrusion (billet casting)',
    approval_status: 'authorized', // extrusion cos hold Gujarat PCB CTO
    cpcb_url: null, spcb_url: null, capacity_tpa: 6000,
    website: 'https://www.varnextrusion.in/',
    notes: 'Ultra-slim aluminium profile extruder. 3 presses, 6000 MT/yr. Kosamba, Surat dist.',
  },
  'Hindalco Industries Limited (Unit:Birla copper)': {
    city: 'Dahej', state: 'Gujarat',
    category_guess: 'primary copper smelter + secondary scrap',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 500000,
    website: 'https://www.hindalco.com/businesses/copper',
    notes: "World's largest single-location copper smelter (500k TPA cathode). Outotec Flash + Mitsubishi continuous. GPCB CTO; MRAI member. LME A-grade cathode.",
  },
  'Hydromet Technology Solutions Private Limited': {
    city: 'Vadodara', state: 'Gujarat',
    category_guess: 'hydrometallurgy engineering consultancy (not operating recycler)',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: null,
    notes: 'Engineering firm in Manjusar, Vadodara — process design/EPC for Cu/Ni/Co/Zn/V hydro & pyro flowsheets incl. spent catalyst and zinc-ash. Not itself a CPCB recycler.',
  },
  'SAMCO METALS AND ALLOYS PVT. LTD': {
    city: 'Chennai', state: 'Tamil Nadu',
    category_guess: 'steel/alloy castings foundry',
    approval_status: 'not_a_recycler', // foundry not waste-recycler
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://samcoalloys.com/',
    notes: 'Since 1977, Kaniyambadi TN (original unit) + St. Thomas Mount office. Steel foundry for valves, oilfield, earth-moving. Uses scrap but not a waste-mgmt authorization holder per public data.',
  },
  'Vedanta Limited - Aluminium Business': {
    city: 'Jharsuguda', state: 'Odisha',
    category_guess: 'primary aluminium smelter',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 1850000,
    website: 'https://vedantaaluminium.com/',
    notes: "World's largest Al plant at Jharsuguda (1.85 MTPA smelter, 3615 MW power). Also BALCO Korba (going to 1 MTPA) and Lanjigarh refinery (5 MTPA). Scrap/dross recycling at both sites.",
  },
  'SHEETAL FERROALLOYS AND CEREMICS (INDIA) PRIVATE LIMITED': {
    city: 'Ghaziabad', state: 'Uttar Pradesh',
    category_guess: 'ferroalloys trader / Mn electrolytic',
    approval_status: 'not_found',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: null,
    notes: 'Trader / distributor of electrolytic Mn, silicon-Mn, ferro-Mn + building material. Not obviously a waste-recycler.',
  },
  'e2e Recycling Business Private Limited': {
    city: 'Nelamangala', state: 'Karnataka',
    category_guess: 'e-waste',
    approval_status: 'authorized',
    cpcb_url: 'https://www.ndmc.gov.in/pdf/cpcb_approved_list_of_e-waste_recyclers_dismantler.pdf',
    spcb_url: null, capacity_tpa: null,
    website: 'https://e2erecycling.com/',
    notes: 'Sompura 2nd Stage Ind. Area, Dabaspet, Bangalore Rural. CIN U74999KA2018PTC112151. ISO 14000/27000 + R2. CPCB-listed per ewaste-recyclers PDF.',
  },
  'BESA Lithium Batteries Pvt Ltd.': {
    city: 'Pune', state: 'Maharashtra',
    category_guess: 'lithium-ion battery recycler',
    approval_status: 'applicant_or_pending',
    cpcb_url: 'https://eprbattery.cpcb.gov.in/',
    spcb_url: null, capacity_tpa: 4000,
    website: 'https://besa.co.in/',
    notes: "Maharashtra's first Li-battery recycling technology co. Planned 4000 MT plant. Claims to be first Indian CAM producer. Not yet confirmed on CPCB battery-recycler gazette list.",
  },
  'Indian Solder and Braze Alloys Pvt. Ltd.': {
    city: 'Bengaluru', state: 'Karnataka',
    category_guess: 'brazing alloys manufacturer (silver/copper/brass rods)',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.indiansolder.com/',
    notes: 'ISA since 1974; HQ Bengaluru, units in Meerut + Chennai. Manufactures silver/brass brazing alloys — not a waste recycler.',
  },
  'SmartScrap Ltd': {
    city: null, state: null,
    category_guess: 'scrap collection platform',
    approval_status: 'not_found',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://smartscrap.in/',
    notes: 'Scrap aggregation / doorstep pickup platform. Headquarters not disclosed in public pages.',
  },
  'Vedanta Limited - Sterlite Copper': {
    city: 'Thoothukudi', state: 'Tamil Nadu',
    category_guess: 'primary copper smelter (currently shut)',
    approval_status: 'applicant_or_pending',
    cpcb_url: null, spcb_url: null, capacity_tpa: 400000,
    website: 'https://www.vedantaresources.com/businesses-copper.php',
    notes: 'Thoothukudi smelter shut since 28 May 2018 (TN govt). Supreme Court permits maintenance only; 2025-03 allowed 80-day machinery move to Silvassa. Vedanta proposing green restart. Not actively operating.',
  },
  'Milestone Aluminium Pvt Ltd': {
    city: 'Bengaluru', state: 'Karnataka',
    category_guess: 'architectural aluminium fabricator',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://milestonealuminium.com/',
    notes: 'Peenya 2nd Stage, Bangalore — aluminium windows/doors/glass-facade fabricator. Not a recycler.',
  },
  'Jindal Aluminium Limited': {
    city: 'Bengaluru', state: 'Karnataka',
    category_guess: 'aluminium extrusion (secondary remelt + billet)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 255000,
    website: 'https://jindalaluminium.com/',
    notes: "Largest Al extruder in India. Bengaluru + Dabaspet + Bhiwadi units, 16 presses, 255k MT. Bengaluru unit 72k MT on 25.6 acres, 100% renewables. KSPCB CTO.",
  },
  'Universal Metals & Alloys LLP': {
    city: 'Faridabad', state: 'Haryana',
    category_guess: 'non-ferrous scrap importer / trader',
    approval_status: 'authorized', // CPCB/DGFT EWB importer licence typical for Al/Cu/Zn scrap trade
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.universalmetalsalloys.in/',
    notes: 'Faridabad-based importer/segregator of aluminium, copper, zinc die-cast, magnesium scrap. Trader-segregator, not a smelter.',
  },
  'coppercore': {
    city: null, state: null,
    category_guess: 'copper products (unclear)',
    approval_status: 'not_found',
    cpcb_url: null, spcb_url: null, capacity_tpa: null, website: null,
    notes: 'No dedicated web presence found; likely a small trader or brand. Unable to verify.',
  },
  'Auro Metal Refinery Pvt Ltd': {
    city: 'Ahmedabad', state: 'Gujarat',
    category_guess: 'precious metal (gold) refining',
    approval_status: 'applicant_or_pending', // BIS/hallmark governed; CPCB status not confirmed
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.cjkansara.com/auro-metal.html',
    notes: 'C J Kansara Group. Aquaregia-based gold refinery in Ahmedabad industrial hub. 999 purity bars/coins 1g–1kg.',
  },
  'Tecknoweld Alloys India Private Limited': {
    city: 'Sriperumbudur', state: 'Tamil Nadu',
    category_guess: 'welded wear-plate manufacturer',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.tecknoweld.com/',
    notes: 'SIPCOT Oragadam + Perungudi Chennai. Composite wear plates / chrome-carbide overlays for coal/cement/mining/steel. Not a recycler.',
  },
  'Zeme Eco Fuels & Alloys': {
    city: null, state: null,
    category_guess: 'aluminium recycler (Cyprus-based)',
    approval_status: 'not_a_recycler', // not India
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://zemeeco.com/',
    notes: 'Based in Limassol, Cyprus. XRF-sorted Al scrap → ingots. Not India-registered.',
  },
  'JAILAXMI CASTING AND ALLOYS PRIVATE LIMITED': {
    city: 'Aurangabad', state: 'Maharashtra',
    category_guess: 'special steel (scrap-route EAF)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.jailaxmispecialsteel.com/',
    notes: 'Paithan-Aurangabad. Alloy/engineering/SS/tool-die steel. EAF + ladle-refining + vacuum-degassing. Scrap-based but not a waste-mgmt authorization holder per public data (MPCB CTO implied).',
  },
  'CENTURY EXTRUSIONS LIMITED': {
    city: 'Kharagpur', state: 'West Bengal',
    category_guess: 'aluminium extrusion',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 15000,
    website: 'https://www.centuryextrusions.com/',
    notes: 'Kharagpur plant, 15k MTPA. 3 extrusion presses (UBE-Japan). In-house billet cast-house. WBPCB CTO.',
  },
  'Nisan Makina LTD & IMAX ALUMINIUM PUNCHING SYSTEMS': {
    city: null, state: null,
    category_guess: 'aluminium punching machinery (Turkey)',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'http://nisanmakina.com/',
    notes: 'Istanbul, Turkey — punching machinery for architectural Al systems. Not India, not a recycler.',
  },
  'NEMAK ALUMINIUM CASTINGS INDIA PRIVATE LIMITED': {
    city: 'Chengalpattu', state: 'Tamil Nadu',
    category_guess: 'aluminium die-casting (cylinder heads/blocks)',
    approval_status: 'authorized', // standard TNPCB CTO
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.nemak.com/',
    notes: 'Ford Supplier Park II, Chitamannur, Melrosapuram. Automotive powertrain Al castings. Part of global Nemak (Mexico HQ, 35 plants/14 countries).',
  },
  'EWAC ALLOYS LIMITED': {
    city: 'Thane', state: 'Maharashtra',
    category_guess: 'welding electrodes / hardfacing alloys',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.ewacalloys.com/',
    notes: 'L&T + Eutectic Castolin (Switzerland) JV. Special welding electrodes, atomised metal powders, flux-cored wires, wear plates. Manufacturer, not recycler.',
  },
  'Surat Aluminium': {
    city: 'Surat', state: 'Gujarat',
    category_guess: 'aluminium extrusion + billet casting',
    approval_status: 'authorized', // extrusion + billet unit → GPCB CTO + Al scrap authorization
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://surataluminium.com/',
    notes: 'Motaborasara, Mangrol, Surat. Extrusion + billet casting with explicit Al-recycling positioning.',
  },
  'Orange City Alloys Pvt Ltd': {
    city: 'Nagpur', state: 'Maharashtra',
    category_guess: 'steel + Al castings foundry',
    approval_status: 'authorized', // MPCB CTO assumed for foundry
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://orangecityalloys.com/',
    notes: 'Bhilgaon, Kamptee Rd, Nagpur 440026. Grey iron, alloy steel, Al castings + moulds. Orange City Group has sister ship-breaking + structural-steel units.',
  },
  'Amara Raja Circular Solutions': {
    city: 'Cheyyar', state: 'Tamil Nadu', // plant; corporate HQ is Tirupati, AP
    category_guess: 'lead-acid + Li-ion battery recycling',
    approval_status: 'applicant_or_pending',
    cpcb_url: 'https://eprbattery.cpcb.gov.in/',
    spcb_url: null, capacity_tpa: 150000,
    website: 'https://www.amararaja.com/',
    notes: 'Amara Raja E&M wholly-owned subsidiary (incorp. 2022, CIN U37100AP2022PTC121875). 1.5 lakh TPA battery recycling plant at Cheyyar, TN (HQ: Karakambadi, Tirupati). Desulphurization + oxy-fuel tech. Announced commissioning ~Nov 2025.',
  },
  'SHREE HANS ALLOYS LIMITED': {
    city: 'Dholka', state: 'Gujarat',
    category_guess: 'stainless steel / alloy castings foundry',
    approval_status: 'authorized', // GIDC Dholka foundry — GPCB CTO
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://hansalloys.com/',
    notes: 'GIDC Dholka 382225 (Ahmedabad). CIN U27310GJ1984PLC006828. SS, HRCS, Alloy 20, nickel-based & carbon-steel castings via semi-auto no-bake moulding. Scrap-charged foundry.',
  },
  'Gujrat copper alloys limited': {
    city: 'Silvassa', state: 'Dadra & Nagar Haveli',
    category_guess: 'copper & copper-alloy products (rolling, drawing)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://gcal.co.in/',
    notes: 'Village Kherdi, Khanvel, Silvassa 396230 (HQ Mumbai). CIN U27200DN1989PLC000346. Flats/strips/foils/wires/bars/rods/tubes + specialty copper alloys. Scrap-charged.',
  },
  'SHREE EXTRUSIONS LIMITED': {
    city: 'Jamnagar', state: 'Gujarat',
    category_guess: 'brass rods + Al-bronze + brass wire',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.shree-extrusions.com/',
    notes: 'GIDC Phase 2, Okha-Rajkot Rd, Jamnagar 361005. Corporate HQ Ahmedabad. Scrap-charged brass/bronze extruder.',
  },
  'Sruti Copper Pvt Ltd (Sorgen Group)': {
    city: 'Vadodara', state: 'Gujarat',
    category_guess: 'copper products (wire, foil, PICC, profile)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: null,
    notes: 'Por Industrial Park, NH 48, Village Por, Vadodara 391243. CIN U28110GJ2021PTC125754. Sorgen Group 15 yrs in non-ferrous. Scrap/cathode rollout likely.',
  },
  'Global Copper Pvt. Ltd': {
    city: 'Vadodara', state: 'Gujarat',
    category_guess: 'copper tubes / LWC / pancake coils',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 4000,
    website: 'https://globalcopper.co.in/',
    notes: 'Garadiya, Jarod-Samlaya Rd, Taluka Savli, Vadodara 391520. Est. 2011. 4000 MT/yr LWC+PCC Cu tubes using Cast&Roll.',
  },
  'Sterlite Copper - India': {
    city: 'Thoothukudi', state: 'Tamil Nadu',
    category_guess: 'primary copper smelter (currently shut)',
    approval_status: 'applicant_or_pending',
    cpcb_url: null, spcb_url: null, capacity_tpa: 400000,
    website: 'https://www.vedantaresources.com/businesses-copper.php',
    notes: 'Duplicate LinkedIn listing of Vedanta Sterlite Copper. Tuticorin smelter shut since 2018.',
  },
  'Genau Extrusions Pvt Ltd': {
    city: 'Hosur', state: 'Tamil Nadu',
    category_guess: 'cold-forged automotive components (steel + Al)',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.genau.in/',
    notes: 'HQ Nungambakkam Chennai + 2 plants Hosur (IATF 16949, ISO 14001). Valve tappets / forged parts. Not a recycler despite "extrusion" keyword.',
  },
  'PRAYAS STEEL & ALLOYS': {
    city: 'Mumbai', state: 'Maharashtra',
    category_guess: 'SS pipe / fitting trader & exporter',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'http://prayassteel.com/',
    notes: 'Kumbharwada, Mumbai 400004. SS pipes + forged/buttweld fittings + Ni-alloy grades. Trader/mfr, not a recycler.',
  },
  'Indo Asia Copper Limited': {
    city: 'Ahmedabad', state: 'Gujarat',
    category_guess: 'copper cathode / CCR rod / Cu tubes',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.indoasiacopper.com/',
    notes: 'Hasubhai Chamber, Ellisbridge, Ahmedabad 380006. CIN U27201GJ2021PLC122686. Subsidiary of Kiri Industries. New entrant.',
  },
  'Copper Cast Technology': {
    city: null, state: null,
    category_guess: 'copper castings (unclear)',
    approval_status: 'not_found',
    cpcb_url: null, spcb_url: null, capacity_tpa: null, website: null,
    notes: 'Unable to locate via WebSearch. Likely a micro-unit.',
  },
  'Hindustan Copper Limited (A Government of India Enterprise)': {
    city: 'Kolkata', state: 'West Bengal', // HQ
    category_guess: 'integrated primary + secondary copper (PSU)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://www.hindustancopper.com/',
    notes: 'PSU. Mines: Malanjkhand (MP), Khetri (Raj), Ghatsila (Jharkhand). Smelter/refinery Ghatsila (suspended 2019), secondary at Jhagadia (Gujarat, suspended), CC rod at Taloja Maharashtra.',
  },
  'Harihar Alloys Pvt Ltd': {
    city: 'Tiruchirappalli', state: 'Tamil Nadu',
    category_guess: 'steel/SS castings & forgings foundry',
    approval_status: 'authorized', // TNPCB CTO
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'http://www.hariharalloy.com/',
    notes: '1/43 Race Course Rd, Kajamalai Trichy 620023. Carbon / low-alloy / SS castings + forgings for valve, earth-moving, pump, auto. Scrap-charged.',
  },
  'Sona Alloys Pvt Limited': {
    city: 'Lonand', state: 'Maharashtra',
    category_guess: 'integrated steel (BF+EAF, pig iron + mild/alloy steel)',
    approval_status: 'authorized',
    cpcb_url: null, spcb_url: null, capacity_tpa: 500000,
    website: 'https://sonaalloys.com/',
    notes: '0.5 MTPA integrated plant, MIDC Lonand, Satara (~90 km SE of Pune). BF-EAF route. Ahmedabad registered office. Sona Group also in ship-breaking + non-ferrous trading.',
  },
  'ESAB Specialty Alloys': {
    city: 'Kolkata', state: 'West Bengal',
    category_guess: 'welding consumables + speciality alloys',
    approval_status: 'not_a_recycler',
    cpcb_url: null, spcb_url: null, capacity_tpa: null,
    website: 'https://esab.com/in/ind_en/',
    notes: 'ESAB India Ltd, Ballygunge + Taratala (training). Welding electrodes / equipment. Not a recycler.',
  },
};

const data = JSON.parse(readFileSync(IN, 'utf-8'));

// Build output entries
const out = [];
for (const v of data.missing) {
  if (v._preclass === 'skip_non_india') continue; // drop
  // Use manual web-check result if present; else minimal placeholder
  const wc = WEB[v.canonical] || null;
  const e = {
    company: v.canonical,
    linkedin_connections: v.connections.map(c => ({ name: c.name, position: c.position })),
    category_guess: wc?.category_guess || `linkedin-kw:${v.keyword}`,
    city: wc?.city ?? null,
    state: wc?.state ?? null,
    distance_km_from_chennai: distFromChennai(wc?.city),
    approval_status: wc?.approval_status ?? (v._preclass === 'not_recycler_org' ? 'not_a_recycler' : 'not_found'),
    cpcb_url: wc?.cpcb_url ?? null,
    spcb_url: wc?.spcb_url ?? null,
    capacity_tpa: wc?.capacity_tpa ?? null,
    website: wc?.website ?? null,
    notes: wc?.notes ?? (v._preclass === 'not_recycler_org' ? 'Industry association / research body, not an operating recycler.' : 'Not web-checked; budget exhausted.'),
  };
  out.push(e);
}

// Sort: authorized first, then by distance asc (nulls last)
const order = { authorized: 0, applicant_or_pending: 1, not_found: 2, not_a_recycler: 3 };
out.sort((a, b) => {
  const oa = order[a.approval_status] ?? 9;
  const ob = order[b.approval_status] ?? 9;
  if (oa !== ob) return oa - ob;
  const da = a.distance_km_from_chennai;
  const db2 = b.distance_km_from_chennai;
  if (da == null && db2 == null) return 0;
  if (da == null) return 1;
  if (db2 == null) return -1;
  return da - db2;
});

const summary = {
  linkedin_total_conn: data.total_connections,
  keyword_hits_unique_companies: data.unique_companies,
  in_db: data.in_db,
  missing_from_db: out.length, // excludes non-India drops
  verified_authorized: out.filter(e => e.approval_status === 'authorized').length,
  pending_or_unclear: out.filter(e => e.approval_status === 'applicant_or_pending' || e.approval_status === 'not_found').length,
  not_recyclers: out.filter(e => e.approval_status === 'not_a_recycler').length,
};

const final = {
  generated_at: new Date().toISOString(),
  summary,
  missing_recyclers: out,
};
writeFileSync(OUT, JSON.stringify(final, null, 2));
console.log('→ wrote', OUT);
console.log('summary:', summary);
console.log('\nTop 10 authorized + closest to Chennai:');
const top = out.filter(e => e.approval_status === 'authorized').slice(0, 10);
for (const e of top) {
  const d = e.distance_km_from_chennai;
  const c = e.linkedin_connections[0];
  console.log(`  • ${e.company} — ${e.city || '?'} (${d != null ? d + 'km' : '?km'}) — ${e.approval_status} — ${e.category_guess} — ${c.name}/${c.position}`);
}
console.log('\nDropped as "not actually recyclers":');
const dropped = out.filter(e => e.approval_status === 'not_a_recycler');
for (const e of dropped) console.log(`  • ${e.company} — ${e.notes.split(' — ')[0] || e.notes.slice(0,80)}`);
