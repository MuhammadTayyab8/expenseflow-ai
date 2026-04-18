import React, { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { format } from 'date-fns';
import { Trash2, ShoppingBag, Coffee, Car, Home, Heart, Plane, Film, MoreHorizontal, Search, Plus, X, Calendar, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExpenseForm from './ExpenseForm';
import { Expense } from '../hooks/useExpenses';

const CATEGORY_ICONS: Record<string, any> = {
  Food: Coffee,
  Transport: Car,
  Utilities: Home,
  Shopping: ShoppingBag,
  Health: Heart,
  Travel: Plane,
  Entertainment: Film,
  Other: MoreHorizontal,
};

const CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Shopping', 'Health', 'Travel', 'Entertainment', 'Other'
];

export default function ExpensesList() {
  const { expenses, loading, removeExpense, addExpense, updateExpense } = useExpenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date),
      });
      setFormData({ 
        description: '', 
        amount: '', 
        category: 'Food',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Financial Ledger</h2>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all border border-accent/20"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-sm text-foreground/40 font-mono tracking-widest uppercase">Transaction History_</p>
        </div>
        
        <div className="relative group max-w-md w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-accent transition-colors" />
          <input 
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-themed w-full pl-12 py-3 bg-secondary/50"
          />
        </div>
      </div>

      <AnimatePresence>
      {(isFormOpen || editingExpense) && (
        <ExpenseForm
          initialData={editingExpense ? {
            amount: editingExpense.amount,
            category: editingExpense.category,
            date: editingExpense.date,
            description: editingExpense.description,
            tags: editingExpense.tags || []
          } : undefined}
          onSubmit={async (data) => {
            if (editingExpense) {
              await updateExpense(editingExpense.id, data);
            } else {
              await addExpense(data);
            }
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingExpense(null);
          }}
        />
      )}
    </AnimatePresence>

{/*
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card border-accent/20 bg-accent/[0.02] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">New Transaction_</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-foreground/40 hover:text-foreground">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1 tracking-widest">Description</label>
                  <input 
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. AWS Cloud Services"
                    className="input-themed bg-secondary/30"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1 tracking-widest">Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="$0.00"
                    className="input-themed bg-secondary/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1 tracking-widest">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-themed bg-secondary/30 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-background">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-start-1">
                  <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1 tracking-widest">Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" />
                    <input 
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input-themed bg-secondary/30 pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="md:col-start-4 flex items-end">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-accent w-full py-2.5 h-[42px] font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,95,0.2)]"
                  >
                    {isSubmitting ? 'Syncing...' : 'Register_'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
*/}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-foreground/20 font-mono animate-pulse">Syncing transactions...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-foreground/20 font-mono italic">No records found matching criteria_</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-foreground/30 tracking-[0.2em]">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.map((expense) => {
                  const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={expense.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,95,0.4)]" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{expense.description}</span>
                          <span className="text-[10px] text-foreground/30 font-mono mt-1">
                            {format(expense.date, 'dd MMM yyyy')} | CID_{expense.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 group-hover:text-accent transition-colors">
                          <Icon size={14} className="opacity-40" />
                          <span className="text-xs uppercase tracking-wider">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-lg">${expense.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingExpense(expense)}
                            className="p-2 text-foreground/20 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => removeExpense(expense.id)}
                            className="p-2 text-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
