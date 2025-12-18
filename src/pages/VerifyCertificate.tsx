import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Search, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CertificateData {
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

const VerifyCertificate = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        student:students(
          student_number,
          profiles:user_id(full_name)
        ),
        course:courses(name)
      `)
      .eq('certificate_number', certificateNumber.trim())
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setCertificate(data as any);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src="/lovable-uploads/fbe5d1f1-a35b-47a7-8c54-80c47f04a9e1.png"
              alt="WEBCAPZ Technologies Logo"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold">Certificate Verification</h1>
          <p className="text-muted-foreground mt-2">
            Enter a certificate number to verify its authenticity
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certNumber">Certificate Number</Label>
                <Input
                  id="certNumber"
                  placeholder="Enter certificate number"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  'Verifying...'
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {certificate && (
          <Card className="border-green-500 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-green-700">Certificate Valid</CardTitle>
              </div>
              <CardDescription>This certificate is authentic and verified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-medium">{(certificate.student as any)?.profiles?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-medium">{certificate.course?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="font-medium">{certificate.grade || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">
                  {new Date(certificate.issue_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-700">Certificate Not Found</CardTitle>
              </div>
              <CardDescription>
                No certificate found with this number. Please check the number and try again.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
