import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StudentCoursesProps {
  studentId?: string;
}

interface Enrollment {
  id: string;
  enrollment_date: string;
  status: string;
  course: {
    name: string;
    description: string;
    duration_weeks: number;
  };
}

const StudentCourses = ({ studentId }: StudentCoursesProps) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchEnrollments();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchEnrollments = async () => {
    if (!studentId) return;
    
    const { data, error } = await supabase
      .from('student_courses')
      .select(`
        *,
        course:courses(name, description, duration_weeks)
      `)
      .eq('student_id', studentId)
      .order('enrollment_date', { ascending: false });

    if (!error && data) {
      setEnrollments(data as any);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }
  
  if (!studentId) {
    return <div className="text-center py-8 text-muted-foreground">Student record not found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">You are not enrolled in any courses yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{enrollment.course?.name || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{enrollment.course?.description || 'No description'}</TableCell>
                  <TableCell>{enrollment.course?.duration_weeks || 0} weeks</TableCell>
                  <TableCell>{new Date(enrollment.enrollment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCourses;
