import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  user_id: string;
  user_type: string;
  attendance_date: string;
  check_in_time: string;
  qr_code_name: string;
  user_name: string;
  user_email: string;
}

const AttendanceReport = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    
    // Get general attendance records
    let query = supabase
      .from('general_attendance')
      .select(`
        id,
        user_id,
        user_type,
        attendance_date,
        check_in_time,
        general_qr_codes:qr_code_id (name)
      `)
      .order('check_in_time', { ascending: false });

    if (dateFilter) {
      query = query.eq('attendance_date', dateFilter);
    }

    if (userTypeFilter && userTypeFilter !== 'all') {
      query = query.eq('user_type', userTypeFilter);
    }

    const { data: attendanceData, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      setLoading(false);
      return;
    }

    // Get user profiles for all unique user_ids
    const userIds = [...new Set(attendanceData?.map(r => r.user_id) || [])];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const formattedRecords: AttendanceRecord[] = (attendanceData || []).map(record => ({
      id: record.id,
      user_id: record.user_id,
      user_type: record.user_type,
      attendance_date: record.attendance_date,
      check_in_time: record.check_in_time,
      qr_code_name: (record.general_qr_codes as any)?.name || 'Unknown',
      user_name: profileMap.get(record.user_id)?.full_name || 'Unknown',
      user_email: profileMap.get(record.user_id)?.email || 'Unknown',
    }));

    setRecords(formattedRecords);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [dateFilter, userTypeFilter]);

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Name', 'Email', 'User Type', 'QR Code'];
    const csvData = records.map(record => [
      record.attendance_date,
      format(new Date(record.check_in_time), 'HH:mm:ss'),
      record.user_name,
      record.user_email,
      record.user_type,
      record.qr_code_name,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${dateFilter || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'instructor':
        return <Badge variant="default">Instructor</Badge>;
      case 'student':
        return <Badge variant="outline">Student</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Attendance Report</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-auto"
              placeholder="Filter by date"
            />
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAttendanceRecords}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} disabled={records.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading attendance records...</div>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No attendance records found.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {records.length} record{records.length !== 1 ? 's' : ''}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>QR Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.attendance_date}</TableCell>
                    <TableCell>{format(new Date(record.check_in_time), 'HH:mm:ss')}</TableCell>
                    <TableCell>{record.user_name}</TableCell>
                    <TableCell>{record.user_email}</TableCell>
                    <TableCell>{getUserTypeBadge(record.user_type)}</TableCell>
                    <TableCell>{record.qr_code_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReport;
