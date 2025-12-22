import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, QrCode, LogOut, CheckCircle, Settings, Award, Bell } from 'lucide-react';
import QRCodeScanner from '@/components/attendance/QRCodeScanner';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import StudentResults from '@/components/student/StudentResults';
import StudentAttendance from '@/components/student/StudentAttendance';
import StudentCourses from '@/components/student/StudentCourses';
import StudentNotifications from '@/components/student/StudentNotifications';
import StudentCertificates from '@/components/student/StudentCertificates';
import ChangePassword from '@/components/profile/ChangePassword';

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    upcomingExams: 0,
    attendanceRate: 0,
  });
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

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

        const [enrollmentsResult, attendanceResult] = await Promise.all([
          supabase.from('student_courses').select('id', { count: 'exact' }).eq('student_id', student.id),
          supabase.from('attendance').select('status').eq('student_id', student.id),
        ]);

        const totalAttendance = attendanceResult.data?.length || 0;
        const presentCount = attendanceResult.data?.filter((a: any) => a.status === 'present').length || 0;
        const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

        setStats({
          enrolledCourses: enrollmentsResult.count || 0,
          upcomingExams: 0,
          attendanceRate,
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
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
              <h1 className="text-xl font-bold">Student Dashboard</h1>
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

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-2 h-auto">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden lg:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden lg:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden lg:inline">Scan QR</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden lg:inline">Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden lg:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <StudentCourses studentId={studentData?.id} />
          </TabsContent>
          <TabsContent value="results">
            <StudentResults studentId={studentData?.id} />
          </TabsContent>
          <TabsContent value="attendance">
            <StudentAttendance studentId={studentData?.id} />
          </TabsContent>
          <TabsContent value="scan">
            <div className="space-y-6">
              <QRCodeScanner studentId={studentData?.id} />
              <GeneralAttendanceScanner userType="student" />
            </div>
          </TabsContent>
          <TabsContent value="certificates">
            <StudentCertificates studentId={studentData?.id} />
          </TabsContent>
          <TabsContent value="notifications">
            <StudentNotifications />
          </TabsContent>
          <TabsContent value="settings">
            <ChangePassword />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
