import React from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format } from 'date-fns';

const COLORS = ['#00FF5F', '#00DF5F', '#00BF5F', '#009F5F', '#007F5F', '#005F5F'];

export default function AnalyticsView() {
  const { expenses } = useExpenses();

  const currentMonth = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
  const lastMonth = { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) };

  const currentSpend = expenses
    .filter(e => isWithinInterval(e.date, currentMonth))
    .reduce((val, e) => val + e.amount, 0);

  const lastSpend = expenses
    .filter(e => isWithinInterval(e.date, lastMonth))
    .reduce((val, e) => val + e.amount, 0);

  const diff = currentSpend - lastSpend;
  const isUp = diff > 0;

  const categoryData = Object.entries(
    expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Last 30 days daily trend
  const dailyTrend = Array.from({ length: 30 }, (_, i) => {
    const date = subMonths(new Date(), 1);
    date.setDate(date.getDate() + i);
    const dayName = format(date, 'MMM dd');
    const amount = expenses
      .filter(e => format(e.date, 'MMM dd') === dayName)
      .reduce((acc, e) => acc + e.amount, 0);
    return { name: dayName, amount };
  });

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">System Analytics</h2>
        <p className="text-sm text-foreground/40 font-mono tracking-widest uppercase">Deep Insight Engine v2.0_</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between text-foreground/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Monthly Delta</span>
            <Activity size={16} />
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-mono font-bold">${currentSpend.toFixed(2)}</span>
            <div className={`flex items-center text-[10px] pb-1 ${isUp ? 'text-red-400' : 'text-accent'}`}>
              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {Math.abs(diff).toFixed(2)} vs L/M
            </div>
          </div>
        </div>
        
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between text-foreground/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Record Count</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-3xl font-mono font-bold">{expenses.length} Entries</div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between text-foreground/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Averge Ticket</span>
            <Activity size={16} />
          </div>
          <div className="text-3xl font-mono font-bold">${expenses.length ? (expenses.reduce((a,b)=>a+b.amount, 0)/expenses.length).toFixed(2) : '0.00'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" />
              30D Spending Velocity
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF5F" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00FF5F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#555" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#555" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#00FF5F', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#00FF5F" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon size={16} className="text-accent" />
              Category Power Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#00FF5F', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
