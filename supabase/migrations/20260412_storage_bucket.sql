-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800,  -- 50MB max
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/msword',
        'text/csv', 'application/zip', 'application/dwg', 'application/dxf',
        'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;
