import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QrCode, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
}

const QRCodeGenerator = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase.from('courses').select('id, name');
    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  const generateQRCode = () => {
    if (!selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a course first',
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const code = `WEBCAPZ-${selectedCourse}-${today}-${Date.now().toString(36)}`;
    setQrCode(code);

    toast({
      title: 'QR Code Generated',
      description: 'Share this code with students for attendance',
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode);
    toast({
      title: 'Copied',
      description: 'QR code copied to clipboard',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateQRCode} className="w-full">
          <QrCode className="mr-2 h-4 w-4" />
          Generate Attendance Code
        </Button>

        {qrCode && (
          <div className="space-y-4">
            <div className="p-6 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Attendance Code</p>
              <p className="font-mono text-lg font-bold break-all">{qrCode}</p>
            </div>
            <Button variant="outline" onClick={copyToClipboard} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Share this code with students to mark their attendance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
