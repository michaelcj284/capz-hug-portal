import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRCameraScannerProps {
  userType: 'student' | 'instructor' | 'staff' | 'admin';
  onScanSuccess?: (code: string) => void;
}

const QRCameraScanner = ({ userType, onScanSuccess }: QRCameraScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      scannerRef.current = new Html5Qrcode('qr-reader');
      setIsScanning(true);

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {} // Ignore scan errors (no QR detected)
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
      });
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (loading) return;

    // Stop scanning immediately
    await stopScanning();
    setLoading(true);

    // Validate code format
    if (!decodedText.startsWith('WEBCAPZ-GEN-')) {
      toast({
        variant: 'destructive',
        title: 'Invalid QR Code',
        description: 'This is not a valid attendance QR code',
      });
      setLoading(false);
      return;
    }

    // Call the parent handler
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
        style={{ display: isScanning ? 'block' : 'none' }}
      />

      {!isScanning && (
        <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
            <p>Camera preview will appear here</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <CheckCircle className="h-8 w-8 text-primary animate-pulse" />
          <span className="ml-2">Processing...</span>
        </div>
      ) : (
        <Button
          onClick={isScanning ? stopScanning : startScanning}
          className="w-full"
          variant={isScanning ? 'destructive' : 'default'}
        >
          {isScanning ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanning
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera Scan
            </>
          )}
        </Button>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Point your camera at the QR code to check in
      </p>
    </div>
  );
};

export default QRCameraScanner;
