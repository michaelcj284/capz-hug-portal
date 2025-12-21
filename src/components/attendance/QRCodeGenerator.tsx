import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QrCode, Copy, Download } from 'lucide-react';
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

  const downloadQRCode = () => {
    const svg = document.getElementById('course-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `attendance-qr-${selectedCourse}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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
            <div className="p-6 bg-white rounded-lg flex flex-col items-center justify-center">
              <QRCodeSVG
                id="course-qr-code"
                value={qrCode}
                size={200}
                level="H"
                includeMargin
              />
              <p className="text-sm text-muted-foreground mt-4">Scan to mark attendance</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Attendance Code</p>
              <p className="font-mono text-sm font-bold break-all">{qrCode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={downloadQRCode} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Share this QR code with students to mark their attendance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
