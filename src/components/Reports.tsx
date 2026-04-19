import React, { useState, useMemo } from 'react';
import { useExpenses, Expense } from '../hooks/useExpenses';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FileText, Download, Filter, Calendar as CalendarIcon, Table as TableIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CATEGORIES = [
  'All', 'Food', 'Transport', 'Utilities', 'Shopping', 'Health', 'Travel', 'Entertainment', 'Other'
];

export default function Reports() {
  const { expenses } = useExpenses();
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dateMatch = isWithinInterval(e.date, {
        start: startOfDay(new Date(dateRange.start)),
        end: endOfDay(new Date(dateRange.end))
      });
      const categoryMatch = selectedCategory === 'All' || e.category === selectedCategory;
      return dateMatch && categoryMatch;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, dateRange, selectedCategory]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    // Header & Branding
    const addHeader = (data: any) => {
      // Background for header
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Logo / App Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 255, 95); // Accent color
      doc.text('ExpenseFlow', 14, 18);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255, 0.4);
      doc.text('PRECISION LEDGER SYSTEM v1.0', 14, 24);

      // Report Title
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('FINANCIAL EXPENDITURE REPORT', 14, 38);

      // Filters Info (Right side)
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`DATE RANGE: ${dateRange.start} TO ${dateRange.end}`, pageWidth - 14, 18, { align: 'right' });
      doc.text(`CATEGORY: ${selectedCategory.toUpperCase()}`, pageWidth - 14, 24, { align: 'right' });
      doc.text(`GENERATED: ${timestamp}`, pageWidth - 14, 30, { align: 'right' });
    };

    const addFooter = (data: any) => {
      const pageNumber = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`PAGE ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('CONFIDENTIAL - FOR AUTHORIZED USE ONLY', 14, pageHeight - 10);
      doc.text('POWERED BY EXPENSEFLOW AI', pageWidth - 14, pageHeight - 10, { align: 'right' });
    };

    // Table Data
    const tableColumn = ["DATE", "DESCRIPTION", "CATEGORY", "AMOUNT"];
    const tableRows = filteredExpenses.map(e => [
      format(e.date, 'yyyy-MM-dd'),
      e.description.toUpperCase(),
      e.category.toUpperCase(),
      `$${e.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 255, 95], 
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { top: 55, bottom: 20 },
      didDrawPage: (data) => {
        addHeader(data);
        addFooter(data);
      }
    });

    // Summary Page (if results exist)
    if (filteredExpenses.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, finalY, pageWidth - 14, finalY);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('REPORT SUMMARY', 14, finalY + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Transaction Count: ${filteredExpenses.length}`, 14, finalY + 22);
      doc.text(`Aggregate Expenditure:`, 14, finalY + 30);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 180, 70);
      doc.text(`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, finalY + 40);
    }

    doc.save(`ExpenseFlow_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredExpenses.map(e => ({
      Date: format(e.date, 'yyyy-MM-dd'),
      Description: e.description,
      Category: e.category,
      Amount: e.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    
    // Add summary row
    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ["Summary"],
      ["Period", `${dateRange.start} to ${dateRange.end}`],
      ["Category", selectedCategory],
      ["Total Amount", totalAmount],
      ["Total Entries", filteredExpenses.length]
    ], { origin: -1 });

    XLSX.writeFile(workbook, `ExpenseFlow_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Financial Reports</h2>
        <p className="text-sm text-foreground/40 font-mono tracking-widest uppercase">Export & Audit System v1.0_</p>
      </div>

      {/* Filters Overlay */}
      <div className="card space-y-6 bg-secondary/20 border-white/5">
        <div className="flex items-center gap-2 text-accent">
          <Filter size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Report Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">Start Date</label>
            <div className="relative group">
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="input-themed w-full pr-10 relative z-10 bg-transparent"
                style={{ colorScheme: 'dark' }}
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-accent/40 transition-colors pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">End Date</label>
            <div className="relative group">
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="input-themed w-full pr-10 relative z-10 bg-transparent"
                style={{ colorScheme: 'dark' }}
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-accent/40 transition-colors pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">Category</label>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-themed w-full appearance-none cursor-pointer pr-10"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-background text-foreground">{c}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/20">
                <Filter size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
          <button 
            onClick={exportPDF}
            className="btn-accent flex items-center gap-3 px-6 py-3"
          >
            <FileText size={18} />
            Export as PDF
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground hover:bg-white/10 transition-all font-bold text-sm"
          >
            <TableIcon size={18} />
            Export as Excel
          </button>
        </div>
      </div>

      {/* Report Summary & Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-accent/5 border-accent/20">
            <p className="text-[10px] uppercase font-bold text-accent/60 tracking-widest mb-1">Report Total</p>
            <p className="text-3xl font-mono font-bold">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="card">
            <p className="text-[10px] uppercase font-bold text-foreground/40 tracking-widest mb-1">Items Found</p>
            <p className="text-2xl font-mono font-bold">{filteredExpenses.length}</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-foreground/40 tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-foreground/40 tracking-widest">Description</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-foreground/40 tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-foreground/40 tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-foreground/60">{format(e.date, 'yyyy-MM-dd')}</td>
                      <td className="px-6 py-4 text-xs font-medium">{e.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] px-2 py-1 bg-secondary rounded font-bold uppercase tracking-widest">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-right">${e.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-foreground/20 italic text-sm">
                        No transactions found for the selected criteria_
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
