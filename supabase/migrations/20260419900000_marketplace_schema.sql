-- ─────────────────────────────────────────────────────────────────────────
-- Marketplace schema — supports the 2-sided nature of the circular economy
-- ecosystem: every facility is a seller of something AND a buyer of
-- something else. This migration adds two tables:
--
--   item_categories — the taxonomy of tradeable materials, grouped by
--                     role in the value chain (virgin supply, secondary
--                     supply, intermediate battery chain, EOL feedstock,
--                     byproducts, plastics/paper/tyres, consumables).
--
--   listings        — individual buy / sell posts. Optionally linked to
--                     a facility in the recyclers table. Includes
--                     quantity, location, price hint, validity.
--
-- RLS: enabled, authenticated-only (matches the rest of the schema).
-- ─────────────────────────────────────────────────────────────────────────

-- ── Taxonomy ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_categories (
  id           text        PRIMARY KEY,                       -- slug, e.g. 'secondary_aluminium_adc12'
  parent_id    text        REFERENCES item_categories(id),
  group_code   text        NOT NULL,                          -- one of: virgin_supply | secondary_supply | intermediate_battery | eol_feedstock | byproduct | plastics_paper_tyres | consumable
  label        text        NOT NULL,                          -- display name
  description  text,
  typical_unit text        DEFAULT 'MT',                      -- MT / TPA / kg / unit / GWh
  isri_grade   text,                                          -- ISRI scrap grade (e.g. 'Taint-Tabor' for aluminium alloy)
  hsn_code     text,                                          -- GST HSN code
  sort_order   integer     NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_categories_group ON item_categories (group_code, sort_order);
CREATE INDEX IF NOT EXISTS idx_item_categories_parent ON item_categories (parent_id);

-- ── Listings (buy / sell posts) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type        text        NOT NULL CHECK (listing_type IN ('sell', 'buy')),
  item_category_id    text        NOT NULL REFERENCES item_categories(id),
  recycler_id         uuid        REFERENCES recyclers(id),   -- optional: linked facility
  company_name        text,                                    -- for non-registered posters
  title               text        NOT NULL,
  description         text,
  quantity_value      numeric(14,2),
  quantity_unit       text,
  price_inr_per_unit  numeric(14,2),
  location_state      text,
  location_city       text,
  contact_email       text,
  contact_phone       text,
  valid_until         date,
  status              text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
  created_by_email    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_type_status     ON listings (listing_type, status);
CREATE INDEX IF NOT EXISTS idx_listings_category        ON listings (item_category_id);
CREATE INDEX IF NOT EXISTS idx_listings_state           ON listings (location_state);
CREATE INDEX IF NOT EXISTS idx_listings_recycler        ON listings (recycler_id);
CREATE INDEX IF NOT EXISTS idx_listings_valid_until     ON listings (valid_until);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_item_categories" ON item_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_listings"        ON listings        FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON item_categories FROM anon;
REVOKE ALL ON listings        FROM anon;

-- ── Seed: 7 group parents + 100+ tradeable items ─────────────────────────
INSERT INTO item_categories (id, group_code, label, description, sort_order) VALUES
  ('_group_virgin_supply',       'virgin_supply',       'Virgin metals & minerals',     'Upstream-tier output: primary smelter / refinery metal and mined minerals',        10),
  ('_group_secondary_supply',    'secondary_supply',    'Secondary (recycled) metals',  'Reverse-loop output: metal reclaimed from scrap, slag, dross, or black mass',   20),
  ('_group_intermediate_battery','intermediate_battery','Battery chain intermediates',  'Cells, packs, CAM, anode, electrolyte, foils, separators',                       30),
  ('_group_eol_feedstock',       'eol_feedstock',       'End-of-life feedstock',        'What reverse-loop facilities buy: EOL packs, ULABs, e-waste, ELV, scrap grades', 40),
  ('_group_byproduct',           'byproduct',           'Byproducts & intermediates',   'Dross, slag, mill scale, black mass, fly ash — one plant''s waste, another''s feedstock', 50),
  ('_group_plastics_paper_tyres','plastics_paper_tyres','Plastics / paper / tyres / textiles', 'Phase-2 expansion categories',                                               60),
  ('_group_consumable',          'consumable',          'Consumables & reagents',       'Fluxes, refractories, leaching reagents, extractants, electrodes',               70)
ON CONFLICT (id) DO NOTHING;

-- ── (A) Virgin metals & minerals ─────────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, hsn_code, sort_order) VALUES
  ('vs_al_primary_ingot',   '_group_virgin_supply', 'virgin_supply', 'Primary aluminium ingot',        'LME grade, 99.7% Al minimum',                'MT', '76011010', 110),
  ('vs_al_primary_billet',  '_group_virgin_supply', 'virgin_supply', 'Primary aluminium billet',       'Extrusion billet, 6xxx/7xxx series',         'MT', '76012090', 111),
  ('vs_al_primary_wrod',    '_group_virgin_supply', 'virgin_supply', 'Primary aluminium wire rod',     '9.5 mm conductor-grade wire rod (EC-grade)', 'MT', '76041029', 112),
  ('vs_cu_cathode',         '_group_virgin_supply', 'virgin_supply', 'Copper cathode (LME Grade A)',   'LME Grade A, 99.99% Cu',                     'MT', '74031100', 113),
  ('vs_cu_cc_rod',          '_group_virgin_supply', 'virgin_supply', 'Copper CC rod (8 mm)',           'Continuous-cast copper rod for wire drawing','MT', '74071019', 114),
  ('vs_cu_wire',            '_group_virgin_supply', 'virgin_supply', 'Copper wire (drawn)',            'Enamelled / bare, various sizes',             'MT', '74081100', 115),
  ('vs_zn_shg_ingot',       '_group_virgin_supply', 'virgin_supply', 'Zinc SHG ingot (99.995%)',       'Special High Grade, electrolytic',           'MT', '79011100', 116),
  ('vs_zn_zamak',           '_group_virgin_supply', 'virgin_supply', 'Zinc Zamak alloy',               'Zamak-3/5 die-casting alloy',                'MT', '79012000', 117),
  ('vs_pb_ingot',           '_group_virgin_supply', 'virgin_supply', 'Primary lead ingot (99.97%+)',   'Refined lead for battery + alloy use',       'MT', '78011000', 118),
  ('vs_ni_primary',         '_group_virgin_supply', 'virgin_supply', 'Primary nickel metal',           'Class I briquettes / cut cathodes',          'MT', '75021000', 119),
  ('vs_sn_ingot',            '_group_virgin_supply','virgin_supply', 'Primary tin ingot',              '99.85%+ Sn, LME-deliverable',                'MT', '80011000', 120),
  ('vs_stainless_hrc',      '_group_virgin_supply', 'virgin_supply', 'Stainless HRC (304 / 316)',      'Hot-rolled coil',                            'MT', '72193500', 121),
  ('vs_stainless_crc',      '_group_virgin_supply', 'virgin_supply', 'Stainless CRC (200/300/400)',    'Cold-rolled coil / sheet',                   'MT', '72193300', 122),
  ('vs_ti_sponge',          '_group_virgin_supply', 'virgin_supply', 'Titanium sponge',                'Aerospace + defence grade (KMML / TTPL)',    'MT', '81082000', 123),
  ('vs_tio2_chloride',      '_group_virgin_supply', 'virgin_supply', 'TiO2 pigment — chloride route',  'KMML rutile-grade',                          'MT', '28230010', 124),
  ('vs_tio2_sulphate',      '_group_virgin_supply', 'virgin_supply', 'TiO2 pigment — sulphate route',  'TTPL anatase-grade',                         'MT', '28230010', 125),
  ('vs_zircon_sand',        '_group_virgin_supply', 'virgin_supply', 'Zircon sand',                    '66%+ ZrO2, ceramic / nuclear grade',         'MT', '26151000', 126),
  ('vs_rutile',             '_group_virgin_supply', 'virgin_supply', 'Rutile',                         '95%+ TiO2, natural rutile',                  'MT', '26140020', 127),
  ('vs_ilmenite',           '_group_virgin_supply', 'virgin_supply', 'Ilmenite',                       '52-54% TiO2, beach-sand mineral',            'MT', '26140010', 128),
  ('vs_monazite',           '_group_virgin_supply', 'virgin_supply', 'Monazite concentrate',           'Rare-earth + thorium bearing',               'MT', '26122000', 129),
  ('vs_reo',                '_group_virgin_supply', 'virgin_supply', 'Rare-earth oxides',              'Mixed + separated REOs (La, Ce, Nd, Pr…)',   'MT', '28469000', 130),
  ('vs_graphite_electrode_uhp','_group_virgin_supply','virgin_supply','Graphite electrode — UHP',      'Ultra-High-Power, 28"/32" dia (EAF)',        'MT', '85451100', 131),
  ('vs_graphite_electrode_hp', '_group_virgin_supply','virgin_supply','Graphite electrode — HP / RP',  'High-Power / Regular-Power',                 'MT', '85451100', 132),
  ('vs_flake_graphite',      '_group_virgin_supply','virgin_supply', 'Natural flake graphite',        '90%+ C, large flake',                        'MT', '25041010', 133),
  ('vs_ferro_manganese',    '_group_virgin_supply', 'virgin_supply', 'Ferro manganese',                'HC FeMn / MC FeMn / LC FeMn',                'MT', '72021100', 134),
  ('vs_silico_manganese',   '_group_virgin_supply', 'virgin_supply', 'Silico manganese',               'SiMn 60:14 / 65:16',                         'MT', '72023000', 135),
  ('vs_ferro_chrome',       '_group_virgin_supply', 'virgin_supply', 'Ferro chrome',                   'HC FeCr / LC FeCr (stainless-grade)',        'MT', '72024100', 136),
  ('vs_ferro_silicon',      '_group_virgin_supply', 'virgin_supply', 'Ferro silicon',                  'FeSi-70 / FeSi-75',                          'MT', '72022100', 137),
  ('vs_mn_ore',             '_group_virgin_supply', 'virgin_supply', 'Manganese ore',                  'MOIL 44-50% Mn, Balaghat / Chikla grades',   'MT', '26020000', 138),
  ('vs_chromite',           '_group_virgin_supply', 'virgin_supply', 'Chromite ore',                   '40-54% Cr2O3, Sukinda / Boula grades',       'MT', '26100000', 139),
  ('vs_bauxite',            '_group_virgin_supply', 'virgin_supply', 'Bauxite',                        '45%+ Al2O3, metallurgical grade',            'MT', '26060000', 140),
  ('vs_li_carbonate',       '_group_virgin_supply', 'virgin_supply', 'Lithium carbonate',              '99.5%+ battery grade (Li2CO3)',              'MT', '28369100', 141),
  ('vs_li_hydroxide',       '_group_virgin_supply', 'virgin_supply', 'Lithium hydroxide',              'LiOH·H2O, battery grade (NMC precursor)',    'MT', '28259000', 142)
