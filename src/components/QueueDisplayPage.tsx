import { useState, useEffect } from 'react';
import { supabase, QueueEntry, Department } from '../lib/supabase';
import {
  Monitor,
  Clock,
  Volume2,
  RefreshCw,
  Settings,
  User,
  CheckCircle2,
  Bell,
  Building2,
} from 'lucide-react';

export function QueueDisplayPage() {
  const [currentCalling, setCurrentCalling] = useState<(QueueEntry & { visit: any; department: any })[]>([]);
  const [allQueues, setAllQueues] = useState<Record<string, (QueueEntry & { visit: any; department: any })[]>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentlyCalled, setRecentlyCalled] = useState<{ ticket: string; patient: string; room: string; time: Date }[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const { data: depts } = await supabase.from('departments').select('*').eq('is_active', true).order('display_order');
    if (depts) {
      setDepartments(depts as Department[]);

      // Fetch queue entries for each department
      const queues: Record<string, typeof currentCalling> = {};

      for (const dept of depts) {
        const { data: entries } = await supabase
          .from('queue_entries')
          .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
          .eq('department_id', dept.id)
          .order('position')
          .limit(10);

        if (entries) {
          queues[dept.id] = entries as typeof currentCalling;

          // Find called patients
          const called = entries.filter((e: any) => e.is_called);
          if (called.length > 0) {
            const lastCalled = called[called.length - 1];
            const ticketInfo = {
              ticket: lastCalled.visit?.ticket_number,
              patient: `${lastCalled.visit?.patient?.first_name?.[0]}. ${lastCalled.visit?.patient?.last_name}`,
              room: lastCalled.room_number || dept.code,
              time: new Date(),
            };

            setRecentlyCalled((prev) => {
              if (prev[0]?.ticket !== ticketInfo.ticket) {
                return [ticketInfo, ...prev].slice(0, 5);
              }
              return prev;
            });
          }
        }
      }

      setAllQueues(queues);
      setLastUpdate(new Date());
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDepartmentColor = (code: string) => {
    switch (code) {
      case 'TRIAGE':
        return 'from-amber-500 to-orange-500';
      case 'CONSULTATION':
        return 'from-cyan-500 to-blue-500';
      case 'LAB':
        return 'from-purple-500 to-violet-500';
      case 'PHARMACY':
        return 'from-emerald-500 to-teal-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-slate-900/50 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hospital Queue Display</h1>
            <p className="text-slate-400">Current waiting status</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-bold">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-400">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              {isFullscreen ? <Settings className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Recently Called */}
        {recentlyCalled.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Now Serving
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentlyCalled.slice(0, 5).map((call, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 ${
                    index === 0
                      ? 'bg-cyan-600/30 border-cyan-400 scale-105'
                      : 'bg-slate-800/50 border-slate-700'
                  } transition-all`}
                >
                  <div className="text-center">
                    <p className={`text-lg font-bold ${index === 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {call.room}
                    </p>
                    <p className={`text-4xl font-bold mt-2 ${index === 0 ? 'text-white' : 'text-slate-300'}`}>
                      {call.ticket}
                    </p>
                    <p className={`text-lg mt-2 ${index === 0 ? 'text-white' : 'text-slate-400'}`}>
                      {call.patient}
                    </p>
                    {index === 0 && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-cyan-300">
                        <Volume2 className="w-5 h-5 animate-pulse" />
                        <span className="animate-pulse">Please proceed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Queues */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments
            .filter((d) => d.code !== 'RECEPTION')
            .map((dept) => {
              const queue = allQueues[dept.id] || [];
              return (
                <div
                  key={dept.id}
                  className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden"
                >
                  <div className={`p-4 bg-gradient-to-r ${getDepartmentColor(dept.code)}`}>
                    <h3 className="text-xl font-bold text-white">{dept.name}</h3>
                    <p className="text-white/80 text-sm">{queue.filter((e) => !e.is_called).length} waiting</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {queue.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No patients waiting</p>
                    ) : (
                      queue.slice(0, 6).map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-xl flex items-center justify-between ${
                            entry.is_called
                              ? 'bg-emerald-600/20 border border-emerald-500/50'
                              : 'bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                entry.is_called ? 'bg-emerald-600' : 'bg-slate-700'
                              }`}
                            >
                              {entry.is_called ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                            </div>
                            <div>
                              <p className="font-mono text-sm text-cyan-400">{entry.visit?.ticket_number}</p>
                              <p className="text-sm text-slate-300">
                                {entry.visit?.patient?.first_name?.[0]}. {entry.visit?.patient?.last_name}
                              </p>
                            </div>
                          </div>
                          {entry.is_called && (
                            <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-600/20 rounded-full">
                              Called
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between text-slate-500 text-sm">
          <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
          <p>Please wait for your ticket number to be called</p>
        </footer>
      </div>
    </div>
  );
}
