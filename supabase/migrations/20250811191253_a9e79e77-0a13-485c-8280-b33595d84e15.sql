-- Create storage bucket for form files
INSERT INTO storage.buckets (id, name, public) VALUES ('form-files', 'form-files', false);

-- Create form_submissions table
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Executive data
  executive_name TEXT NOT NULL,
  executive_cpf TEXT NOT NULL,
  executive_rg TEXT,
  executive_email TEXT NOT NULL,
  executive_phone TEXT,
  
  -- Company data
  company_name TEXT NOT NULL,
  company_cnpj TEXT NOT NULL,
  company_ie TEXT,
  company_im TEXT,
  company_website TEXT,
  company_type TEXT NOT NULL,
  company_activity TEXT NOT NULL,
  
  -- Contact data
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Address data
  address_cep TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  
  -- Additional address
  has_additional_address BOOLEAN DEFAULT false,
  additional_cep TEXT,
  additional_street TEXT,
  additional_number TEXT,
  additional_complement TEXT,
  additional_neighborhood TEXT,
  additional_city TEXT,
  additional_state TEXT,
  
  -- Banking data
  bank_code TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_pix TEXT,
  
  -- Commercial data
  commercial_references TEXT,
  
  -- Sales segment
  sales_segment TEXT[] DEFAULT '{}',
  
  -- Network data
  network_type TEXT,
  network_size TEXT,
  
  -- Fiscal data
  fiscal_regime TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_files table for tracking uploaded files
CREATE TABLE public.form_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  field_name TEXT NOT NULL, -- Which form field this file belongs to
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for form submission)
CREATE POLICY "Allow form submissions" ON public.form_submissions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow file uploads for submissions" ON public.form_files
FOR INSERT WITH CHECK (true);

-- Storage policies for form files
CREATE POLICY "Allow form file uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'form-files');

CREATE POLICY "Allow form file access" ON storage.objects
FOR SELECT USING (bucket_id = 'form-files');

-- Create update trigger for form_submissions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_submissions_updated_at
BEFORE UPDATE ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();