ON CONFLICT (id) DO NOTHING;

-- ── (B) Secondary metals (recycled) ──────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, isri_grade, hsn_code, sort_order) VALUES
  ('ss_al_adc12',          '_group_secondary_supply', 'secondary_supply', 'Secondary aluminium ADC-12 alloy',  'Die-casting alloy from UBC / ICW / turnings',   'MT', NULL,        '76020090', 210),
  ('ss_al_lm6',            '_group_secondary_supply', 'secondary_supply', 'Secondary aluminium LM-6 alloy',    'Sand / gravity casting grade',                   'MT', NULL,        '76020090', 211),
  ('ss_al_lm25',           '_group_secondary_supply', 'secondary_supply', 'Secondary aluminium LM-25 alloy',   'Automotive casting grade',                       'MT', NULL,        '76020090', 212),
  ('ss_cu_secondary',      '_group_secondary_supply', 'secondary_supply', 'Secondary copper cathode',          'Refined from scrap, 99.98%+',                    'MT', NULL,        '74031900', 213),
  ('ss_cu_granules',       '_group_secondary_supply', 'secondary_supply', 'Copper granules (from ICW)',         'Granulator output, 99.5%+',                      'MT', NULL,        '74031900', 214),
  ('ss_pb_ingot',          '_group_secondary_supply', 'secondary_supply', 'Secondary lead ingot',              '99.97%+ from ULAB',                              'MT', NULL,        '78011000', 215),
  ('ss_pb_antimonial',     '_group_secondary_supply', 'secondary_supply', 'Antimonial lead alloy',             'Pb-Sb 2-8% for battery grids',                   'MT', NULL,        '78011000', 216),
  ('ss_pb_oxide',          '_group_secondary_supply', 'secondary_supply', 'Lead oxide (litharge / red lead)',  'Battery-grade PbO / Pb3O4',                      'MT', NULL,        '28249000', 217),
  ('ss_zn_alloy',          '_group_secondary_supply', 'secondary_supply', 'Secondary zinc alloy',              'From dross remelt',                              'MT', NULL,        '79012000', 218),
  ('ss_zn_oxide',          '_group_secondary_supply', 'secondary_supply', 'Zinc oxide (from dross)',           '99.5%+ ZnO for rubber / ceramics / feed',        'MT', NULL,        '28170010', 219),
  ('ss_steel_eaf_billet',  '_group_secondary_supply', 'secondary_supply', 'EAF mild steel billet',             'MS billet from scrap-fed EAF',                   'MT', NULL,        '72071190', 220),
  ('ss_steel_eaf_alloy',   '_group_secondary_supply', 'secondary_supply', 'EAF alloy / special steel',         'From scrap-fed EAF',                             'MT', NULL,        '72072090', 221),
  ('ss_rpet_flakes',       '_group_secondary_supply', 'secondary_supply', 'rPET flakes',                       'Bottle-grade washed flakes',                     'MT', NULL,        '39151000', 222),
  ('ss_rpet_granules',     '_group_secondary_supply', 'secondary_supply', 'rPET granules',                     'Extruded granules for sheet / strapping',        'MT', NULL,        '39076100', 223),
  ('ss_rpet_fibre',        '_group_secondary_supply', 'secondary_supply', 'rPET fibre (RPSF)',                 'Recycled polyester staple fibre',                'MT', NULL,        '55032000', 224),
  ('ss_cam_lfp_recovered', '_group_secondary_supply', 'secondary_supply', 'Recovered LFP CAM',                 'Regenerated from black mass',                    'MT', NULL,        '28469000', 225),
  ('ss_cam_nmc_recovered', '_group_secondary_supply', 'secondary_supply', 'Recovered NMC CAM',                 'Regenerated from black mass',                    'MT', NULL,        '28469000', 226),
  ('ss_li_hydroxide_recov','_group_secondary_supply', 'secondary_supply', 'Recovered lithium hydroxide',       'Hydromet output from black mass',                'MT', NULL,        '28259000', 227),
  ('ss_ni_sulphate_recov', '_group_secondary_supply', 'secondary_supply', 'Recovered nickel sulphate',         'NiSO4·6H2O from hydromet',                        'MT', NULL,        '28332400', 228),
  ('ss_co_sulphate_recov', '_group_secondary_supply', 'secondary_supply', 'Recovered cobalt sulphate',         'CoSO4·7H2O from hydromet',                        'MT', NULL,        '28332990', 229)
