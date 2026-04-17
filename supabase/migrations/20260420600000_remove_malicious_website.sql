-- Security: NFMR-DD-014 (NICO Extrusion Pvt Ltd) had website http://nicoex.com
-- which is now flagged by the hosting provider as malicious (returns
-- HTTP 403 "Malicious content") and by Norton URL-Blacklist. The domain
-- appears to be compromised or expired / parked on a bad IP.
-- Remove the URL from the public-facing row. Company stays listed
-- based on its MoEF / NFMR authorisation — only the unsafe link is
-- scrubbed.

UPDATE recyclers SET
  website = NULL,
  notes = COALESCE(notes || ' · ', '') ||
          'Website http://nicoex.com removed — flagged as malicious content by hosting provider (HTTP 403 Malicious content) and Norton URL blacklist. Domain may be compromised or expired. Company remains listed based on MoEF/NFMR authorisation.'
  WHERE recycler_code = 'NFMR-DD-014';
