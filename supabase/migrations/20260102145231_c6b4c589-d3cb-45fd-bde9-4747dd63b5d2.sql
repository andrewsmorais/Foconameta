-- Create public bucket for static pages (checkout, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-pages', 'public-pages', true)
ON CONFLICT (id) DO NOTHING;