ON CONFLICT (id) DO NOTHING;

-- ── (C) Battery chain intermediates ──────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, hsn_code, sort_order) VALUES
  ('ib_cell_18650',        '_group_intermediate_battery', 'intermediate_battery', 'Li-ion cell — 18650',       'Cylindrical, 2.5-3.5 Ah',               'units', '85076000', 310),
  ('ib_cell_21700',        '_group_intermediate_battery', 'intermediate_battery', 'Li-ion cell — 21700',       'Cylindrical, 4-5 Ah',                   'units', '85076000', 311),
  ('ib_cell_pouch',        '_group_intermediate_battery', 'intermediate_battery', 'Li-ion pouch cell',         'Custom-form EV/ESS pouch',              'units', '85076000', 312),
  ('ib_cell_prismatic',    '_group_intermediate_battery', 'intermediate_battery', 'Li-ion prismatic cell',     'Rigid aluminium-can prismatic',         'units', '85076000', 313),
  ('ib_pack_2w',           '_group_intermediate_battery', 'intermediate_battery', 'EV battery pack — 2-wheeler','2-3 kWh, BMS + housing',               'units', '85076000', 314),
  ('ib_pack_4w',           '_group_intermediate_battery', 'intermediate_battery', 'EV battery pack — 4-wheeler','20-100 kWh, full BMS',                 'units', '85076000', 315),
  ('ib_pack_ess',          '_group_intermediate_battery', 'intermediate_battery', 'ESS battery pack',          'Stationary storage / grid-scale',       'units', '85076000', 316),
  ('ib_ev_motor',          '_group_intermediate_battery', 'intermediate_battery', 'EV motor + drive unit',     'PMSM / induction, 20-200 kW',           'units', '85014090', 317),
  ('ib_bms',               '_group_intermediate_battery', 'intermediate_battery', 'Battery management system', 'BMS board + pack-level electronics',    'units', '85389000', 318),
  ('ib_cam_lfp',           '_group_intermediate_battery', 'intermediate_battery', 'CAM — LFP',                 'LiFePO4 cathode powder',                'MT',    '28469000', 319),
  ('ib_cam_nmc',           '_group_intermediate_battery', 'intermediate_battery', 'CAM — NMC 811 / 622',       'Ni-rich NMC cathode powder',            'MT',    '28469000', 320),
  ('ib_cam_nca',           '_group_intermediate_battery', 'intermediate_battery', 'CAM — NCA',                 'LiNi0.8Co0.15Al0.05O2',                 'MT',    '28469000', 321),
  ('ib_anode_graphite',    '_group_intermediate_battery', 'intermediate_battery', 'Anode — natural / synthetic graphite','Spherical graphite, battery grade','MT','38011000', 322),
  ('ib_anode_si_c',        '_group_intermediate_battery', 'intermediate_battery', 'Anode — silicon-carbon',    'SiC composite, next-gen anode',         'MT',    '38011090', 323),
  ('ib_electrolyte',       '_group_intermediate_battery', 'intermediate_battery', 'Electrolyte (LiPF6 based)', 'Battery-grade liquid electrolyte',      'MT',    '38249900', 324),
  ('ib_cu_foil_battery',   '_group_intermediate_battery', 'intermediate_battery', 'Copper foil — battery grade','4.5-8 μm, current collector',          'MT',    '74102110', 325),
  ('ib_al_foil_battery',   '_group_intermediate_battery', 'intermediate_battery', 'Aluminium foil — battery grade','12-20 μm cathode current collector','MT',    '76071990', 326),
  ('ib_separator_film',    '_group_intermediate_battery', 'intermediate_battery', 'Separator film',            'PE / PP microporous separator',         'M²',    '39209990', 327)
