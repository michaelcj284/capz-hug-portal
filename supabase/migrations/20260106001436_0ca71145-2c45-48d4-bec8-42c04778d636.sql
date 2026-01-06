-- Create function to delete auth user when their role is deleted
CREATE OR REPLACE FUNCTION public.handle_role_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete related records first
  DELETE FROM public.students WHERE user_id = OLD.user_id;
  DELETE FROM public.staff WHERE user_id = OLD.user_id;
  DELETE FROM public.profiles WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to handle role deletion
DROP TRIGGER IF EXISTS on_role_deleted ON public.user_roles;
CREATE TRIGGER on_role_deleted
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_deletion();