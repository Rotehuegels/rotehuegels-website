-- Rebrand: HydroMet (India) Ltd. → KSM Greenmet Resources Limited
--
-- Company renamed effective 20 July 2025. Same legal entity, CIN and LEI.
-- Registered office (Kancheepuram plant) unchanged per LEI directory.
-- Met the team in person at their Kilpauk corporate office on 2026-04-24.
--
-- Source: https://indialei.in/detailed-information/7563600/9845003FEWAE3D868950/ksm-greenmet-resources-limited/
--   Full legal name:  KSM GREENMET RESOURCES LIMITED (Public Limited Company)
--   Former name:      HYDROMET (INDIA) LIMITED (name change effective 20-Jul-2025)
--   CIN:              U37100TN2002PLC048922   (MCA — Tamil Nadu, incorp. 2002)
--   LEI:              9845003FEWAE3D868950    (Active, next renewal 31-May-2026)
--   Registered:       Vedal Village, Rajakulam, Kancheepuram 631561, Tamil Nadu
--   Corporate office: Kilpauk, Chennai (per in-person meeting 2026-04-24)
--   Contact phone:    +91 88009 73322

BEGIN;

UPDATE recyclers
SET
  company_name = 'KSM Greenmet Resources Limited',
  cin          = 'U37100TN2002PLC048922',
  phone        = '+91 88009 73322',
  notes        = E'Rebranded 20 July 2025 from HYDROMET (INDIA) LIMITED (our legacy record name: "HydroMet (India) Ltd."). Same legal entity — CIN U37100TN2002PLC048922, LEI 9845003FEWAE3D868950. Public limited company, incorporated in Tamil Nadu, 2002.\n\nREGISTERED OFFICE / PLANT — Vedal Village, Rajakulam, Kancheepuram 631561, Tamil Nadu (unchanged across the rebrand).\n\nCORPORATE OFFICE — Kilpauk, Chennai. Sivakumar met the team here in person on 2026-04-24.\n\nBUSINESS — Non-ferrous metal recycler since 1997. Products: copper ingots, zinc oxide, zinc ingots, nickel cathodes, ferro alloys, cobalt concentrates. Legacy domain hydrometindia.com may still resolve; new corporate website pending confirmation.\n\nSources:\n  - India LEI directory (https://indialei.in/detailed-information/7563600/9845003FEWAE3D868950/ksm-greenmet-resources-limited/)\n  - Direct meeting with team at Kilpauk office, 2026-04-24'
WHERE recycler_code = 'MRAI-TN-007';

COMMIT;