ON CONFLICT (id) DO NOTHING;

-- ── (D) End-of-life feedstock ────────────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, isri_grade, hsn_code, sort_order) VALUES
  ('ef_eol_liion_pack',    '_group_eol_feedstock', 'eol_feedstock', 'EOL Li-ion battery pack',          'EV, ESS, or power-tool decommissioned packs',                 'MT',    NULL,         '85414200', 410),
  ('ef_eol_liion_cells',   '_group_eol_feedstock', 'eol_feedstock', 'EOL Li-ion loose cells',           '18650/21700/pouch cells post-pack-disassembly',               'MT',    NULL,         '85414200', 411),
  ('ef_ulab',              '_group_eol_feedstock', 'eol_feedstock', 'Used lead-acid battery (ULAB)',    'Automotive + inverter + UPS batteries',                       'MT',    NULL,         '85488000', 412),
  ('ef_ewaste_computers',  '_group_eol_feedstock', 'eol_feedstock', 'E-waste — laptops + desktops',     'Full CPUs, motherboards, HDDs, monitors',                     'MT',    NULL,         '85491100', 413),
  ('ef_ewaste_mobiles',    '_group_eol_feedstock', 'eol_feedstock', 'E-waste — mobile phones + PCBs',   'Mobile handsets + bare PCBs',                                 'MT',    NULL,         '85491100', 414),
  ('ef_ewaste_crt',        '_group_eol_feedstock', 'eol_feedstock', 'E-waste — CRT + monitors',         'Cathode-ray tube TVs + monitors (hazardous — leaded glass)',  'MT',    NULL,         '85492900', 415),
  ('ef_ewaste_white',      '_group_eol_feedstock', 'eol_feedstock', 'E-waste — white goods',            'ACs, refrigerators, washing machines',                         'MT',    NULL,         '85492900', 416),
  ('ef_ewaste_solar',      '_group_eol_feedstock', 'eol_feedstock', 'EOL solar panels',                 'Silicon + thin-film modules',                                  'MT',    NULL,         '85414200', 417),
  ('ef_elv',               '_group_eol_feedstock', 'eol_feedstock', 'End-of-life vehicles (ELV)',       '2W/3W/4W past scrappage age',                                  'units', NULL,         '87040000', 418),
  ('ef_hms',               '_group_eol_feedstock', 'eol_feedstock', 'Heavy melt steel (HMS 1&2)',       'ISRI code 200/201 heavy-melt scrap',                           'MT',    '200/201',    '72044900', 419),
  ('ef_icw',               '_group_eol_feedstock', 'eol_feedstock', 'Insulated copper wire (ICW)',      'ISRI Druid / Taint-Tabor / Dream',                             'MT',    'Druid',      '74040022', 420),
  ('ef_brass_turnings',    '_group_eol_feedstock', 'eol_feedstock', 'Brass turnings + borings',         'ISRI Night (70/30) / Noble',                                   'MT',    'Night',      '74040022', 421),
  ('ef_ubc',               '_group_eol_feedstock', 'eol_feedstock', 'Aluminium UBC cans',               'Used Beverage Cans, baled',                                    'MT',    'Taldon',     '76020010', 422),
  ('ef_al_turnings',       '_group_eol_feedstock', 'eol_feedstock', 'Aluminium turnings',               'ISRI Telic / Tense / Teens',                                   'MT',    'Telic',      '76020010', 423),
  ('ef_ss_scrap',          '_group_eol_feedstock', 'eol_feedstock', 'Stainless steel scrap',            'ISRI 304 SS Solids / 316 SS Solids',                           'MT',    '304 solids', '72041000', 424),
  ('ef_cat_converter',     '_group_eol_feedstock', 'eol_feedstock', 'Automotive catalytic converters',  'Foil + ceramic core (Pt/Pd/Rh)',                               'unit',  NULL,         '87089900', 425),
  ('ef_radiator_cores',    '_group_eol_feedstock', 'eol_feedstock', 'Radiator cores (Cu/Al)',           'Mixed Cu-Al radiator cores',                                   'MT',    'Rabbit',     '74040022', 426)
