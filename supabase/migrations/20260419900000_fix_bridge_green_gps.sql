-- Bridge Green Upcycle GPS correction
-- Nominatim couldn't parse the compound address (3 facilities in one row)
-- and returned Tamil Nadu centroid (~11.33,78.61). Pin was mis-located.
-- Using the primary mechanical plant at Gummidipundi, Thiruvallur.

UPDATE recyclers
  SET latitude = 13.4088, longitude = 80.1072
  WHERE recycler_code = 'BWM-TN-002';
