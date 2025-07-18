import { useState, useEffect } from "react";
import { TimesheetForm, TimesheetEntry } from "@/components/TimesheetForm";
import { TimesheetTable } from "@/components/TimesheetTable";
import { exportToExcel } from "@/utils/excelExport";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load entries from database on component mount
  useEffect(() => {
    const loadEntries = async () => {
      const { data, error } = await supabase
        .from('timesheet_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load timesheet entries from database.",
          variant: "destructive",
          duration: 3000,
        });
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
    };
    
    loadEntries();
  }, [toast]);

  const handleSubmitEntry = async (entry: TimesheetEntry) => {
    if (editingEntry) {
      // Update existing entry in database
      const { error } = await supabase
        .from('timesheet_entries')
        .update({
          week: entry.week,
          date: entry.date.toISOString().split('T')[0],
          sign_in: entry.signIn,
          sign_out: entry.signOut,
          number_of_breaks: parseInt(entry.numberOfBreaks),
          hours_worked: entry.hoursWorked,
          paid_break_hours: entry.paidBreakHours,
          unpaid_break_hours: entry.unpaidBreakHours
        })
        .eq('id', entry.id);
      
      if (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update timesheet entry in database.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      setEditingEntry(null);
      toast({
        title: "Timesheet Entry Updated",
        description: `Successfully updated ${entry.hoursWorked.toFixed(2)} hours for ${entry.week}`,
        duration: 3000,
      });
    } else {
      // Add new entry to database
      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert({
          week: entry.week,
          date: entry.date.toISOString().split('T')[0],
          sign_in: entry.signIn,
          sign_out: entry.signOut,
          number_of_breaks: parseInt(entry.numberOfBreaks),
          hours_worked: entry.hoursWorked,
          paid_break_hours: entry.paidBreakHours,
          unpaid_break_hours: entry.unpaidBreakHours
        })
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Save Failed",
          description: "Failed to save timesheet entry to database.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (data) {
        const newEntry: TimesheetEntry = {
          id: data.id,
          week: data.week,
          date: new Date(data.date),
          signIn: data.sign_in,
          signOut: data.sign_out,
          numberOfBreaks: data.number_of_breaks.toString(),
          hoursWorked: parseFloat(data.hours_worked.toString()),
          submittedAt: new Date(data.submitted_at),
          paidBreakHours: parseFloat(data.paid_break_hours.toString()),
          unpaidBreakHours: parseFloat(data.unpaid_break_hours.toString())
        };
        setEntries(prev => [newEntry, ...prev]);
      }
      
      toast({
        title: "Timesheet Entry Submitted",
        description: `Successfully recorded ${entry.hoursWorked.toFixed(2)} hours for ${entry.week}`,
        duration: 3000,
      });
    }
  };

  const handleEditEntry = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-corporate border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Timesheet</h1>
                <p className="text-sm text-muted-foreground">Personal time tracking and pay calculator</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/history')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>View All Entries</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Timesheet Form */}
        <section>
          <TimesheetForm 
            onSubmit={handleSubmitEntry} 
            editingEntry={editingEntry}
            onCancelEdit={handleCancelEdit}
          />
        </section>

        {/* Timesheet Table */}
        <section>
          <TimesheetTable 
            entries={entries} 
            onExportToExcel={handleExportToExcel}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              © 2024 Personal Timesheet. Rate: $17.50/hour
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

export default Index;
