import { useState, useEffect } from 'react';
import { supabase, Visit, QueueEntry, Department } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  Activity,
  Clock,
  Heart,
  AlertTriangle,
  User,
  Send,
} from 'lucide-react';

type VitalSigns = {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  temperature: string;
  weight: string;
  height: string;
  respiratory_rate: string;
  oxygen_saturation: string;
  notes: string;
};

export function TriagePage() {
  useAuth();
  const [queue, setQueue] = useState<(QueueEntry & { visit: Visit & { patient: any } })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<(QueueEntry & { visit: Visit & { patient: any } }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    notes: '',
  });
  const [transferTo, setTransferTo] = useState<string>('');

  useEffect(() => {
    fetchQueue();
    fetchDepartments();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    const triageDept = departments.find((d) => d.code === 'TRIAGE');
    if (!triageDept) {
      const { data: depts } = await supabase.from('departments').select('*');
      if (depts) {
        setDepartments(depts as Department[]);
        const triage = depts.find((d) => d.code === 'TRIAGE');
        if (triage) {
          const { data } = await supabase
            .from('queue_entries')
            .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
            .eq('department_id', triage.id)
            .eq('is_called', false)
            .order('position');
          if (data) setQueue(data as unknown as typeof queue);
        }
      }
    } else {
      const { data } = await supabase
        .from('queue_entries')
        .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
        .eq('department_id', triageDept.id)
        .eq('is_called', false)
        .order('position');
      if (data) setQueue(data as unknown as typeof queue);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').eq('is_active', true);
    if (data) setDepartments(data as Department[]);
  };

  const completeTriage = async () => {
    if (!selectedEntry) return;
    setLoading(true);

    const targetDept = departments.find((d) => d.id === transferTo);
    if (!targetDept) {
      alert('Please select a department to transfer to');
      setLoading(false);
      return;
    }

    // Save vital signs as notes
    const notes = `Vital Signs:
BP: ${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic} mmHg
HR: ${vitalSigns.heart_rate} bpm
Temp: ${vitalSigns.temperature}°C
Weight: ${vitalSigns.weight} kg
Height: ${vitalSigns.height} cm
RR: ${vitalSigns.respiratory_rate} /min
SpO2: ${vitalSigns.oxygen_saturation}%
Notes: ${vitalSigns.notes}`;

    // Update visit step
    await supabase
      .from('visit_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes,
      })
      .eq('visit_id', selectedEntry.visit_id)
      .eq('department_id', selectedEntry.department_id);

    // Update visit current department
    await supabase
      .from('visits')
      .update({
        current_department_id: targetDept.id,
        status: 'waiting',
        notes,
      })
      .eq('id', selectedEntry.visit_id);

    // Delete current queue entry
    await supabase.from('queue_entries').delete().eq('id', selectedEntry.id);

    // Create new queue entry for target department
    const { data: existingQueue } = await supabase
      .from('queue_entries')
      .select('id')
      .eq('department_id', targetDept.id)
      .eq('is_called', false);

    await supabase.from('queue_entries').insert({
      visit_id: selectedEntry.visit_id,
      department_id: targetDept.id,
      position: (existingQueue?.length || 0) + 1,
    });

    // Update next step to in_progress
    await supabase
      .from('visit_steps')
      .update({ status: 'in_progress' })
      .eq('visit_id', selectedEntry.visit_id)
      .eq('department_id', targetDept.id);

    setSelectedEntry(null);
    setVitalSigns({
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      weight: '',
      height: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      notes: '',
    });
    setTransferTo('');
    fetchQueue();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Triage</h1>
          <p className="text-slate-400">Assess patients and direct to appropriate departments</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300">
            <Clock className="w-4 h-4" />
            {queue.length} waiting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-white">Patient Queue</h2>
          {queue.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No patients in triage queue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedEntry?.id === entry.id
                      ? 'bg-cyan-600/20 border-cyan-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => {
                    setSelectedEntry(entry);
                    const visitNotes = entry.visit?.notes || '';
                    if (visitNotes.includes('BP:')) {
                      const bpMatch = visitNotes.match(/BP: (\d+)\/(\d+)/);
                      if (bpMatch) {
                        setVitalSigns((v) => ({
                          ...v,
                          blood_pressure_systolic: bpMatch[1],
                          blood_pressure_diastolic: bpMatch[2],
                        }));
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-medium text-white">
                    {entry.visit?.patient?.first_name} {entry.visit?.patient?.last_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    Ticket: {entry.visit?.ticket_number}
                  </p>
                  {entry.visit?.priority === 'urgent' && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Triage Form */}
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedEntry.visit?.patient?.first_name} {selectedEntry.visit?.patient?.last_name}
                  </h2>
                  <p className="text-slate-400">
                    MRN: {selectedEntry.visit?.patient?.medical_record_number} | Ticket: {selectedEntry.visit?.ticket_number}
                  </p>
                </div>
                {selectedEntry.visit?.priority === 'urgent' ? (
                  <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium">
                    Urgent Priority
                  </span>
                ) : null}
              </div>

              <div className="p-4 bg-slate-900 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Chief Complaint</h3>
                <p className="text-white">{selectedEntry.visit?.chief_complaint || 'Not specified'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">BP Systolic</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.blood_pressure_systolic}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, blood_pressure_systolic: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="120"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">mmHg</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">BP Diastolic</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.blood_pressure_diastolic}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, blood_pressure_diastolic: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="80"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">mmHg</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Heart Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.heart_rate}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, heart_rate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="72"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">bpm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Temperature</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={vitalSigns.temperature}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="36.8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">°C</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Weight</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.weight}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="70"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kg</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Height</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.height}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="170"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Resp. Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.respiratory_rate}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, respiratory_rate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/min</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">SpO2</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vitalSigns.oxygen_saturation}
                        onChange={(e) => setVitalSigns({ ...vitalSigns, oxygen_saturation: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="98"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Additional Notes</label>
                <textarea
                  value={vitalSigns.notes}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Any observations or patient concerns..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Transfer To Department
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {departments
                    .filter((d) => d.code !== 'RECEPTION' && d.code !== 'TRIAGE')
                    .map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => setTransferTo(dept.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          transferTo === dept.id
                            ? 'bg-cyan-600/20 border-cyan-500'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <p className="font-medium text-white">{dept.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{dept.prefix}-XXX-XXX</p>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={completeTriage}
                  disabled={loading || !transferTo}
                  className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Complete & Transfer
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setTransferTo('');
                  }}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a patient from the queue to begin triage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
