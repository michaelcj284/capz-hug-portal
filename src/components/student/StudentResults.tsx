import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StudentResultsProps {
  studentId?: string;
}

interface Result {
  id: string;
  score: number;
  grade: string;
  exam: {
    title: string;
    total_marks: number;
    course: {
      name: string;
    };
  };
}

const StudentResults = ({ studentId }: StudentResultsProps) => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchResults = async () => {
    if (!studentId) return;
    
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exam:exams(title, total_marks, course:courses(name))
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResults(data as any);
    }
    setLoading(false);
  };

  const getGradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      F: 'bg-red-500',
    };
    return <Badge className={colors[grade] || 'bg-gray-500'}>{grade}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }
  
  if (!studentId) {
    return <div className="text-center py-8 text-muted-foreground">Student record not found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Results</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No exam results yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.exam?.title || 'N/A'}</TableCell>
                  <TableCell>{(result.exam as any)?.course?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {result.score} / {result.exam?.total_marks || 100}
                  </TableCell>
                  <TableCell>{getGradeBadge(result.grade)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentResults;
