import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, QrCode, Users, Settings, LayoutDashboard } from 'lucide-react';
import CourseManagement from '@/components/management/CourseManagement';
import ExamManagement from '@/components/management/ExamManagement';
import AttendanceManagement from '@/components/management/AttendanceManagement';
import QRCodeGenerator from '@/components/attendance/QRCodeGenerator';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import ClassScheduling from '@/components/management/ClassScheduling';
import ChangePassword from '@/components/profile/ChangePassword';
import DashboardLayout from './DashboardLayout';

const navItems = [
  { title: 'Dashboard', value: 'dashboard', icon: LayoutDashboard },
  { title: 'Courses', value: 'courses', icon: BookOpen },
  { title: 'Exams', value: 'exams', icon: Calendar },
  { title: 'Attendance', value: 'attendance', icon: QrCode },
  { title: 'QR Code', value: 'qrcode', icon: QrCode },
  { title: 'Mark Attendance', value: 'my-attendance', icon: QrCode },
  { title: 'Schedule', value: 'schedule', icon: Calendar },
  { title: 'Settings', value: 'settings', icon: Settings },
];

const StaffDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    myCourses: 0,
    upcomingExams: 0,
    studentsToday: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (!staffData) return;

      const [coursesResult, examsResult] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact' }).eq('instructor_id', staffData.id),
        supabase.from('exams')
          .select('id', { count: 'exact' })
          .gte('exam_date', new Date().toISOString()),
      ]);

      setStats({
        myCourses: coursesResult.count || 0,
        upcomingExams: examsResult.count || 0,
        studentsToday: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myCourses}</div>
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
                <CardTitle className="text-sm font-medium">Students Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.studentsToday}</div>
              </CardContent>
            </Card>
          </div>
        );
      case 'courses':
        return <CourseManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'qrcode':
        return <QRCodeGenerator />;
      case 'my-attendance':
        return <GeneralAttendanceScanner userType="staff" />;
      case 'schedule':
        return <ClassScheduling />;
      case 'settings':
        return <ChangePassword />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Staff Dashboard"
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

export default StaffDashboard;