ON CONFLICT (id) DO NOTHING;

-- ── (E) Byproducts ───────────────────────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, hsn_code, sort_order) VALUES
  ('bp_al_dross',          '_group_byproduct', 'byproduct', 'Aluminium dross',              'White + black dross from smelter/remelter',     'MT', '26201500', 510),
  ('bp_zn_dross',          '_group_byproduct', 'byproduct', 'Zinc dross / ash',              'Galvanising dross + skimmings',                 'MT', '26201900', 511),
  ('bp_cu_slag',           '_group_byproduct', 'byproduct', 'Copper slag',                   'Smelter slag (Fe-silicate matrix)',            'MT', '26203000', 512),
  ('bp_mill_scale',        '_group_byproduct', 'byproduct', 'Steel mill scale',              'Iron oxide flakes from hot rolling',           'MT', '26190090', 513),
  ('bp_red_mud',           '_group_byproduct', 'byproduct', 'Red mud (bauxite residue)',    'Alumina refinery residue',                     'MT', '26206000', 514),
  ('bp_fly_ash',           '_group_byproduct', 'byproduct', 'Fly ash',                      'Coal / CFBC ash',                              'MT', '26210090', 515),
  ('bp_phosphogypsum',     '_group_byproduct', 'byproduct', 'Phosphogypsum',                'Phosphoric-acid byproduct',                    'MT', '25201020', 516),
  ('bp_black_mass',        '_group_byproduct', 'byproduct', 'Black mass (Li-ion)',          'Shredder output, pre-hydromet intermediate',   'MT', '28469000', 517),
  ('bp_foundry_slag',      '_group_byproduct', 'byproduct', 'Foundry slag',                 'Cupola + EAF slag, various alloy grades',      'MT', '26190090', 518)
