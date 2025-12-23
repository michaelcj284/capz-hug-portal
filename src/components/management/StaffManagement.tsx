import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  department: string | null;
  position: string | null;
  role: string;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    // Get all users with staff or instructor role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['staff', 'instructor']);

    if (roleError || !roleData) {
      console.error('Error fetching staff roles:', roleError);
      setLoading(false);
      return;
    }

    const userIds = roleData.map(r => r.user_id);
    const roleMap = new Map(roleData.map(r => [r.user_id, r.role]));

    if (userIds.length === 0) {
      setStaff([]);
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .in('id', userIds)
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      setLoading(false);
      return;
    }

    // Get staff records if they exist
    const { data: staffRecords } = await supabase
      .from('staff')
      .select('user_id, department, position')
      .in('user_id', userIds);

    const staffMap = new Map(staffRecords?.map(s => [s.user_id, s]) || []);

    const staffList: StaffMember[] = (profiles || []).map(p => {
      const staffRecord = staffMap.get(p.id);
      return {
        id: p.id,
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        department: staffRecord?.department || null,
        position: staffRecord?.position || null,
        role: roleMap.get(p.id) || 'staff',
      };
    });

    setStaff(staffList);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();

    // Set up real-time subscription
    const channel = supabase
      .channel('staff-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchStaff();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading staff...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff & Instructor Management</CardTitle>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No staff members registered yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.full_name || 'N/A'}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'instructor' ? 'default' : 'secondary'}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.department || 'Not set'}</TableCell>
                  <TableCell>{member.position || 'Not set'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffManagement;
