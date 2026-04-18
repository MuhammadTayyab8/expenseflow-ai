import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Bell, Moon, Smartphone, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsView() {
  const { user, isAdmin, logout } = useAuth();

  const sections = [
    {
      title: 'Profile Context',
      items: [
        { icon: User, label: 'Identity Settings', sub: user?.email, action: null },
        { icon: Shield, label: 'Access Level', sub: isAdmin ? 'System Administrator' : 'Standard User', action: null },
      ]
    },
    {
      title: 'Environment',
      items: [
        { icon: Bell, label: 'Notifications', sub: 'Critical updates only', action: 'toggle' },
        { icon: Moon, label: 'Night Mode', sub: 'System default', action: 'toggle' },
        { icon: Smartphone, label: 'Biometrics', sub: 'Not configured', action: 'link' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: HelpCircle, label: 'Support & Docs', sub: 'v2.4.0-stable', action: 'link' },
        { icon: LogOut, label: 'Terminate Session', sub: 'Secure logout', action: 'logout', danger: true },
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-sm text-foreground/40 font-mono tracking-widest uppercase">Configuration Node_</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-foreground/30 tracking-[0.2em] ml-4">{section.title}</h3>
            <div className="card divide-y divide-white/5 overflow-hidden">
              {section.items.map((item, iIdx) => (
                <button 
                  key={iIdx}
                  onClick={() => item.action === 'logout' && logout()}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.danger ? 'bg-red-500/10 text-red-400' : 'bg-secondary text-foreground/60'}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : 'text-foreground'}`}>{item.label}</p>
                      <p className="text-[10px] text-foreground/30 font-mono">{item.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-foreground/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-foreground/20 font-mono uppercase tracking-[0.3em]">ExpenseFlow Encryption Protocol active</p>
      </div>
    </div>
  );
}
