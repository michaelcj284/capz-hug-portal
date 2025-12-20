-- Create table for general attendance QR codes
CREATE TABLE public.general_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create general attendance table for all user types
CREATE TABLE public.general_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  qr_code_id UUID NOT NULL REFERENCES public.general_qr_codes(id),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, qr_code_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.general_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for general_qr_codes
CREATE POLICY "Admins can manage general QR codes"
  ON public.general_qr_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view active QR codes"
  ON public.general_qr_codes FOR SELECT
  USING (is_active = true);

-- Policies for general_attendance
CREATE POLICY "Users can insert their own attendance"
  ON public.general_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attendance"
  ON public.general_attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON public.general_attendance FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all attendance"
  ON public.general_attendance FOR SELECT
  USING (public.has_role(auth.uid(), 'staff'));