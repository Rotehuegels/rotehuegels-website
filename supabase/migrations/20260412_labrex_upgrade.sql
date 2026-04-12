-- ============================================================
-- LabREX Upgrade — Multi-Industry, Multi-Instrument LIMS
-- ============================================================

-- ── Master: Analytical Instruments ──────────────────────────
CREATE TABLE IF NOT EXISTS lab_instruments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,     -- spectroscopy, wet_chemistry, thermal, mineral_processing, other
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO lab_instruments (code, name, category, description) VALUES
  ('ICP-OES',  'ICP-OES',                          'spectroscopy',        'Inductively Coupled Plasma - Optical Emission Spectroscopy. Multi-element trace analysis.'),
  ('AAS',      'Atomic Absorption Spectroscopy',    'spectroscopy',        'Single-element metal concentration analysis via light absorption.'),
  ('XRF',      'X-Ray Fluorescence',                'spectroscopy',        'Non-destructive elemental analysis via X-ray excitation.'),
  ('WET',      'Wet Chemistry',                     'wet_chemistry',       'Classical titrimetric, gravimetric, and volumetric methods.'),
  ('FURNACE',  'Fire Assay / Furnace',              'thermal',             'Precious metals assay — gold, silver, PGMs via fusion and cupellation.'),
  ('TGA',      'Thermogravimetric Analysis',        'thermal',             'Mass change vs temperature — moisture, volatiles, ash content.'),
  ('PSA',      'Particle Size Analyser',            'mineral_processing',  'Laser diffraction or sieve analysis for particle size distribution.'),
  ('FLOT',     'Flotation Test',                    'mineral_processing',  'Bench-scale flotation for liberation and recovery studies.'),
  ('PH-EC',    'pH / EC Meter',                     'wet_chemistry',       'pH, electrical conductivity, TDS measurement.'),
  ('SPECTRO',  'UV-Vis Spectrophotometer',          'spectroscopy',        'Colorimetric analysis for specific ion concentrations.'),
  ('GC-MS',    'Gas Chromatography - Mass Spec',    'spectroscopy',        'Organic compound identification and quantification.'),
  ('TITRATOR', 'Auto Titrator',                     'wet_chemistry',       'Automated volumetric titration for acid/base/redox.')
ON CONFLICT (code) DO NOTHING;

-- ── Master: Industries / Process Types ──────────────────────
CREATE TABLE IF NOT EXISTS lab_industries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO lab_industries (code, name, description) VALUES
  ('ZINC',        'Zinc Processing',                'Zinc dross recovery, electrowinning, zinc refining'),
  ('COPPER',      'Copper Processing',              'Copper smelting, SX-EW, electrorefining, leaching'),
  ('GOLD',        'Gold Refining',                  'Gold extraction, CIL/CIP, heap leach, refining'),
  ('SILVER',      'Silver Refining',                'Silver extraction, electrolytic refining, Parkes process'),
  ('BM-PROD',     'Black Mass Production',          'Battery recycling — shredding, sorting, black mass production'),
  ('BM-HYDRO',    'Black Mass Hydrometallurgy',     'Lithium, cobalt, nickel, manganese recovery from black mass'),
  ('ALUMINIUM',   'Aluminium Processing',           'Bayer process, Hall-Héroult, aluminium recycling'),
  ('MINERAL',     'Mineral Processing',             'Ore beneficiation, flotation, gravity separation'),
  ('DEFENCE',     'Defence Materials',              'Ballistic materials, explosives QC, armour testing'),
  ('MEDICAL',     'Medical / Pharma',               'Pharmaceutical QC, bioanalytical, sterility testing'),
  ('GENERAL',     'General Laboratory',             'Multi-purpose analytical services')
ON CONFLICT (code) DO NOTHING;

-- ── Master: Configurable Sample Types ───────────────────────
CREATE TABLE IF NOT EXISTS lab_sample_types (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  industry_id  UUID REFERENCES lab_industries(id),
  description  TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, industry_id)
);

-- Zinc sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('zinc-cathode',    'Zinc Cathode',      'Refined zinc product purity analysis'),
  ('zinc-dross',      'Zinc Dross',        'Input dross material composition'),
  ('electrolyte',     'Electrolyte',       'Bath chemistry / acid solution analysis'),
  ('effluent',        'Process Water',     'Effluent / wastewater quality'),
  ('anode-slime',     'Anode Slime',       'Anode residue composition')
) AS v(code, name, descr) WHERE i.code = 'ZINC';

-- Copper sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('cu-cathode',      'Copper Cathode',     'LME grade cathode purity'),
  ('cu-ore',          'Copper Ore',         'Feed material grade analysis'),
  ('cu-concentrate',  'Copper Concentrate', 'Flotation concentrate assay'),
  ('cu-electrolyte',  'Copper Electrolyte', 'Tankhouse solution chemistry'),
  ('cu-slag',         'Copper Slag',        'Smelter slag composition'),
  ('cu-blister',      'Blister Copper',     'Intermediate product analysis'),
  ('pls',             'Pregnant Leach Soln','PLS from heap/dump leach')
) AS v(code, name, descr) WHERE i.code = 'COPPER';

