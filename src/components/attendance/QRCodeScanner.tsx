import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  studentId?: string;
  onAttendanceMarked?: () => void;
}

const QRCodeScanner = ({ studentId, onAttendanceMarked }: QRCodeScannerProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Student record not found',
      });
      return;
    }

    setLoading(true);

    // Parse the code: WEBCAPZ-{courseId}-{date}-{random}
    const parts = code.split('-');
    if (parts.length < 4 || parts[0] !== 'WEBCAPZ') {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid attendance code',
      });
      setLoading(false);
      return;
    }

    const courseId = parts[1];
    const today = new Date().toISOString().split('T')[0];

    // Check if already marked
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing) {
      toast({
        variant: 'destructive',
        title: 'Already Marked',
        description: 'Your attendance for today has already been recorded',
      });
      setLoading(false);
      return;
    }

    // Mark attendance
    const { error } = await supabase.from('attendance').insert({
      student_id: studentId,
      course_id: courseId,
      attendance_date: today,
      status: 'present',
      qr_code: code,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Attendance Marked',
        description: 'Your attendance has been recorded successfully',
      });
      setCode('');
      onAttendanceMarked?.();
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Mark Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Enter Attendance Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WEBCAPZ-XXXX-XXXX-XXXX"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              'Marking...'
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Attendance
              </>
            )}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Get the attendance code from your instructor
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
