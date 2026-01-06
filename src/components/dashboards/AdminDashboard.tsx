import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Calendar, QrCode, UserPlus, Award, FileText, Settings } from 'lucide-react';
import StudentManagement from '@/components/management/StudentManagement';
import UserRegistration from '@/components/management/UserRegistration';
import StaffManagement from '@/components/management/StaffManagement';
import CourseManagement from '@/components/management/CourseManagement';
import ExamManagement from '@/components/management/ExamManagement';
import AttendanceManagement from '@/components/management/AttendanceManagement';
import AttendanceReport from '@/components/management/AttendanceReport';
import QRCodeGenerator from '@/components/attendance/QRCodeGenerator';
import GeneralQRCodeManager from '@/components/attendance/GeneralQRCodeManager';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import CertificateManagement from '@/components/management/CertificateManagement';
import ClassScheduling from '@/components/management/ClassScheduling';
import ChangePassword from '@/components/profile/ChangePassword';
import DashboardLayout from './DashboardLayout';

const navItems = [
  { title: 'Dashboard', value: 'dashboard', icon: GraduationCap },
  { title: 'Register User', value: 'register', icon: UserPlus },
  { title: 'Students', value: 'students', icon: GraduationCap },
  { title: 'Staff', value: 'staff', icon: Users },
  { title: 'Courses', value: 'courses', icon: BookOpen },
  { title: 'Exams', value: 'exams', icon: Calendar },
  { title: 'Attendance', value: 'attendance', icon: QrCode },
  { title: 'Report', value: 'attendance-report', icon: FileText },
  { title: 'Course QR', value: 'qrcode', icon: QrCode },
  { title: 'General QR', value: 'general-qr', icon: QrCode },
  { title: 'My Attendance', value: 'my-attendance', icon: QrCode },
  { title: 'Certificates', value: 'certificates', icon: Award },
  { title: 'Schedule', value: 'schedule', icon: Calendar },
  { title: 'Settings', value: 'settings', icon: Settings },
];

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    totalExams: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsResult, staffResult, coursesResult, examsResult] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('user_roles').select('id', { count: 'exact' }).in('role', ['staff', 'instructor']),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('exams').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalStudents: studentsResult.count || 0,
        totalStaff: staffResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalExams: examsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStaff}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExams}</div>
              </CardContent>
            </Card>
          </div>
        );
      case 'register':
        return <UserRegistration />;
      case 'students':
        return <StudentManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'attendance-report':
        return <AttendanceReport />;
      case 'qrcode':
        return <QRCodeGenerator />;
      case 'general-qr':
        return <GeneralQRCodeManager />;
      case 'my-attendance':
        return <GeneralAttendanceScanner userType="admin" />;
      case 'certificates':
        return <CertificateManagement />;
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
      title="Admin Dashboard"
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

export default AdminDashboard;
