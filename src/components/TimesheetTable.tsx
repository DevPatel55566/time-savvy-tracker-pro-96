import { format } from "date-fns";
import { Download, Calendar, Clock, DollarSign, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TimesheetEntry } from "./TimesheetForm";

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  onExportToExcel: () => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const TimesheetTable = ({ entries, onExportToExcel, onEditEntry, onDeleteEntry }: TimesheetTableProps) => {
  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const weeklyPay = totalHours * 17.50;

  if (entries.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto shadow-corporate animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timesheet Records
          </CardTitle>
          <CardDescription>
            No timesheet entries yet. Submit your first entry above to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-corporate animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-primary" />
              Timesheet Records
            </CardTitle>
            <CardDescription>
              Track your work hours and payments
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {totalHours.toFixed(2)} hrs
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-success text-success">
                <DollarSign className="h-3 w-3" />
                {weeklyPay.toFixed(2)} (Weekly)
              </Badge>
            </div>
            
            <Button
              onClick={onExportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Week</TableHead>
                <TableHead className="font-semibold text-foreground">Date</TableHead>
                <TableHead className="font-semibold text-foreground">Sign In</TableHead>
                <TableHead className="font-semibold text-foreground">Sign Out</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Breaks</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Hours Worked</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Submitted</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow 
                  key={entry.id} 
                  className="hover:bg-muted/20 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-medium">{entry.week}</TableCell>
                  <TableCell>{format(entry.date, "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {entry.signIn}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {entry.signOut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.numberOfBreaks} break{parseInt(entry.numberOfBreaks) !== 1 ? 's' : ''}
                      </Badge>
                      {entry.paidBreakHours > 0 && (
                        <span className="text-xs text-green-600">Paid: {(entry.paidBreakHours * 60).toFixed(0)}min</span>
                      )}
                      {entry.unpaidBreakHours > 0 && (
                        <span className="text-xs text-red-600">Unpaid: {(entry.unpaidBreakHours * 60).toFixed(0)}min</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {entry.hoursWorked.toFixed(2)}h
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {format(entry.submittedAt, "HH:mm")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditEntry(entry)}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary footer */}
        <div className="mt-4 p-4 bg-gradient-subtle rounded-lg border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Total entries: <span className="font-medium text-foreground">{entries.length}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Total Hours: {totalHours.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-success font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>Weekly Pay: ${weeklyPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};