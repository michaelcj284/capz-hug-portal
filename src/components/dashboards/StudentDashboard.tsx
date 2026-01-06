import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, QrCode, CheckCircle, Settings, Award, Bell, LayoutDashboard } from 'lucide-react';
import QRCodeScanner from '@/components/attendance/QRCodeScanner';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import StudentResults from '@/components/student/StudentResults';
import StudentAttendance from '@/components/student/StudentAttendance';
import StudentCourses from '@/components/student/StudentCourses';
import StudentNotifications from '@/components/student/StudentNotifications';
import StudentCertificates from '@/components/student/StudentCertificates';
import ChangePassword from '@/components/profile/ChangePassword';
import DashboardLayout from './DashboardLayout';

const navItems = [
  { title: 'Dashboard', value: 'dashboard', icon: LayoutDashboard },
  { title: 'Courses', value: 'courses', icon: BookOpen },
  { title: 'Results', value: 'results', icon: CheckCircle },
  { title: 'Attendance', value: 'attendance', icon: Calendar },
  { title: 'Scan QR', value: 'scan', icon: QrCode },
  { title: 'Certificates', value: 'certificates', icon: Award },
  { title: 'Notifications', value: 'notifications', icon: Bell },
  { title: 'Settings', value: 'settings', icon: Settings },
];

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    upcomingExams: 0,
    attendanceRate: 0,
  });
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchStudentData();
    }
  }, [profile]);

  useEffect(() => {
    if (!studentData?.id) return;

    const channel = supabase
      .channel('dashboard-attendance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${studentData.id}`,
        },
        () => {
          fetchStats(studentData.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentData?.id]);

  const fetchStats = async (studentId: string) => {
    const [enrollmentsResult, attendanceResult] = await Promise.all([
      supabase.from('student_courses').select('id', { count: 'exact' }).eq('student_id', studentId),
      supabase.from('attendance').select('status').eq('student_id', studentId),
    ]);

    const totalAttendance = attendanceResult.data?.length || 0;
    const presentCount = attendanceResult.data?.filter((a: any) => a.status === 'present').length || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    setStats({
      enrolledCourses: enrollmentsResult.count || 0,
      upcomingExams: 0,
      attendanceRate,
    });
  };

  const fetchStudentData = async () => {
    if (!profile?.id) return;

    try {
      const { data: student, error } = await supabase
        .from('students')
        .select(`
          *,
          registered_by_profile:profiles!registered_by (
            full_name
          )
        `)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!error && student) {
        setStudentData(student);
        fetchStats(student.id);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingExams}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>
        );
      case 'courses':
        return <StudentCourses studentId={studentData?.id} />;
      case 'results':
        return <StudentResults studentId={studentData?.id} />;
      case 'attendance':
        return <StudentAttendance studentId={studentData?.id} />;
      case 'scan':
        return (
          <div className="space-y-6">
            <QRCodeScanner studentId={studentData?.id} />
            <GeneralAttendanceScanner userType="student" />
          </div>
        );
      case 'certificates':
        return <StudentCertificates studentId={studentData?.id} />;
      case 'notifications':
        return <StudentNotifications />;
      case 'settings':
        return <ChangePassword />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      userName={profile?.full_name || ''}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={signOut}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
