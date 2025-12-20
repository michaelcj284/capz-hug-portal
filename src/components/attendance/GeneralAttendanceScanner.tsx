import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GeneralAttendanceScannerProps {
  userType: 'student' | 'instructor' | 'staff' | 'admin';
}

const GeneralAttendanceScanner = ({ userType }: GeneralAttendanceScannerProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate code format
    if (!code.startsWith('WEBCAPZ-GEN-')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid general attendance code',
      });
      setLoading(false);
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to mark attendance',
      });
      setLoading(false);
      return;
    }

    // Find the QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('general_qr_codes')
      .select('id, is_active')
      .eq('code', code)
      .maybeSingle();

    if (qrError || !qrCode) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'This attendance code does not exist',
      });
      setLoading(false);
      return;
    }

    if (!qrCode.is_active) {
      toast({
        variant: 'destructive',
        title: 'Inactive Code',
        description: 'This attendance code is no longer active',
      });
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already marked today
    const { data: existing } = await supabase
      .from('general_attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('qr_code_id', qrCode.id)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing) {
      toast({
        variant: 'destructive',
        title: 'Already Marked',
        description: 'Your attendance for today has already been recorded with this code',
      });
      setLoading(false);
      return;
    }

    // Mark attendance
    const { error } = await supabase.from('general_attendance').insert({
      user_id: user.id,
      qr_code_id: qrCode.id,
      user_type: userType,
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
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Mark General Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="general-code">Enter General Attendance Code</Label>
              <Input
                id="general-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WEBCAPZ-GEN-XXXXXXXX"
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
            Use the general attendance code to mark your daily attendance
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralAttendanceScanner;
