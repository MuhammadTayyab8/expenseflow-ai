import React, { useMemo, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, Wallet, 
  BrainCircuit, Plus, User, ShoppingCart, Car, Zap, Utensils
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { getSpendingInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import Modal from './Modal';

const COLORS = ['#00FF5F', '#A855F7', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'];

const CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Shopping', 'Health', 'Travel', 'Entertainment', 'Other'
];

interface DashboardProps {
  onNavigate?: (v: any) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase font-bold text-foreground/40 tracking-widest mb-1">{payload[0].name}</p>
        <p className="text-sm font-mono font-bold text-accent">
          ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { expenses, addExpense, removeExpense, loading } = useExpenses();
  const { user } = useAuth();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Quick Add State
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthExpenses = expenses.filter(e => 
      isWithinInterval(e.date, { start: monthStart, end: monthEnd })
    );

    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const lastMonthTotal = expenses.filter(e => 
      isWithinInterval(e.date, { start: prevMonthStart, end: prevMonthEnd })
    ).reduce((acc, curr) => acc + curr.amount, 0);

    const total = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const dailyAvg = total / now.getDate();
    
    const categoryTotals = currentMonthExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0];
    const trend = lastMonthTotal === 0 ? 0 : ((total - lastMonthTotal) / lastMonthTotal) * 100;

    return { total, dailyAvg, highestCategory, trend };
  }, [expenses]);

  // Chart Data
  const chartData = useMemo(() => {
    const categoryData = Object.entries(
      expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayTotal = expenses
        .filter(e => format(e.date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { day: format(d, 'EEE'), total: dayTotal };
    });

    return { categoryData, weeklyData };
  }, [expenses]);

  const handleAIInsight = async () => {
    setAnalyzing(true);
    const insight = await getSpendingInsights(expenses);
    setAiInsight(insight);
    setAnalyzing(false);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date),
        description: formData.description,
        tags: []
      });
      setFormData({ 
        description: '', 
        amount: '', 
        category: 'Food',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (cat: string) => {
    switch(cat.toLowerCase()) {
      case 'food': return <Utensils size={16} />;
      case 'transport': return <Car size={16} />;
      case 'shopping': return <ShoppingCart size={16} />;
      case 'utilities': return <Zap size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  if (loading) return null;

  return (
    <>
    <div className="p-4 md:p-8 space-y-8 pb-32 md:pb-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-full border border-border">
          <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
            <User size={14} className="text-foreground/60" />
          </div>
          <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Monthly Spending</p>
          <p className="text-2xl font-mono font-bold">${stats.total.toLocaleString()}</p>
          <p className={`text-[10px] mt-2 ${stats.trend > 0 ? 'text-red-400' : 'text-accent'}`}>
            {stats.trend > 0 ? '↑' : '↓'} {Math.abs(stats.trend).toFixed(1)}% from last month
          </p>
        </div>
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Daily Average</p>
          <p className="text-2xl font-mono font-bold">${stats.dailyAvg.toFixed(2)}</p>
          <p className="text-[10px] text-foreground/20 mt-2 font-mono tracking-widest uppercase">Stable Path</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Highest Category</p>
          <p className="text-2xl font-mono font-bold truncate">{stats.highestCategory[0]}</p>
          <p className="text-[10px] text-foreground/20 mt-2 font-mono tracking-widest uppercase">Target Breach: 0%</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Efficiency</p>
          <p className="text-2xl font-mono font-bold">85%</p>
          <p className="text-[10px] text-accent mt-2 font-mono tracking-widest uppercase">Excellent</p>
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Weekly Spending Trend</p>
              <p className="text-[9px] text-accent/50 font-mono uppercase tracking-widest">Tap bars for AI context_scan</p>
            </div>
            <button 
              onClick={handleAIInsight}
              disabled={analyzing}
              className="flex items-center gap-2 text-[10px] font-bold text-accent hover:brightness-110"
            >
              <BrainCircuit size={14} className={analyzing ? 'animate-spin' : ''} />
              AI_INSIGHTS
            </button>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} dy={10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={<CustomTooltip />}
                />
                <Bar 
                  dataKey="total" 
                  fill="#00FF5F" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40} 
                  className="cursor-pointer"
                  onClick={handleAIInsight}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col justify-center">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-6">Category Breakdown</p>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">Insights</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {chartData.categoryData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-[9px] uppercase font-mono text-foreground/50">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em]">Recent Transactions</h3>
            <button 
              onClick={() => onNavigate?.('expenses')}
              className="text-[10px] font-bold text-accent px-3 py-1 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors uppercase"
            >
              View_All
            </button>
          </div>
          <div className="space-y-3">
            {expenses.slice(0, 3).map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-border rounded-xl transition-all hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-border flex items-center justify-center text-foreground/60">
                    {getIcon(expense.category)}
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-tight leading-none">{expense.description || expense.category}</p>
                    <p className="text-[10px] text-foreground/30 mt-1 font-mono">{format(expense.date, 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono text-sm">-${expense.amount.toFixed(2)}</p>
                  <button 
                    onClick={() => removeExpense(expense.id)}
                    className="text-[9px] text-red-500/40 hover:text-red-400 transition-all uppercase font-bold tracking-widest ml-auto block py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-6">
          <h3 className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em]">Quick Add</h3>
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Merchant / Note</label>
              <input 
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Whole Foods Market"
                className="input-themed"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Amount</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="$0.00"
                  className="input-themed"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Date</label>
                <input 
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-themed"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-themed appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-accent w-full py-4"
            >
              {isSubmitting ? 'Syncing...' : 'Add Expense'}
            </button>
          </form>
        </div>
      </section>
    </div>

    <Modal
      isOpen={!!aiInsight}
      onClose={() => setAiInsight(null)}
      title="Financial Insights"
    >
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-accent">
        <ReactMarkdown>{aiInsight || ''}</ReactMarkdown>
      </div>
    </Modal>
    </>
  );
}
