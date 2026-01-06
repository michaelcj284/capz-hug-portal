import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, BookOpen, Calendar, QrCode, LogOut, UserPlus, Award, FileText } from 'lucide-react';
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

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/fbe5d1f1-a35b-47a7-8c54-80c47f04a9e1.png"
              alt="WEBCAPZ Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid grid-cols-6 lg:grid-cols-12 gap-2 h-auto">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden lg:inline">Register</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden lg:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden lg:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="attendance-report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">Course QR</span>
            </TabsTrigger>
            <TabsTrigger value="general-qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">General QR</span>
            </TabsTrigger>
            <TabsTrigger value="my-attendance" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">My Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden lg:inline">Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Schedule</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <UserRegistration />
          </TabsContent>
          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>
          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>
          <TabsContent value="courses">
            <CourseManagement />
          </TabsContent>
          <TabsContent value="exams">
            <ExamManagement />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceManagement />
          </TabsContent>
          <TabsContent value="attendance-report">
            <AttendanceReport />
          </TabsContent>
          <TabsContent value="qrcode">
            <QRCodeGenerator />
          </TabsContent>
          <TabsContent value="general-qr">
            <GeneralQRCodeManager />
          </TabsContent>
          <TabsContent value="my-attendance">
            <GeneralAttendanceScanner userType="admin" />
          </TabsContent>
          <TabsContent value="certificates">
            <CertificateManagement />
          </TabsContent>
          <TabsContent value="schedule">
            <ClassScheduling />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
