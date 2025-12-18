import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface Certificate {
  id: string;
  certificate_number: string;
  issue_date: string;
  grade: string;
  student: {
    student_number: string;
    profiles: {
      full_name: string;
    };
  };
  course: {
    name: string;
  };
}

interface Student {
  id: string;
  student_number: string;
  profiles: {
    full_name: string;
  };
}

interface Course {
  id: string;
  name: string;
}

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCert, setNewCert] = useState({
    student_id: '',
    course_id: '',
    grade: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [certsResult, studentsResult, coursesResult] = await Promise.all([
      supabase.from('certificates').select('*, student:students(student_number, profiles:user_id(full_name)), course:courses(name)').order('issue_date', { ascending: false }),
      supabase.from('students').select('id, student_number, profiles:user_id(full_name)'),
      supabase.from('courses').select('id, name'),
    ]);

    if (certsResult.data) setCertificates(certsResult.data as any);
    if (studentsResult.data) setStudents(studentsResult.data as any);
    if (coursesResult.data) setCourses(coursesResult.data);
    setLoading(false);
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const certificateNumber = `CERT-${Date.now().toString().slice(-8)}`;
    
    const { error } = await supabase.from('certificates').insert([{
      ...newCert,
      certificate_number: certificateNumber,
    }]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Certificate Issued', description: `Certificate ${certificateNumber} has been issued` });
      setDialogOpen(false);
      setNewCert({ student_id: '', course_id: '', grade: '' });
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Certificate Management</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Issue Certificate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue New Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={newCert.student_id} onValueChange={(v) => setNewCert({ ...newCert, student_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {(student.profiles as any)?.full_name} ({student.student_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={newCert.course_id} onValueChange={(v) => setNewCert({ ...newCert, course_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={newCert.grade} onValueChange={(v) => setNewCert({ ...newCert, grade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Good</SelectItem>
                    <SelectItem value="C">C - Satisfactory</SelectItem>
                    <SelectItem value="D">D - Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Issue Certificate</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No certificates issued yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Issue Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono">{cert.certificate_number}</TableCell>
                  <TableCell>{(cert.student as any)?.profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>{cert.course?.name || 'N/A'}</TableCell>
                  <TableCell>{cert.grade}</TableCell>
                  <TableCell>{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateManagement;
