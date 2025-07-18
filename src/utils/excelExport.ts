import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/components/TimesheetForm';
import { format } from 'date-fns';

export const exportToExcel = (entries: TimesheetEntry[]) => {
  // Prepare data for Excel
  const excelData = entries.map((entry, index) => ({
    'Entry #': index + 1,
    'Week': entry.week,
    'Date': format(entry.date, 'MM/dd/yyyy'),
    'Sign In': entry.signIn,
    'Sign Out': entry.signOut,
    'Breaks': entry.numberOfBreaks,
    'Paid Break (min)': (entry.paidBreakHours * 60).toFixed(0),
    'Unpaid Break (min)': (entry.unpaidBreakHours * 60).toFixed(0),
    'Hours Worked': parseFloat(entry.hoursWorked.toFixed(2)),
    'Submitted At': format(entry.submittedAt, 'MM/dd/yyyy HH:mm')
  }));

  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const weeklyPay = totalHours * 17.50;

  // Add summary row
  excelData.push({
    'Entry #': '',
    'Week': '',
    'Date': '',
    'Sign In': '',
    'Sign Out': 'TOTALS:',
    'Hours Worked': parseFloat(totalHours.toFixed(2)),
    'Submitted At': ''
  } as any);

  // Add weekly pay row
  excelData.push({
    'Entry #': '',
    'Week': '',
    'Date': '',
    'Sign In': '',
    'Sign Out': 'WEEKLY PAY:',
    'Hours Worked': `$${weeklyPay.toFixed(2)}`,
    'Submitted At': ''
  } as any);

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 10 }, // Entry #
    { wch: 15 }, // Week
    { wch: 12 }, // Date
    { wch: 10 }, // Sign In
    { wch: 10 }, // Sign Out
    { wch: 8 },  // Breaks
    { wch: 12 }, // Paid Break
    { wch: 12 }, // Unpaid Break
    { wch: 12 }, // Hours Worked
    { wch: 18 }  // Submitted At
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:G1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Style the totals rows
  const totalRowIndex = excelData.length - 2;
  const payRowIndex = excelData.length - 1;
  // Style totals row
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex + 1, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F3F4F6" } },
      alignment: { horizontal: col >= 5 ? "right" : "center" },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Style weekly pay row
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: payRowIndex + 1, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "22C55E" } },
      alignment: { horizontal: col >= 5 ? "right" : "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thick", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }


  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet Records');

  // Use a consistent filename
  const filename = 'My_Timesheet.xlsx';

  // Save the file (will overwrite existing file)
  XLSX.writeFile(workbook, filename);

  return filename;
};

export const downloadTemplate = () => {
  const templateData = [
    {
      'Week': 'Week 1',
      'Date': '01/15/2024',
      'Sign In': '09:00',
      'Sign Out': '17:00',
      'Hours Worked': '7.00',
      'Submitted At': '01/15/2024 17:05'
    }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Week
    { wch: 12 }, // Date
    { wch: 10 }, // Sign In
    { wch: 10 }, // Sign Out
    { wch: 12 }, // Hours Worked
    { wch: 18 }  // Submitted At
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet Template');
  XLSX.writeFile(workbook, 'Timesheet_Template.xlsx');
};