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

interface Exam {
  id: string;
  title: string;
  exam_date: string;
  duration_minutes: number;
  total_marks: number;
  course: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
}

const ExamManagement = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    course_id: '',
    exam_date: '',
    duration_minutes: 60,
    total_marks: 100,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [examsResult, coursesResult] = await Promise.all([
      supabase.from('exams').select('*, course:courses(name)').order('exam_date', { ascending: false }),
      supabase.from('courses').select('id, name'),
    ]);

    if (examsResult.data) setExams(examsResult.data as any);
    if (coursesResult.data) setCourses(coursesResult.data);
    setLoading(false);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('exams').insert([newExam]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Exam Created', description: `${newExam.title} has been scheduled` });
      setDialogOpen(false);
      setNewExam({ title: '', course_id: '', exam_date: '', duration_minutes: 60, total_marks: 100 });
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading exams...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Management</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Schedule Exam</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Exam</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Title</Label>
                <Input
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={newExam.course_id} onValueChange={(v) => setNewExam({ ...newExam, course_id: v })}>
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
                <Label>Exam Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={newExam.exam_date}
                  onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newExam.duration_minutes}
                    onChange={(e) => setNewExam({ ...newExam, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={newExam.total_marks}
                    onChange={(e) => setNewExam({ ...newExam, total_marks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Schedule Exam</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No exams scheduled yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.name || 'N/A'}</TableCell>
                  <TableCell>{exam.exam_date ? new Date(exam.exam_date).toLocaleString() : 'TBD'}</TableCell>
                  <TableCell>{exam.duration_minutes} min</TableCell>
                  <TableCell>{exam.total_marks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamManagement;
