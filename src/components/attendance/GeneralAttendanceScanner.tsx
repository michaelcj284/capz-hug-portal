import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, CheckCircle, Camera, Keyboard, LogIn, LogOut, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCameraScanner from './QRCameraScanner';
import { format } from 'date-fns';

interface GeneralAttendanceScannerProps {
  userType: 'student' | 'instructor' | 'staff' | 'admin';
}

interface TodayAttendance {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  qr_code_id: string;
}

const GeneralAttendanceScanner = ({ userType }: GeneralAttendanceScannerProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [canCheckOut, setCanCheckOut] = useState(false);

  const fetchTodayAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('general_attendance')
      .select('id, check_in_time, check_out_time, qr_code_id')
      .eq('user_id', user.id)
      .eq('attendance_date', today)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTodayAttendance(data);
      // Check if 3 hours have passed since check-in
      const checkInTime = new Date(data.check_in_time);
      const now = new Date();
      const hoursDiff = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setCanCheckOut(hoursDiff >= 3 && !data.check_out_time);
    } else {
      setTodayAttendance(null);
      setCanCheckOut(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    // Refresh every minute to update check-out eligibility
    const interval = setInterval(fetchTodayAttendance, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (scannedCode?: string) => {
    const codeToUse = scannedCode || code;
    setLoading(true);

    if (!codeToUse.startsWith('WEBCAPZ-GEN-')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid general attendance code',
      });
      setLoading(false);
      return;
    }

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

    const { data: qrCode, error: qrError } = await supabase
      .from('general_qr_codes')
      .select('id, is_active')
      .eq('code', codeToUse)
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

    // Check if already checked in today (without check-out)
    const { data: existing } = await supabase
      .from('general_attendance')
      .select('id, check_out_time')
      .eq('user_id', user.id)
      .eq('qr_code_id', qrCode.id)
      .eq('attendance_date', today)
      .is('check_out_time', null)
      .maybeSingle();

    if (existing) {
      toast({
        variant: 'destructive',
        title: 'Already Checked In',
        description: 'You are already checked in. Please check out first.',
      });
      setLoading(false);
      return;
    }

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
        title: 'Checked In Successfully',
        description: 'Your attendance has been recorded. You can check out after 3 hours.',
      });
      setCode('');
      fetchTodayAttendance();
    }

    setLoading(false);
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || !canCheckOut) return;
    setLoading(true);

    const { error } = await supabase
      .from('general_attendance')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', todayAttendance.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Checked Out Successfully',
        description: 'Your check-out time has been recorded.',
      });
      fetchTodayAttendance();
    }

    setLoading(false);
  };

  const getTimeRemaining = () => {
    if (!todayAttendance || todayAttendance.check_out_time) return null;
    const checkInTime = new Date(todayAttendance.check_in_time);
    const checkOutAvailable = new Date(checkInTime.getTime() + 3 * 60 * 60 * 1000);
    const now = new Date();
    const diff = checkOutAvailable.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Attendance Check-In / Check-Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Today's Attendance Status */}
          {todayAttendance && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Today's Attendance
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Check-in:</span>
                  <p className="font-medium">
                    {format(new Date(todayAttendance.check_in_time), 'hh:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>
                  <p className="font-medium">
                    {todayAttendance.check_out_time 
                      ? format(new Date(todayAttendance.check_out_time), 'hh:mm a')
                      : 'Not yet'}
                  </p>
                </div>
              </div>
              {timeRemaining && (
                <p className="text-xs text-muted-foreground">
                  Check-out available in: {timeRemaining}
                </p>
              )}
            </div>
          )}

          {/* Check-out Button */}
          {todayAttendance && !todayAttendance.check_out_time && (
            <Button 
              onClick={handleCheckOut} 
              disabled={!canCheckOut || loading}
              className="w-full"
              variant={canCheckOut ? 'default' : 'secondary'}
            >
              {loading ? (
                'Processing...'
              ) : canCheckOut ? (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out Now
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Check-out available after 3 hours
                </>
              )}
            </Button>
          )}

          {/* Check-in Section */}
          {(!todayAttendance || todayAttendance.check_out_time) && (
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Enter Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="mt-4">
                <QRCameraScanner 
                  userType={userType} 
                  onScanSuccess={(code) => handleCheckIn(code)}
                />
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="general-code">Enter Attendance Code</Label>
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
                      'Processing...'
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Check In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            {todayAttendance && !todayAttendance.check_out_time
              ? 'You must wait 3 hours after check-in to check out'
              : 'Scan the QR code or enter the code to check in'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralAttendanceScanner;
