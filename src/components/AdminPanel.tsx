import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, Users, Database, ArrowLeft, UserCog, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const { user: authUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      if (!isAdmin) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userData = querySnapshot.docs.map(doc => doc.data() as SystemUser);
        setUsers(userData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [isAdmin]);

  const toggleRole = async (targetUid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', targetUid), { role: newRole });
      setUsers(users.map(u => u.uid === targetUid ? { ...u, role: newRole as any } : u));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
        <Shield size={32} className="text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-foreground/40 text-sm max-w-xs">Privileged access is required to view the system administration terminal.</p>
      </div>
      <button onClick={onBack} className="text-accent underline font-bold tracking-widest text-xs uppercase">Return to Safety</button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-32 md:pb-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 bg-secondary border border-border rounded-xl text-foreground/40 hover:text-accent transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Admin</h1>
          <p className="text-[10px] text-foreground/40 font-mono tracking-widest uppercase mt-1">Instance Control Terminal v2.0</p>
        </div>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Total System Users</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-mono font-bold tracking-tighter">{users.length}</p>
            <Users size={20} className="text-accent opacity-20" />
          </div>
        </div>
        <div className="card">
          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Elevated Admins</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-mono font-bold tracking-tighter">{users.filter(u => u.role === 'admin').length}</p>
            <Shield size={20} className="text-purple-400 opacity-20" />
          </div>
        </div>
      </section>

      {/* Main Table-like list */}
      <section className="max-w-4xl">
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-accent" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Member Registry</span>
            </div>
            {loading && <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
          </div>
          
          <div className="divide-y divide-border/40">
            {users.map(u => (
              <div key={u.uid} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-foreground/60 border border-border">
                    {u.displayName?.slice(0, 1) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight leading-none">{u.displayName || 'Unnamed User'}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Mail size={10} className="text-foreground/20" />
                      <p className="text-[10px] text-foreground/30 font-mono truncate max-w-[200px]">{u.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-14 sm:ml-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${u.role === 'admin' ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border bg-black/20 text-foreground/30'}`}>
                    {u.role === 'admin' && <ShieldCheck size={10} />}
                    {u.role}
                  </div>
                  
                  {u.uid !== authUser?.uid && (
                    <button 
                      onClick={() => toggleRole(u.uid, u.role)}
                      className="p-2 bg-secondary border border-border rounded-lg text-foreground/20 hover:text-accent hover:border-accent/40 transition-all sm:opacity-0 group-hover:opacity-100"
                      title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                    >
                      <UserCog size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {!loading && users.length === 0 && (
              <div className="p-20 text-center opacity-20">
                <Database size={40} className="mx-auto mb-2" />
                <p className="text-xs font-mono uppercase tracking-[0.2em]">No records found</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
