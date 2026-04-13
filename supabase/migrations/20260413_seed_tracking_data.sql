-- Seed tracking data scraped from ARC for B4002064885
UPDATE shipments
SET
  tracking_data = '{
    "carrier": "ARC",
    "tracking_no": "B4002064885",
    "status": "in_transit",
    "origin": "VAPI",
    "destination": "MADHAVARAM-TC",
    "booked_date": "10-Apr-2026",
    "current_status": "CONSIGNMENT LIFTED FROM LOCAL BOOKING STATION (Door Dly (With CC Attached))",
    "delivery_type": "Door Dly (With CC Attached)",
    "weight": "600.00",
    "packages": "1",
    "events": [
      {
        "date": "10-Apr-2026",
        "time": "",
        "location": "PLOT NO. 222, VIBRANT BUSINESS PARK, NH8, GIDC, DIST. VALSAD, Vapi, GUJARAT, 396195",
        "status": "CONSIGNMENT LIFTED FROM LOCAL BOOKING STATION",
        "remarks": ""
      }
    ],
    "fetched_at": "2026-04-13T20:58:00.000Z"
  }'::jsonb,
  tracking_updated_at = NOW()
WHERE tracking_no = 'B4002064885';
