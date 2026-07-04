import { useState, useEffect } from 'react';
import { supabase, Visit, QueueEntry } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  Pill,
  Clock,
  User,
  CheckCircle2,
  ClipboardList,
  Package,
} from 'lucide-react';

export function PharmacyPage() {
  useAuth();
  const [queue, setQueue] = useState<(QueueEntry & { visit: Visit & { patient: any } })[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<(QueueEntry & { visit: Visit & { patient: any } }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [medicationsDispensed, setMedicationsDispensed] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const { data: depts } = await supabase.from('departments').select('*').eq('is_active', true);
    if (depts) {
      const pharmacy = depts.find((d) => d.code === 'PHARMACY');
      if (pharmacy) {
        const { data } = await supabase
          .from('queue_entries')
          .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
          .eq('department_id', pharmacy.id)
          .eq('is_called', false)
          .order('position');
        if (data) setQueue(data as unknown as typeof queue);
      }
    }
  };

  const completePharmacy = async () => {
    if (!selectedEntry) return;
    setLoading(true);

    const pharmacyNotes = `Medications Dispensed: ${medicationsDispensed}\nNotes: ${notes}`;

    await supabase
      .from('visit_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: pharmacyNotes,
      })
      .eq('visit_id', selectedEntry.visit_id)
      .eq('department_id', selectedEntry.department_id);

    await supabase
      .from('visits')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: pharmacyNotes,
      })
      .eq('id', selectedEntry.visit_id);

    await supabase.from('queue_entries').delete().eq('id', selectedEntry.id);

    setSelectedEntry(null);
    setMedicationsDispensed('');
    setNotes('');
    fetchData();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pharmacy</h1>
          <p className="text-slate-400">Dispense medications and complete patient visits</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300">
            <Clock className="w-4 h-4" />
            {queue.length} waiting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-white">Patient Queue</h2>
          {queue.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
              <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No patients in pharmacy queue</p>
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
                  onClick={() => setSelectedEntry(entry)}
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
                  <p className="text-sm text-slate-400">Ticket: {entry.visit?.ticket_number}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedEntry.visit?.patient?.first_name} {selectedEntry.visit?.patient?.last_name}
                </h2>
                <p className="text-slate-400">
                  MRN: {selectedEntry.visit?.patient?.medical_record_number}
                </p>
              </div>

              {/* Patient allergies warning */}
              {selectedEntry.visit?.patient?.allergies?.length > 0 && (
                <div className="p-4 bg-red-900/30 rounded-lg border border-red-800/50">
                  <h3 className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Allergy Alert
                  </h3>
                  <p className="text-sm text-red-300">{selectedEntry.visit.patient.allergies.join(', ')}</p>
                </div>
              )}

              {/* Previous Notes */}
              {selectedEntry.visit?.notes && (
                <div className="p-4 bg-slate-900 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    Prescription & Notes
                  </h3>
                  <pre className="text-sm text-white whitespace-pre-wrap">{selectedEntry.visit.notes}</pre>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Package className="w-4 h-4 inline mr-2 text-cyan-400" />
                  Medications Dispensed
                </label>
                <textarea
                  value={medicationsDispensed}
                  onChange={(e) => setMedicationsDispensed(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="List medications dispensed with dosage instructions..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Counseling notes, side effects discussed..."
                />
              </div>

              <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                <p className="text-sm text-emerald-400">
                  Completing pharmacy will end the patient's visit. All medications should be dispensed and proper
                  counseling provided.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={completePharmacy}
                  disabled={loading || !medicationsDispensed.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Visit
                </button>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a patient from the queue to dispense medications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
