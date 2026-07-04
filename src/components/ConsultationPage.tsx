import { useState, useEffect } from 'react';
import { supabase, Visit, QueueEntry, Department } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  Stethoscope,
  Clock,
  User,
  AlertTriangle,
  Send,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pill,
  TestTube,
} from 'lucide-react';

export function ConsultationPage() {
  useAuth();
  const [queue, setQueue] = useState<(QueueEntry & { visit: Visit & { patient: any } })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<(QueueEntry & { visit: Visit & { patient: any } }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [labOrders, setLabOrders] = useState('');
  const [notes, setNotes] = useState('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [endVisit, setEndVisit] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const { data: depts } = await supabase.from('departments').select('*').eq('is_active', true);
    if (depts) {
      setDepartments(depts as Department[]);
      const consultation = depts.find((d) => d.code === 'CONSULTATION');
      if (consultation) {
        const { data } = await supabase
          .from('queue_entries')
          .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
          .eq('department_id', consultation.id)
          .eq('is_called', false)
          .order('position');
        if (data) setQueue(data as unknown as typeof queue);
      }
    }
  };

  const completeConsultation = async () => {
    if (!selectedEntry) return;
    setLoading(true);

    const consultationNotes = `Diagnosis: ${diagnosis}
Prescription: ${prescription}
Lab Orders: ${labOrders}
Notes: ${notes}`;

    // Update visit step
    await supabase
      .from('visit_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: consultationNotes,
      })
      .eq('visit_id', selectedEntry.visit_id)
      .eq('department_id', selectedEntry.department_id);

    if (endVisit) {
      // End the visit completely
      await supabase
        .from('visits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: consultationNotes,
        })
        .eq('id', selectedEntry.visit_id);

      await supabase.from('queue_entries').delete().eq('id', selectedEntry.id);
    } else if (transferTo) {
      const targetDept = departments.find((d) => d.id === transferTo);
      if (targetDept) {
        // Update visit current department
        await supabase
          .from('visits')
          .update({
            current_department_id: targetDept.id,
            status: 'waiting',
            notes: consultationNotes,
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
      }
    }

    setSelectedEntry(null);
    setDiagnosis('');
    setPrescription('');
    setLabOrders('');
    setNotes('');
    setTransferTo('');
    setEndVisit(false);
    fetchData();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Consultation</h1>
          <p className="text-slate-400">Doctor examination and diagnosis</p>
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
              <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No patients in consultation queue</p>
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

        {/* Consultation Form */}
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
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedEntry.visit?.patient?.date_of_birth && (
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-400">DOB</p>
                    <p className="text-sm text-white">
                      {new Date(selectedEntry.visit.patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedEntry.visit?.patient?.blood_type && (
                  <div className="p-3 bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-400">Blood Type</p>
                    <p className="text-sm text-white">{selectedEntry.visit.patient.blood_type}</p>
                  </div>
                )}
                {selectedEntry.visit?.patient?.allergies?.length > 0 && (
                  <div className="p-3 bg-red-900/30 rounded-lg border border-red-800/50">
                    <p className="text-xs text-red-400">Allergies</p>
                    <p className="text-sm text-red-300">{selectedEntry.visit.patient.allergies.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Triage Notes */}
              {selectedEntry.visit?.notes && (
                <div className="p-4 bg-slate-900 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    Triage Notes
                  </h3>
                  <pre className="text-sm text-white whitespace-pre-wrap">{selectedEntry.visit.notes}</pre>
                </div>
              )}

              {/* Chief Complaint */}
              <div className="p-4 bg-slate-900 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Chief Complaint</h3>
                <p className="text-white">{selectedEntry.visit?.chief_complaint || 'Not specified'}</p>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2 text-cyan-400" />
                  Diagnosis
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Primary diagnosis and findings..."
                  required
                />
              </div>

              {/* Prescription */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Pill className="w-4 h-4 inline mr-2 text-cyan-400" />
                  Prescription
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Medications prescribed..."
                />
              </div>

              {/* Lab Orders */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <TestTube className="w-4 h-4 inline mr-2 text-cyan-400" />
                  Lab Orders
                </label>
                <textarea
                  value={labOrders}
                  onChange={(e) => setLabOrders(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Laboratory tests requested..."
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Any additional observations..."
                />
              </div>

              {/* Transfer Options */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Transfer Options
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setEndVisit(false);
                      setTransferTo(departments.find((d) => d.code === 'LAB')?.id || '');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      transferTo === departments.find((d) => d.code === 'LAB')?.id
                        ? 'bg-cyan-600/20 border-cyan-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <TestTube className="w-6 h-6 text-cyan-400 mb-2" />
                    <p className="font-medium text-white">Send to Lab</p>
                  </button>
                  <button
                    onClick={() => {
                      setEndVisit(false);
                      setTransferTo(departments.find((d) => d.code === 'PHARMACY')?.id || '');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      transferTo === departments.find((d) => d.code === 'PHARMACY')?.id
                        ? 'bg-cyan-600/20 border-cyan-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Pill className="w-6 h-6 text-cyan-400 mb-2" />
                    <p className="font-medium text-white">Send to Pharmacy</p>
                  </button>
                  <button
                    onClick={() => {
                      setEndVisit(true);
                      setTransferTo('');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      endVisit
                        ? 'bg-emerald-600/20 border-emerald-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
                    <p className="font-medium text-white">End Visit</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={completeConsultation}
                  disabled={loading || (!diagnosis.trim() && !endVisit)}
                  className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {endVisit ? 'Complete Visit' : 'Complete & Transfer'}
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setTransferTo('');
                    setEndVisit(false);
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
              <p className="text-slate-400">Select a patient from the queue to begin consultation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
