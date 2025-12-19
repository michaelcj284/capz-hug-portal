-- Update RLS policies for courses - instructors can manage their assigned courses
CREATE POLICY "Instructors can manage assigned courses"
ON public.courses
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND instructor_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

-- Update RLS policies for class_schedules - instructors can manage schedules for their courses
CREATE POLICY "Instructors can manage schedules for their courses"
ON public.class_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND course_id IN (
    SELECT c.id FROM courses c
    JOIN staff s ON c.instructor_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Instructors can view students (but not insert/delete - handled by policy type)
CREATE POLICY "Instructors can view students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

-- Instructors can view student enrollments for their courses
CREATE POLICY "Instructors can view enrollments for their courses"
ON public.student_courses
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND course_id IN (
    SELECT c.id FROM courses c
    JOIN staff s ON c.instructor_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Instructors can view and manage attendance for their courses
CREATE POLICY "Instructors can manage attendance for their courses"
ON public.attendance
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND course_id IN (
    SELECT c.id FROM courses c
    JOIN staff s ON c.instructor_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Instructors can view exams for their courses
CREATE POLICY "Instructors can view exams for their courses"
ON public.exams
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND course_id IN (
    SELECT c.id FROM courses c
    JOIN staff s ON c.instructor_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Instructors can view exam results for their courses
CREATE POLICY "Instructors can view results for their courses"
ON public.exam_results
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND exam_id IN (
    SELECT e.id FROM exams e
    JOIN courses c ON e.course_id = c.id
    JOIN staff s ON c.instructor_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Instructors can view profiles (for student names)
CREATE POLICY "Instructors can view profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));