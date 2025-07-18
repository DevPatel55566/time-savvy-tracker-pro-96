import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const timesheetSchema = z.object({
  week: z.string().min(1, "Week is required"),
  date: z.date({ required_error: "Date is required" }),
  signIn: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format"),
  signOut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format"),
  numberOfBreaks: z.string().regex(/^[0-9]+$/, "Enter number of breaks (whole numbers only)"),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

export interface TimesheetEntry extends TimesheetFormData {
  id: string;
  hoursWorked: number;
  submittedAt: Date;
  paidBreakHours: number;
  unpaidBreakHours: number;
}

interface TimesheetFormProps {
  onSubmit: (entry: TimesheetEntry) => void;
  editingEntry?: TimesheetEntry | null;
  onCancelEdit?: () => void;
}

export const TimesheetForm = ({ onSubmit, editingEntry, onCancelEdit }: TimesheetFormProps) => {
  const [hoursWorked, setHoursWorked] = useState<number>(0);

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      week: editingEntry?.week || "",
      date: editingEntry?.date,
      signIn: editingEntry?.signIn || "",
      signOut: editingEntry?.signOut || "",
      numberOfBreaks: editingEntry?.numberOfBreaks || "1",
    },
  });

  const calculateHours = (signIn: string, signOut: string, numberOfBreaks: string = "1") => {
    if (!signIn || !signOut) return { hours: 0, pay: 0, paidBreakHours: 0, unpaidBreakHours: 0 };
    
    const [inHour, inMin] = signIn.split(':').map(Number);
    const [outHour, outMin] = signOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    let totalMinutes = outMinutes - inMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle next day
    
    const totalHours = totalMinutes / 60;
    const breaks = parseInt(numberOfBreaks) || 1;
    
    // Break logic: 1 break = paid (30 min), more than 1 break = only 1 paid, rest unpaid
    const paidBreakHours = breaks >= 1 ? 0.5 : 0; // 30 minutes paid break
    const unpaidBreakHours = breaks > 1 ? (breaks - 1) * 0.5 : 0; // Additional breaks are unpaid
    
    const totalBreakHours = paidBreakHours + unpaidBreakHours;
    const workedHours = Math.max(0, totalHours - unpaidBreakHours); // Only subtract unpaid breaks from worked hours
    const pay = workedHours * 17.50;
    
    return { hours: workedHours, pay, paidBreakHours, unpaidBreakHours };
  };

  const watchSignIn = form.watch("signIn");
  const watchSignOut = form.watch("signOut");
  const watchNumberOfBreaks = form.watch("numberOfBreaks");

  // Update calculations when times change
  React.useEffect(() => {
    const { hours } = calculateHours(watchSignIn, watchSignOut, watchNumberOfBreaks);
    setHoursWorked(hours);
  }, [watchSignIn, watchSignOut, watchNumberOfBreaks]);

  const handleSubmit = (data: TimesheetFormData) => {
    const { hours, paidBreakHours, unpaidBreakHours } = calculateHours(data.signIn, data.signOut, data.numberOfBreaks);
    
    const entry: TimesheetEntry = {
      ...data,
      id: editingEntry?.id || crypto.randomUUID(),
      hoursWorked: hours,
      submittedAt: editingEntry?.submittedAt || new Date(),
      paidBreakHours,
      unpaidBreakHours,
    };

    onSubmit(entry);
    form.reset();
    setHoursWorked(0);
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
      form.reset();
      setHoursWorked(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-form animate-slide-up">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5" />
          {editingEntry ? 'Edit Timesheet Entry' : 'Timesheet Entry'}
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Enter your daily work hours to track time and calculate pay
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Week</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Week 1, Jan 1-7"
                        className="border-2 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal border-2 focus:border-primary",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="signIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Sign In Time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09:00"
                        className="border-2 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Sign Out Time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="17:00"
                        className="border-2 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfBreaks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Number of Breaks</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1"
                        type="number"
                        min="0"
                        max="10"
                        className="border-2 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Real-time calculation display */}
            {(watchSignIn && watchSignOut) && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Hours Worked:</span>
                  <span className="font-semibold text-primary">{hoursWorked.toFixed(2)} hours</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center justify-between">
                    <span>Number of Breaks:</span>
                    <span>{parseInt(watchNumberOfBreaks || "1")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Paid Break:</span>
                    <span>30 min</span>
                  </div>
                  {parseInt(watchNumberOfBreaks || "1") > 1 && (
                    <div className="flex items-center justify-between col-span-2">
                      <span>Unpaid Breaks:</span>
                      <span>{(parseInt(watchNumberOfBreaks || "1") - 1) * 30} min</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Break policy: First break (30min) is paid, additional breaks are unpaid
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 transition-all duration-200 hover:shadow-md"
              >
                {editingEntry ? 'Update Entry' : 'Submit Timesheet Entry'}
              </Button>
              {editingEntry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="px-8 py-3 font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};