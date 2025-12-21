-- Enable realtime for students, staff, and general_attendance tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_qr_codes;