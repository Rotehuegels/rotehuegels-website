-- Seed CIN (and where known, GSTIN) for listed / PSU facilities we just added.
-- CIN comes from MCA (publicly available). GSTIN is registered-office state-level.
-- GPS coordinates point at the plant/works, not the registered office.

-- ── Hindustan Zinc Ltd (HZL) ────────────────────────────────────────────────
-- CIN: L27204RJ1966PLC001208 — single CIN for the group.
UPDATE recyclers SET
  cin = 'L27204RJ1966PLC001208', latitude = 24.8953, longitude = 74.6667
  WHERE recycler_code = 'PMP-RJ-001'; -- Chanderiya
UPDATE recyclers SET
  cin = 'L27204RJ1966PLC001208', latitude = 24.9342, longitude = 74.0228
  WHERE recycler_code = 'PMP-RJ-002'; -- Dariba (Rajsamand)
UPDATE recyclers SET
  cin = 'L27204RJ1966PLC001208', latitude = 24.6167, longitude = 73.7833
  WHERE recycler_code = 'PMP-RJ-003'; -- Debari (Udaipur)
UPDATE recyclers SET
  cin = 'L27204RJ1966PLC001208', latitude = 28.9731, longitude = 79.5081
  WHERE recycler_code = 'PMP-UK-001'; -- Pantnagar

-- ── Hindalco Industries Ltd ─────────────────────────────────────────────────
-- CIN: L27020MH1958PLC011238
UPDATE recyclers SET
  cin = 'L27020MH1958PLC011238', latitude = 24.2131, longitude = 83.0322
  WHERE recycler_code = 'PMP-UP-001'; -- Renukoot
UPDATE recyclers SET
  cin = 'L27020MH1958PLC011238', latitude = 21.5081, longitude = 83.9322
  WHERE recycler_code = 'PMP-OR-001'; -- Aditya Aluminium, Sambalpur
UPDATE recyclers SET
  cin = 'L27020MH1958PLC011238', latitude = 24.1950, longitude = 82.6200
  WHERE recycler_code = 'PMP-MP-001'; -- Mahan, Singrauli
UPDATE recyclers SET
  cin = 'L27020MH1958PLC011238', latitude = 21.7333, longitude = 72.5500
  WHERE recycler_code = 'PMP-GJ-001'; -- Birla Copper, Dahej

-- ── National Aluminium Company Limited (NALCO) ──────────────────────────────
-- CIN: L27203OR1981GOI000920
UPDATE recyclers SET
  cin = 'L27203OR1981GOI000920', latitude = 20.8408, longitude = 85.1231
  WHERE recycler_code = 'PMP-OR-002'; -- Smelter, Angul
UPDATE recyclers SET
  cin = 'L27203OR1981GOI000920', latitude = 18.7650, longitude = 82.9350
  WHERE recycler_code = 'PMP-OR-003'; -- Damanjodi refinery

-- ── BALCO (Bharat Aluminium Company) ────────────────────────────────────────
-- CIN: U28120CT1965GOI010295
UPDATE recyclers SET
  cin = 'U28120CT1965GOI010295', latitude = 22.3483, longitude = 82.6983
  WHERE recycler_code = 'PMP-CG-001'; -- Korba

-- ── Vedanta Ltd (Aluminium) ─────────────────────────────────────────────────
-- CIN: L13209MH1965PLC291394
UPDATE recyclers SET
  cin = 'L13209MH1965PLC291394', latitude = 21.8558, longitude = 84.0061
  WHERE recycler_code = 'PMP-OR-004'; -- Jharsuguda
UPDATE recyclers SET
  cin = 'L13209MH1965PLC291394', latitude = 19.7225, longitude = 83.4111
  WHERE recycler_code = 'PMP-OR-005'; -- Lanjigarh alumina refinery

-- ── Hindustan Copper Ltd (HCL) ──────────────────────────────────────────────
-- CIN: L27201WB1967GOI028825
UPDATE recyclers SET
  cin = 'L27201WB1967GOI028825', latitude = 22.5850, longitude = 86.4700
  WHERE recycler_code = 'PMP-JH-001'; -- Ghatsila ICC
UPDATE recyclers SET
  cin = 'L27201WB1967GOI028825', latitude = 28.0045, longitude = 75.7856
  WHERE recycler_code = 'PMP-RJ-004'; -- Khetri
UPDATE recyclers SET
  cin = 'L27201WB1967GOI028825', latitude = 22.0428, longitude = 80.7228
  WHERE recycler_code = 'PMP-MP-002'; -- Malanjkhand

-- ── Adani Enterprises (Kutch Copper) ────────────────────────────────────────
-- Adani Enterprises Ltd CIN: L51100GJ1993PLC019067
-- Kutch Copper Ltd is a wholly-owned subsidiary; using parent CIN as a pointer.
UPDATE recyclers SET
  cin = 'L51100GJ1993PLC019067', latitude = 22.7533, longitude = 69.7022
  WHERE recycler_code = 'PMP-GJ-002'; -- Kutch Copper, Mundra

-- ── JSW Aluminium (upcoming) ────────────────────────────────────────────────
UPDATE recyclers SET
  latitude = 22.6522, longitude = 87.3253
  WHERE recycler_code = 'PMP-OR-006'; -- Salboni
