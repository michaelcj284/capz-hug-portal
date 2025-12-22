import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StudentAttendanceProps {
  studentId?: string;
}

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  course: {
    name: string;
  };
}

const StudentAttendance = ({ studentId }: StudentAttendanceProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchAttendance();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        course:courses(name)
      `)
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });

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

  // Calculate stats
  const totalRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Attendance Rate</p>
          <p className="text-3xl font-bold">{attendanceRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            {presentCount} present out of {totalRecords} classes
          </p>
        </div>

        {attendance.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
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

export default StudentAttendance;
