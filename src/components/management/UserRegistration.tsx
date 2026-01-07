import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Course {
  id: string;
  name: string;
  description: string | null;
}

const UserRegistration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, description')
      .order('name');
    
    if (data && !error) {
      setCourses(data);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('register-user', {
        body: { 
          email, 
          password, 
          fullName, 
          role,
          courseIds: selectedCourses
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Registration failed');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'User Registered',
        description: `${fullName} has been registered as ${role}${selectedCourses.length > 0 ? ` with ${selectedCourses.length} course(s) assigned` : ''}`,
      });

      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('student');
      setSelectedCourses([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const showCourseSelection = role === 'student' || role === 'instructor';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v: any) => {
                setRole(v);
                setSelectedCourses([]); // Reset course selection when role changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course Assignment Section */}
          {showCourseSelection && courses.length > 0 && (
            <div className="space-y-2">
              <Label>
                {role === 'student' ? 'Enroll in Courses' : 'Assign to Courses (as instructor)'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {role === 'student' 
                  ? 'Select courses to enroll this student in'
                  : 'Select courses this instructor will teach'}
              </p>
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={`course-${course.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {course.name}
                        </label>
                        {course.description && (
                          <p className="text-xs text-muted-foreground">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedCourses.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedCourses.length} course(s) selected
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserRegistration;
