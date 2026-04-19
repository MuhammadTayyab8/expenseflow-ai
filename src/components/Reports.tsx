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
    
    // Add title
    doc.setFontSize(20);
    doc.text('ExpenseFlow Report', 14, 22);
    
    // Add Summary
    doc.setFontSize(11);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
    doc.text(`Category: ${selectedCategory}`, 14, 36);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, 42);
    doc.text(`Total Entries: ${filteredExpenses.length}`, 14, 48);

    const tableColumn = ["Date", "Description", "Category", "Amount"];
    const tableRows = filteredExpenses.map(e => [
      format(e.date, 'yyyy-MM-dd'),
      e.description,
      e.category,
      `$${e.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [0, 255, 95], textColor: [0, 0, 0] },
      styles: { fontSize: 9 }
    });

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
    <div className="p-4 md:p-8 space-y-8 pb-32">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">Start Date</label>
            <div className="relative">
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="input-themed pr-10"
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">End Date</label>
            <div className="relative">
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="input-themed pr-10"
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-foreground/40 ml-1 tracking-widest">Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-themed appearance-none cursor-pointer"
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-background text-foreground">{c}</option>)}
            </select>
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
