import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, BookOpen, Calendar, Users, ClipboardCheck, GraduationCap } from 'lucide-react';
import ChangePassword from '@/components/profile/ChangePassword';
import ClassScheduling from '@/components/management/ClassScheduling';
import AttendanceManagement from '@/components/management/AttendanceManagement';
import GeneralAttendanceScanner from '@/components/attendance/GeneralAttendanceScanner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const InstructorDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: instructorData } = useQuery({
    queryKey: ['instructor-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', profile?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses', instructorData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, class_schedules(*)')
        .eq('instructor_id', instructorData?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!instructorData?.id,
  });

  const { data: enrollmentCounts } = useQuery({
    queryKey: ['instructor-enrollment-counts', courses],
    queryFn: async () => {
      if (!courses || courses.length === 0) return {};
      const courseIds = courses.map(c => c.id);
      const { data, error } = await supabase
        .from('student_courses')
        .select('course_id')
        .in('course_id', courseIds);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(enrollment => {
        counts[enrollment.course_id] = (counts[enrollment.course_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!courses && courses.length > 0,
  });

  const totalStudents = Object.values(enrollmentCounts || {}).reduce((a, b) => a + b, 0);
  const totalClasses = courses?.reduce((acc, course) => acc + (course.class_schedules?.length || 0), 0) || 0;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Instructor Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name || 'Instructor'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="my-attendance" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{courses?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Courses assigned to you</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Enrolled in your courses</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{totalClasses}</div>
                  <p className="text-xs text-muted-foreground">Weekly class sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* My Courses */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="gradient-text">My Courses</CardTitle>
                <CardDescription>Courses you are teaching</CardDescription>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <Card key={course.id} className="bg-muted/50 hover-lift">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration:</span>
                              <span>{course.duration_weeks} weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max Students:</span>
                              <span>{course.max_students}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Enrolled:</span>
                              <span>{enrollmentCounts?.[course.id] || 0}</span>
                            </div>
                            {course.class_schedules && course.class_schedules.length > 0 && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-muted-foreground mb-1">Schedule:</p>
                                {course.class_schedules.map((schedule: any) => (
                                  <div key={schedule.id} className="text-xs">
                                    {dayNames[schedule.day_of_week]}: {schedule.start_time} - {schedule.end_time}
                                    {schedule.room && ` (${schedule.room})`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No courses assigned to you yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <ClassScheduling />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceManagement />
          </TabsContent>

          <TabsContent value="my-attendance">
            <GeneralAttendanceScanner userType="instructor" />
          </TabsContent>

          <TabsContent value="settings">
            <ChangePassword />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InstructorDashboard;
