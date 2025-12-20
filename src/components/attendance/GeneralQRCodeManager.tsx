import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, Copy, Plus, Power, PowerOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GeneralQRCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const GeneralQRCodeManager = () => {
  const [qrCodes, setQrCodes] = useState<GeneralQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    const { data, error } = await supabase
      .from('general_qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQrCodes(data);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'WEBCAPZ-GEN-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a name for the QR code',
      });
      return;
    }

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('general_qr_codes').insert({
      code: generateCode(),
      name: name.trim(),
      description: description.trim() || null,
      created_by: user?.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: 'General QR code created successfully',
      });
      setName('');
      setDescription('');
      setDialogOpen(false);
      fetchQRCodes();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('general_qr_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: `QR code ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      fetchQRCodes();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'QR code copied to clipboard',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            General QR Codes (Non-Expiring)
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create General QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Main Campus Attendance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description for this QR code..."
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={creating}>
                  {creating ? 'Creating...' : 'Create QR Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These QR codes never expire and can be used by all users (students, instructors, staff, admins) to mark attendance.
          </p>
          
          {qrCodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No general QR codes created yet. Click "Create New" to add one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr) => (
                    <TableRow key={qr.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{qr.name}</p>
                          {qr.description && (
                            <p className="text-sm text-muted-foreground">{qr.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground sm:hidden mt-1">
                            <code className="bg-muted px-1 py-0.5 rounded">{qr.code}</code>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{qr.code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={qr.is_active ? 'default' : 'secondary'}>
                          {qr.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(qr.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={qr.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => toggleActive(qr.id, qr.is_active)}
                          >
                            {qr.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralQRCodeManager;