-- Gold sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('au-dore',         'Doré Bar',           'Gold-silver alloy bar assay'),
  ('au-ore',          'Gold Ore',           'Head grade determination'),
  ('au-concentrate',  'Gold Concentrate',   'Gravity/flotation concentrate'),
  ('au-carbon',       'Loaded Carbon',      'Carbon-in-leach/pulp loaded carbon assay'),
  ('au-solution',     'Pregnant Solution',  'Cyanide leach solution'),
  ('au-tailing',      'Tailings',           'Plant tailings loss analysis')
) AS v(code, name, descr) WHERE i.code = 'GOLD';

-- Silver sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('ag-refined',      'Refined Silver',     'Silver bar/grain purity (999+)'),
  ('ag-anode',        'Silver Anode',       'Electrolytic refining feed'),
  ('ag-slime',        'Anode Slime',        'Precious metal bearing slime')
) AS v(code, name, descr) WHERE i.code = 'SILVER';

-- Black Mass Production sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('bm-feed',         'Battery Feed',       'Incoming spent battery material'),
  ('bm-black-mass',   'Black Mass',         'Processed black mass output'),
  ('bm-fines',        'Metal Fines',        'Separated metal fraction (Al, Cu, Fe)'),
  ('bm-off-gas',      'Off-Gas',            'Thermal treatment emissions')
) AS v(code, name, descr) WHERE i.code = 'BM-PROD';

-- Black Mass Hydrometallurgy sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('bm-leachate',     'Leachate Solution',  'Acid leach liquor analysis'),
  ('bm-li-carbonate', 'Lithium Carbonate',  'Li₂CO₃ product purity'),
  ('bm-co-sulphate',  'Cobalt Sulphate',    'CoSO₄ product analysis'),
  ('bm-ni-sulphate',  'Nickel Sulphate',    'NiSO₄ product analysis'),
  ('bm-mn-sulphate',  'Manganese Sulphate', 'MnSO₄ product analysis'),
  ('bm-residue',      'Leach Residue',      'Solid residue after leaching')
) AS v(code, name, descr) WHERE i.code = 'BM-HYDRO';

-- Aluminium sample types
INSERT INTO lab_sample_types (code, name, industry_id, description)
SELECT v.code, v.name, i.id, v.descr
FROM lab_industries i,
(VALUES
  ('al-bauxite',      'Bauxite',            'Feed ore composition'),
  ('al-alumina',      'Alumina',            'Al₂O₃ intermediate product'),
  ('al-metal',        'Aluminium Metal',    'Primary/secondary metal purity'),
  ('al-bath',         'Cryolite Bath',      'Hall-Héroult electrolyte'),
  ('al-dross',        'Aluminium Dross',    'Dross/skimmings composition')
) AS v(code, name, descr) WHERE i.code = 'ALUMINIUM';

-- ── Upgrade existing tables: remove hardcoded constraints ───

-- Remove CHECK constraint on lab_parameters.category
ALTER TABLE lab_parameters DROP CONSTRAINT IF EXISTS lab_parameters_category_check;
-- Remove CHECK constraint on lab_parameters.sample_type
ALTER TABLE lab_parameters DROP CONSTRAINT IF EXISTS lab_parameters_sample_type_check;

-- Add new columns to lab_parameters
ALTER TABLE lab_parameters ADD COLUMN IF NOT EXISTS instrument_id UUID REFERENCES lab_instruments(id);
ALTER TABLE lab_parameters ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES lab_industries(id);
ALTER TABLE lab_parameters ADD COLUMN IF NOT EXISTS method TEXT;           -- analytical method/procedure
ALTER TABLE lab_parameters ADD COLUMN IF NOT EXISTS element_symbol TEXT;   -- Cu, Au, Ag, Zn, Li, Co, Ni, Mn, etc.

-- Remove CHECK constraint on lab_samples.sample_type
ALTER TABLE lab_samples DROP CONSTRAINT IF EXISTS lab_samples_sample_type_check;

-- Add new columns to lab_samples
ALTER TABLE lab_samples ADD COLUMN IF NOT EXISTS instrument_id UUID REFERENCES lab_instruments(id);
ALTER TABLE lab_samples ADD COLUMN IF NOT EXISTS sample_type_id UUID REFERENCES lab_sample_types(id);
ALTER TABLE lab_samples ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES lab_industries(id);
ALTER TABLE lab_samples ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE lab_samples ADD COLUMN IF NOT EXISTS location TEXT;

-- Add instrument to lab_results
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS instrument_id UUID REFERENCES lab_instruments(id);
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS method TEXT;

-- ── Link existing zinc parameters to the zinc industry ──────
UPDATE lab_parameters SET industry_id = (SELECT id FROM lab_industries WHERE code = 'ZINC')
WHERE industry_id IS NULL;

-- ── Seed: Comprehensive parameters for all industries ───────

