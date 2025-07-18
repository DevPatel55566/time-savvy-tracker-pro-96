-- Create timesheet_entries table
CREATE TABLE public.timesheet_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  week TEXT NOT NULL,
  date DATE NOT NULL,
  sign_in TIME NOT NULL,
  sign_out TIME NOT NULL,
  number_of_breaks INTEGER NOT NULL DEFAULT 1,
  hours_worked DECIMAL(4,2) NOT NULL,
  paid_break_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  unpaid_break_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Anyone can view timesheet entries" 
ON public.timesheet_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create timesheet entries" 
ON public.timesheet_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update timesheet entries" 
ON public.timesheet_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete timesheet entries" 
ON public.timesheet_entries 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timesheet_entries_updated_at
BEFORE UPDATE ON public.timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();