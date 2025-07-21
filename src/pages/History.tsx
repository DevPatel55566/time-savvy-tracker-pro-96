import { useState, useEffect } from "react";
import { TimesheetEntry } from "@/components/TimesheetForm";
import { exportToExcel } from "@/utils/excelExport";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft, Download, Edit, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const History = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const ADMIN_PASSWORD = "pat05052005"; // Simple password protection

  // Load entries from database on component mount
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('timesheet_entries')
        .select('*')
        .order('week', { ascending: true });
      
      if (error) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load timesheet entries from database.",
          variant: "destructive",
          duration: 3000,
        });
        setLoading(false);
        return;
      }
      
      if (data) {
        const formattedEntries: TimesheetEntry[] = data.map(entry => ({
          id: entry.id,
          week: entry.week,
          date: new Date(entry.date),
          signIn: entry.sign_in,
          signOut: entry.sign_out,
          numberOfBreaks: entry.number_of_breaks.toString(),
          hoursWorked: parseFloat(entry.hours_worked.toString()),
          submittedAt: new Date(entry.submitted_at),
          paidBreakHours: parseFloat(entry.paid_break_hours.toString()),
          unpaidBreakHours: parseFloat(entry.unpaid_break_hours.toString())
        }));
        setEntries(formattedEntries);
      }
      setLoading(false);
    };
    
    loadEntries();
  }, [toast]);

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('timesheet_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete timesheet entry from database.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setEntries(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Entry Deleted",
      description: "Timesheet entry has been removed",
      duration: 3000,
    });
  };

  const handleExportToExcel = () => {
    if (entries.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please submit at least one timesheet entry before exporting.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const filename = exportToExcel(entries);
      toast({
        title: "Excel Export Successful",
        description: `Timesheet data exported to ${filename}`,
        duration: 4000,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your timesheet data.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the timesheet history.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary rounded-lg p-3 w-fit mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Protected Access</CardTitle>
            <CardDescription>
              Please enter the password to view timesheet history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePasswordSubmit} className="flex-1">
                Access History
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading timesheet entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-corporate border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="bg-primary rounded-lg p-2">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Timesheet History</h1>
                <p className="text-sm text-muted-foreground">All your recorded timesheet entries</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-sm">
                Total: {totalHours.toFixed(2)} hours
              </Badge>
              <Button onClick={handleExportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Timesheet Entries</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any timesheet entries yet.
              </p>
              <Button onClick={() => navigate('/')}>
                Create Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">All Timesheet Entries</CardTitle>
                  <CardDescription>
                    Complete history of your work hours
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Sign In</TableHead>
                      <TableHead>Sign Out</TableHead>
                      <TableHead>Breaks</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {entries.map((entry) => {
                       return (
                         <TableRow key={entry.id}>
                           <TableCell className="font-medium">{entry.week}</TableCell>
                           <TableCell>{entry.date.toLocaleDateString()}</TableCell>
                           <TableCell>{entry.signIn}</TableCell>
                           <TableCell>{entry.signOut}</TableCell>
                           <TableCell>
                             <div className="space-y-1">
                               <div className="text-sm">{entry.numberOfBreaks} break(s)</div>
                               <div className="text-xs text-muted-foreground">
                                 Paid: {entry.paidBreakHours.toFixed(2)}h | 
                                 Unpaid: {entry.unpaidBreakHours.toFixed(2)}h
                               </div>
                             </div>
                           </TableCell>
                           <TableCell className="font-medium">
                             {entry.hoursWorked.toFixed(2)} hours
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {entry.submittedAt.toLocaleString()}
                           </TableCell>
                           <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/?edit=${entry.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this timesheet entry? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              © 2024 Personal Timesheet
            </div>
            <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
              Break policy: First break (30min) is paid • Additional breaks are unpaid
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default History;