-- Copper parameters
INSERT INTO lab_parameters (name, unit, category, sample_type, industry_id, element_symbol, default_min, default_max) VALUES
  ('Copper purity',      '%',    'purity',      'cu-cathode',  (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Cu', 99.95, 99.99),
  ('Lead in copper',     'ppm',  'purity',      'cu-cathode',  (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Pb', NULL,  5),
  ('Iron in copper',     'ppm',  'purity',      'cu-cathode',  (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Fe', NULL,  10),
  ('Sulphur in copper',  'ppm',  'purity',      'cu-cathode',  (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'S',  NULL,  15),
  ('Silver in copper',   'ppm',  'purity',      'cu-cathode',  (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Ag', NULL,  25),
  ('Copper in ore',      '%',    'composition', 'cu-ore',      (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Cu', 0.3,   NULL),
  ('Cu in electrolyte',  'g/L',  'composition', 'cu-electrolyte', (SELECT id FROM lab_industries WHERE code = 'COPPER'), 'Cu', 30, 50),
  ('H₂SO₄',             'g/L',  'composition', 'cu-electrolyte', (SELECT id FROM lab_industries WHERE code = 'COPPER'), NULL, 150, 200);

-- Gold parameters
INSERT INTO lab_parameters (name, unit, category, sample_type, industry_id, element_symbol, default_min, default_max) VALUES
  ('Gold grade',         'g/t',  'purity',      'au-ore',       (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'Au', NULL, NULL),
  ('Gold in doré',       '%',    'purity',      'au-dore',      (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'Au', 85,   NULL),
  ('Silver in doré',     '%',    'purity',      'au-dore',      (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'Ag', NULL, NULL),
  ('Gold on carbon',     'g/t',  'composition', 'au-carbon',    (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'Au', NULL, NULL),
  ('Cyanide conc',       'mg/L', 'composition', 'au-solution',  (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'CN', 200,  500),
  ('Gold in tailing',    'g/t',  'composition', 'au-tailing',   (SELECT id FROM lab_industries WHERE code = 'GOLD'), 'Au', NULL, 0.3);

-- Silver parameters
INSERT INTO lab_parameters (name, unit, category, sample_type, industry_id, element_symbol, default_min, default_max) VALUES
  ('Silver purity',      '%',    'purity',      'ag-refined',   (SELECT id FROM lab_industries WHERE code = 'SILVER'), 'Ag', 99.9, 99.99),
  ('Copper in silver',   'ppm',  'purity',      'ag-refined',   (SELECT id FROM lab_industries WHERE code = 'SILVER'), 'Cu', NULL, 50),
  ('Lead in silver',     'ppm',  'purity',      'ag-refined',   (SELECT id FROM lab_industries WHERE code = 'SILVER'), 'Pb', NULL, 20);

-- Black Mass parameters
INSERT INTO lab_parameters (name, unit, category, sample_type, industry_id, element_symbol, default_min, default_max) VALUES
  ('Lithium',            '%',    'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Li', NULL, NULL),
  ('Cobalt',             '%',    'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Co', NULL, NULL),
  ('Nickel',             '%',    'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Ni', NULL, NULL),
  ('Manganese',          '%',    'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Mn', NULL, NULL),
  ('Graphite',           '%',    'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-PROD'),  'C',  NULL, NULL),
  ('Fluorine',           'ppm',  'composition', 'bm-black-mass', (SELECT id FROM lab_industries WHERE code = 'BM-PROD'),  'F',  NULL, 1000),
  ('Li₂CO₃ purity',     '%',    'purity',      'bm-li-carbonate',(SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Li', 99.0, NULL),
  ('CoSO₄ purity',      '%',    'purity',      'bm-co-sulphate', (SELECT id FROM lab_industries WHERE code = 'BM-HYDRO'), 'Co', 99.0, NULL);

-- Aluminium parameters
INSERT INTO lab_parameters (name, unit, category, sample_type, industry_id, element_symbol, default_min, default_max) VALUES
  ('Al₂O₃ content',     '%',    'composition', 'al-bauxite',  (SELECT id FROM lab_industries WHERE code = 'ALUMINIUM'), 'Al', 40, NULL),
  ('SiO₂ content',      '%',    'composition', 'al-bauxite',  (SELECT id FROM lab_industries WHERE code = 'ALUMINIUM'), 'Si', NULL, 5),
  ('Fe₂O₃ content',     '%',    'composition', 'al-bauxite',  (SELECT id FROM lab_industries WHERE code = 'ALUMINIUM'), 'Fe', NULL, 20),
  ('Aluminium purity',  '%',    'purity',      'al-metal',    (SELECT id FROM lab_industries WHERE code = 'ALUMINIUM'), 'Al', 99.5, 99.9),
  ('Bath ratio',        '',     'composition', 'al-bath',     (SELECT id FROM lab_industries WHERE code = 'ALUMINIUM'), NULL, 1.05, 1.15);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_lab_instruments_active ON lab_instruments(is_active);
CREATE INDEX IF NOT EXISTS idx_lab_sample_types_industry ON lab_sample_types(industry_id);
CREATE INDEX IF NOT EXISTS idx_lab_parameters_industry ON lab_parameters(industry_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_industry ON lab_samples(industry_id);
