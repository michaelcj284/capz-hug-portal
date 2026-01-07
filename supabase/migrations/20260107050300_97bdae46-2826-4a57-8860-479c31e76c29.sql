-- Add check_out_time column to general_attendance
ALTER TABLE public.general_attendance 
ADD COLUMN check_out_time timestamp with time zone DEFAULT NULL;

-- Add RLS policy for updating check_out_time
CREATE POLICY "Users can update their own check_out_time"
ON public.general_attendance
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy for admins to update attendance
CREATE POLICY "Admins can update attendance"
ON public.general_attendance
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for staff to update attendance  
CREATE POLICY "Staff can update attendance"
ON public.general_attendance
FOR UPDATE
USING (has_role(auth.uid(), 'staff'::app_role));