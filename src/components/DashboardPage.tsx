import { useState, useEffect } from 'react';
import {
  getVisits,
  getDepartments,
  getQueue,
  getStats,
  Visit,
  Department,
  Stats,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  Users,
  UserCheck,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  TestTube,
  Pill,
  ClipboardList,
} from 'lucide-react';

export function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total_patients: 0,
    waiting: 0,
    in_progress: 0,
    completed_today: 0,
  });
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [queueByDepartment, setQueueByDepartment] = useState<Record<string, number>>({});
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsData = await getStats();
      setStats(statsData);

      // Fetch recent visits
      const visits = await getVisits();
      setRecentVisits(visits.slice(0, 8));

      // Fetch departments
      const depts = await getDepartments();
      setDepartments(depts);

      // Fetch queue counts
      const queueData = await getQueue();
      const counts: Record<string, number> = {};
      for (const entry of queueData) {
        if (!entry.is_called) {
          counts[entry.department_id] = (counts[entry.department_id] || 0) + 1;
        }
      }
      setQueueByDepartment(counts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'in_progress':
        return 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30';
      case 'completed':
        return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'transferred':
        return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      default:
        return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {profile?.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_patients}</p>
          <p className="text-sm text-slate-400">Total Patients</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.in_progress}</p>
          <p className="text-sm text-slate-400">Active Visits</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completed_today}</p>
          <p className="text-sm text-slate-400">Completed Today</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.waiting}</p>
          <p className="text-sm text-slate-400">In Queue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Recent Visits</h2>
          </div>
          <div className="p-4">
            {recentVisits.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No recent visits</p>
            ) : (
              <div className="space-y-3">
                {recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-mono text-cyan-400">{visit.ticket_number}</p>
                        <p className="text-white font-medium">
                          {visit.patient?.first_name} {visit.patient?.last_name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {visit.chief_complaint?.slice(0, 50) || 'No complaint recorded'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          visit.status
                        )}`}
                      >
                        {visit.status.replace('_', ' ')}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        {getPriorityIcon(visit.priority)}
                        <span className="text-xs text-slate-500">
                          {new Date(visit.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Queue by Department */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Queue Status</h2>
          </div>
          <div className="p-4 space-y-3">
            {departments
              .filter((d) => d.code !== 'RECEPTION')
              .map((dept) => {
                const count = queueByDepartment[dept.id] || 0;
                const getIcon = () => {
                  switch (dept.code) {
                    case 'TRIAGE':
                      return <ClipboardList className="w-5 h-5" />;
                    case 'CONSULTATION':
                      return <Stethoscope className="w-5 h-5" />;
                    case 'LAB':
                      return <TestTube className="w-5 h-5" />;
                    case 'PHARMACY':
                      return <Pill className="w-5 h-5" />;
                    default:
                      return <UserCheck className="w-5 h-5" />;
                  }
                };
                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center text-cyan-400">
                        {getIcon()}
                      </div>
                      <span className="text-white font-medium">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold ${count > 5 ? 'text-amber-400' : 'text-white'}`}
                      >
                        {count}
                      </span>
                      <p className="text-xs text-slate-500">waiting</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
