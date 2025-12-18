import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Attendance {
  id: string;
  attendance_date: string;
  status: string;
  student: {
    student_number: string;
    profiles: {
      full_name: string;
    };
  };
  course: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
}

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedCourse]);

  const fetchData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('id, name');
    if (coursesData) setCourses(coursesData);
    await fetchAttendance();
  };

  const fetchAttendance = async () => {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(student_number, profiles:user_id(full_name)),
        course:courses(name)
      `)
      .order('attendance_date', { ascending: false });

    if (selectedCourse !== 'all') {
      query = query.eq('course_id', selectedCourse);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAttendance(data as any);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading attendance...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Management</CardTitle>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {attendance.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Student Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
                  <TableCell>{(record.student as any)?.profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell className="font-mono">{record.student?.student_number || 'N/A'}</TableCell>
                  <TableCell>{record.course?.name || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceManagement;
