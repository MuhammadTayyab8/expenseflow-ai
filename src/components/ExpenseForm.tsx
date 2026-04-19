import React, { useState, useRef } from 'react';
import { Plus, X, Calendar as CalendarIcon, DollarSign, Tag, FileText, ChevronDown, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { scanReceipt } from '../services/geminiService';

const CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Shopping', 'Health', 'Travel', 'Entertainment', 'Other'
];

interface ExpenseFormProps {
  onSubmit: (data: { amount: number; category: string; date: Date; description: string; tags: string[] }) => Promise<void>;
  onClose: () => void;
  initialData?: {
    amount: number;
    category: string;
    date: Date;
    description: string;
    tags: string[];
  };
}

export default function ExpenseForm({ onSubmit, onClose, initialData }: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'Food');
  const [date, setDate] = useState(initialData ? format(initialData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success?: boolean; itemsCount?: number } | null>(null);
  const [scanError, setScanError] = useState('');


  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setScanning(true);
  //   try {
  //     const reader = new FileReader();
  //     reader.onloadend = async () => {
  //       const base64String = reader.result as string;
  //       const items = await scanReceipt(base64String);
        
  //       // Loop and add items
  //       for (const item of items) {
  //         await onSubmit({
  //           amount: item.amount,
  //           category: item.category,
  //           date: new Date(item.date),
  //           description: item.description,
  //           tags: ['scanned-receipt']
  //         });
  //       }
        
  //       setScanResult({ success: true, itemsCount: items.length });
  //       setTimeout(() => onClose(), 2000);
  //     };
  //     reader.readAsDataURL(file);
  //   } catch (err) {
  //     console.error('OCR Error:', err);
  //   } finally {
  //     setScanning(false);
  //   }
  // };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setScanning(true);
  setScanResult(null);
  setScanError('');

  const reader = new FileReader();

  reader.onloadend = async () => {
    try {
      const base64String = reader.result as string;
      const items = await scanReceipt(base64String);

      for (const item of items) {
        const parsedDate = new Date(item.date);
        const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        
        await onSubmit({
          amount: item.amount,
          category: item.category,
          date: finalDate,
          description: item.description,
          tags: ['scanned-receipt']
        });
      }

      setScanResult({
        success: true,
        itemsCount: items.length
      });

      setTimeout(() => onClose(), 2000);

    } catch (err) {
      console.error('Receipt scan error:', err);
      setScanError('Receipt scanning failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  reader.readAsDataURL(file);
};

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed h-screen inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md max-h-[75vh] md:max-h-[85vh] overflow-y-auto relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-accent/20"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-foreground/20 hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <div className="space-y-4 p-2">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">New Expenditure</h2>
            <p className="text-[10px] text-foreground/40 font-mono tracking-widest uppercase">Transaction Logger v1.4</p>
          </div>

          <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center gap-4 group hover:border-accent/40 transition-all cursor-pointer relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {scanning ? (
              <div className="flex flex-col items-center gap-2 z-50">
                <Loader2 className="animate-spin text-accent" />
                <p className="text-[10px] uppercase font-bold text-accent tracking-tighter">AI Scanning Receipt...</p>
              </div>
            ) : scanResult?.success ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="text-accent" />
                <p className="text-[10px] uppercase font-bold text-accent tracking-tighter">Sync Complete: {scanResult.itemsCount} Items Added</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Scan Receipt</p>
                  <p className="text-[10px] text-foreground/40 uppercase mt-1">Automatic Item Extraction</p>
                </div>
              </>
            )}
            
            {scanning && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-accent/10 w-1/3 blur-xl pointer-events-none"
              />
            )}
          </div>

          {scanError && (
            <p className="text-red-400 text-xs font-medium">
              {scanError}
            </p>
          )}

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] uppercase font-bold text-foreground/20">or Manual Entry</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Total Amount ($)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-themed w-full py-5 text-3xl font-mono border-accent/40 bg-accent/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Expense Type</label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-themed w-full appearance-none cursor-pointer pr-10"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Event Date</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-themed w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                className="input-themed w-full min-h-[100px] resize-none py-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-foreground/40 font-bold ml-1">Tags (Comma Sep)</label>
              <input 
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="food, dinner, sushi"
                className="input-themed w-full"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="btn-accent w-full py-4 flex items-center justify-center gap-2 group"
              >
                {loading ? 'Processing...' : 'Sync to Ledger'}
                {!loading && <Plus size={18} className="transition-transform group-hover:rotate-90" />}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
