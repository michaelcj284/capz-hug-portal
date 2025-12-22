import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface StudentCertificatesProps {
  studentId?: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issue_date: string;
  grade: string;
  course: {
    name: string;
  };
}

const StudentCertificates = ({ studentId }: StudentCertificatesProps) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchCertificates();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchCertificates = async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        course:courses(name)
      `)
      .eq('student_id', studentId)
      .order('issue_date', { ascending: false });

    if (!error && data) {
      setCertificates(data as any);
    }
    setLoading(false);
  };

  const getGradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
    };
    return <Badge className={colors[grade] || 'bg-gray-500'}>{grade}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          My Certificates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No certificates earned yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Issue Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono">{cert.certificate_number}</TableCell>
                  <TableCell>{cert.course?.name || 'N/A'}</TableCell>
                  <TableCell>{getGradeBadge(cert.grade)}</TableCell>
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

export default StudentCertificates;
