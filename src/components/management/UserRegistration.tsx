import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const UserRegistration = () => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Error updating role:', roleError);
        }

        // Create appropriate record based on role
        if (role === 'student') {
          const studentNumber = `STU${Date.now().toString().slice(-8)}`;
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: authData.user.id,
              student_number: studentNumber,
              registered_by: profile?.id,
            });

          if (studentError) {
            console.error('Error creating student record:', studentError);
          }
        } else if (role === 'staff' || role === 'instructor') {
          const { error: staffError } = await supabase
            .from('staff')
            .insert({
              user_id: authData.user.id,
              position: role === 'instructor' ? 'Instructor' : undefined,
            });

          if (staffError) {
            console.error('Error creating staff record:', staffError);
          }
        }

        toast({
          title: 'User Registered',
          description: `${fullName} has been registered as ${role}`,
        });

        // Reset form
        setEmail('');
        setPassword('');
        setFullName('');
        setRole('student');
      }
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
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserRegistration;