ON CONFLICT (id) DO NOTHING;

-- ── (F) Plastics / paper / tyres / textiles ──────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, hsn_code, sort_order) VALUES
  ('pp_rpet_granules',     '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rPET granules',          'Food-grade + non-food-grade',                'MT', '39076100', 610),
  ('pp_rpp_granules',      '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rPP granules',           'Recycled polypropylene',                     'MT', '39021000', 611),
  ('pp_rhdpe',             '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rHDPE granules',         'Recycled high-density polyethylene',         'MT', '39012000', 612),
  ('pp_rldpe',             '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rLDPE granules',         'Recycled low-density polyethylene',          'MT', '39011000', 613),
  ('pp_rpvc',              '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rPVC granules',          'Recycled polyvinyl chloride',                'MT', '39041000', 614),
  ('pp_kraft',             '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Recycled kraft paper',   'Brown liner + packaging grade',              'MT', '48043100', 615),
  ('pp_duplex',            '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Recycled duplex board',  'Multi-ply packaging board',                  'MT', '48051100', 616),
  ('pp_newsprint',         '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Recycled newsprint',     'De-inked newsprint grade',                   'MT', '48010000', 617),
  ('pp_eol_tyres',         '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'End-of-life tyres',      'Baled + shredded EOL tyres',                 'MT', '40040090', 618),
  ('pp_recycled_rubber',   '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Recycled rubber crumb',  'Tyre shredder output (5-30 mm)',             'MT', '40040090', 619),
  ('pp_pyrolysis_oil',     '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Pyrolysis oil',          'Tyre / plastic pyrolysis liquid',            'MT', '27102000', 620),
  ('pp_recovered_cblack',  '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Recovered carbon black', 'Tyre-pyrolysis rCB',                         'MT', '28030010', 621),
  ('pp_textile_waste',     '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'Post-consumer textile',  'Cotton / polyester / blends',                'MT', '63100090', 622),
  ('pp_rpet_spun_yarn',    '_group_plastics_paper_tyres', 'plastics_paper_tyres', 'rPET spun yarn',         'Textile-grade yarn from rPET fibre',         'MT', '55109000', 623)
ON CONFLICT (id) DO NOTHING;

-- ── (G) Consumables & reagents ───────────────────────────────────────────
INSERT INTO item_categories (id, parent_id, group_code, label, description, typical_unit, hsn_code, sort_order) VALUES
  ('cm_flux_smelting',     '_group_consumable', 'consumable', 'Smelting flux (Al / Zn / Pb)',   'Chloride / fluoride-based fluxes',            'MT', '38249990', 710),
  ('cm_refractory_bricks', '_group_consumable', 'consumable', 'Refractory bricks',              'Magnesia / alumina / SiC bricks',             'MT', '69022000', 711),
  ('cm_h2so4',             '_group_consumable', 'consumable', 'Sulphuric acid (H2SO4)',         'Hydromet leaching reagent, 98%',              'MT', '28070010', 712),
  ('cm_hcl',               '_group_consumable', 'consumable', 'Hydrochloric acid (HCl)',        '30-33% commercial grade',                    'MT', '28061000', 713),
  ('cm_naoh',              '_group_consumable', 'consumable', 'Caustic soda (NaOH)',            'Solid flakes / 50% liquid',                  'MT', '28151100', 714),
  ('cm_nh4oh',             '_group_consumable', 'consumable', 'Ammonia solution (NH4OH)',       '25% NH3 solution for co-precipitation',       'MT', '28141000', 715),
  ('cm_cyanex',            '_group_consumable', 'consumable', 'Cyanex 272 extractant',          'Solvent extractant for Co/Ni/Mn separation',  'MT', '38249990', 716),
  ('cm_d2ehpa',            '_group_consumable', 'consumable', 'D2EHPA extractant',              'Zn/Co/Ni solvent extractant',                 'MT', '38249990', 717),
  ('cm_lix',               '_group_consumable', 'consumable', 'LIX series copper extractant',   'LIX-84 / LIX-622 copper SX',                  'MT', '38249990', 718),
  ('cm_carbon_anode',      '_group_consumable', 'consumable', 'Prebaked carbon anode',          'Hall-Héroult cell anode (aluminium)',         'MT', '85451100', 719),
  ('cm_feso4',             '_group_consumable', 'consumable', 'Ferrous sulphate (FeSO4)',       'Coagulant + iron-precursor for LFP CAM',      'MT', '28332100', 720),
  ('cm_mnso4',             '_group_consumable', 'consumable', 'Manganese sulphate (MnSO4)',     'NMC precursor + fertilizer',                 'MT', '28332990', 721)
ON CONFLICT (id) DO NOTHING;

-- Done — total rows inserted: 7 group parents + 33 virgin + 20 secondary +
-- 18 battery intermediates + 17 EOL feedstock + 9 byproducts + 14 plastics
-- /paper/tyres + 12 consumables = 130 categories.
