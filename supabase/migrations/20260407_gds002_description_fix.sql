-- ============================================================
-- GDS-002: Remove AutoREX reference from description
-- Sensors are for plant operation; AutoREX compatibility is
-- incidental — customer has not agreed to AutoREX as of now
-- ============================================================

UPDATE orders SET
  description = 'Supply of Process Instruments and Sensors for Plant Monitoring and Control Operations'
WHERE order_no = 'GDS-002';

-- Update individual item descriptions in items JSON
UPDATE orders SET
  items = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    items,
    '{0,description}', '"Temperature Transmitter with Thermocouple\nFor process temperature monitoring at plant"'::jsonb
  ),
    '{1,description}', '"Pressure Transmitter (0–4 Bar)\nFor process pressure monitoring at plant"'::jsonb
  ),
    '{2,description}', '"Float & Board Level Indicator\nFor tank/vessel level monitoring at plant"'::jsonb
  ),
    '{3,description}', '"Infrared Industrial Thermometer (UT 300S)\nFor surface temperature measurement at plant"'::jsonb
  )
WHERE order_no = 'GDS-002';
