import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  student_number: string | null;
  enrollment_date: string | null;
  user_id: string;
  full_name: string | null;
  email: string;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    // First get all users with student role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (roleError || !roleData) {
      console.error('Error fetching student roles:', roleError);
      setLoading(false);
      return;
    }

    const userIds = roleData.map(r => r.user_id);

    if (userIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .in('id', userIds)
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      setLoading(false);
      return;
    }

    // Get student records if they exist
    const { data: studentRecords } = await supabase
      .from('students')
      .select('user_id, student_number, enrollment_date')
      .in('user_id', userIds);

    const studentMap = new Map(studentRecords?.map(s => [s.user_id, s]) || []);

    const studentList: Student[] = (profiles || []).map(p => {
      const studentRecord = studentMap.get(p.id);
      return {
        id: p.id,
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        student_number: studentRecord?.student_number || null,
        enrollment_date: studentRecord?.enrollment_date || p.created_at,
      };
    });

    setStudents(studentList);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();

    // Set up real-time subscription for user_roles changes
    const channel = supabase
      .channel('student-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchStudents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Management</CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No students registered yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono">{student.student_number || 'N/A'}</TableCell>
                  <TableCell>{student.full_name || 'N/A'}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
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

export default StudentManagement;
