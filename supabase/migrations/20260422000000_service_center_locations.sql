CREATE TABLE IF NOT EXISTS service_center_locations (
  location_id bigserial PRIMARY KEY,
  center_id   bigint NOT NULL REFERENCES service_centers(center_id) ON DELETE CASCADE,
  street_address text NOT NULL DEFAULT '',
  city           text NOT NULL DEFAULT '',
  district       text NOT NULL DEFAULT '',
  province       text NOT NULL DEFAULT '',
  postal_code    text,
  country        text NOT NULL DEFAULT 'Sri Lanka',
  latitude       double precision,
  longitude      double precision,
  google_maps_url text,
  landmark       text,
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (center_id)
);
