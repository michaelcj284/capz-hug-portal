import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, QrCode, LogOut, Users, Settings } from 'lucide-react';
import CourseManagement from '@/components/management/CourseManagement';
import ExamManagement from '@/components/management/ExamManagement';
import AttendanceManagement from '@/components/management/AttendanceManagement';
import QRCodeGenerator from '@/components/attendance/QRCodeGenerator';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import ClassScheduling from '@/components/management/ClassScheduling';
import ChangePassword from '@/components/profile/ChangePassword';

const StaffDashboard = () => {
  const { profile, signOut } = useAuth();
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
              <h1 className="text-xl font-bold">Staff Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2 h-auto">
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
            <TabsTrigger value="qrcode" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="my-attendance" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">Mark Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CourseManagement />
          </TabsContent>
          <TabsContent value="exams">
            <ExamManagement />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceManagement />
          </TabsContent>
          <TabsContent value="qrcode">
            <QRCodeGenerator />
          </TabsContent>
          <TabsContent value="my-attendance">
            <GeneralAttendanceScanner userType="staff" />
          </TabsContent>
          <TabsContent value="schedule">
            <ClassScheduling />
          </TabsContent>
          <TabsContent value="settings">
            <ChangePassword />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StaffDashboard;
