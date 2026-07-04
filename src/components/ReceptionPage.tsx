import { useState, useEffect } from 'react';
import { supabase, Patient, Visit, Department, QueueEntry } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  Search,
  UserPlus,
  Ticket,
  Clock,
  Phone,
  Mail,
  MapPin,
  Users,
} from 'lucide-react';

type PatientForm = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | '';
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  allergies: string;
};

type VisitForm = {
  chief_complaint: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string;
};

export function ReceptionPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'register' | 'queue'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentVisits, setRecentVisits] = useState<(Visit & { patient: Patient })[]>([]);
  const [queue, setQueue] = useState<(QueueEntry & { visit: Visit & { patient: Patient } })[]>([]);

  const [patientForm, setPatientForm] = useState<PatientForm>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    allergies: '',
  });

  const [visitForm, setVisitForm] = useState<VisitForm>({
    chief_complaint: '',
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchRecentVisits();
    fetchQueue();
  }, []);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').eq('is_active', true).order('display_order');
    if (data) setDepartments(data as Department[]);
  };

  const fetchRecentVisits = async () => {
    const { data } = await supabase
      .from('visits')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecentVisits(data as unknown as (Visit & { patient: Patient })[]);
  };

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('queue_entries')
      .select('*, visit:visits(*, patient:patients(*)), department:departments(*)')
      .eq('is_called', false)
      .order('position');
    if (data) setQueue(data as unknown as (QueueEntry & { visit: Visit & { patient: Patient } })[]);
  };

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,medical_record_number.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(10);
    if (data) setSearchResults(data as Patient[]);
    setLoading(false);
  };

  const registerPatient = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: patientForm.first_name,
          last_name: patientForm.last_name,
          date_of_birth: patientForm.date_of_birth || null,
          gender: patientForm.gender || null,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          address: patientForm.address || null,
          emergency_contact_name: patientForm.emergency_contact_name || null,
          emergency_contact_phone: patientForm.emergency_contact_phone || null,
          blood_type: patientForm.blood_type || null,
          allergies: patientForm.allergies ? patientForm.allergies.split(',').map((a) => a.trim()) : [],
        })
        .select()
        .single();

      if (patientError) throw patientError;
      if (patientData) {
        setSelectedPatient(patientData as Patient);
        setPatientForm({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: '',
          phone: '',
          email: '',
          address: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          blood_type: '',
          allergies: '',
        });
        setActiveTab('search');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVisit = async () => {
    if (!selectedPatient) return;
    setLoading(true);

    try {
      const receptionDept = departments.find((d) => d.code === 'RECEPTION');
      const triageDept = departments.find((d) => d.code === 'TRIAGE');

      const ticketNum = `R${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(
        Math.floor(Math.random() * 900) + 100
      )}`;

      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .insert({
          ticket_number: ticketNum,
          patient_id: selectedPatient.id,
          current_department_id: receptionDept?.id,
          status: 'waiting',
          priority: visitForm.priority,
          chief_complaint: visitForm.chief_complaint || null,
          notes: visitForm.notes || null,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      if (visitData) {
        // Create visit steps for each department
        const steps = departments.map((dept, index) => ({
          visit_id: (visitData as Visit).id,
          department_id: dept.id,
          status: index === 0 ? 'in_progress' : 'pending',
        }));

        await supabase.from('visit_steps').insert(steps);

        // Add to queue for triage
        const queuePosition = queue.filter((q) => q.department_id === triageDept?.id).length + 1;
        await supabase.from('queue_entries').insert({
          visit_id: (visitData as Visit).id,
          department_id: triageDept?.id,
          position: queuePosition,
        });

        setVisitForm({ chief_complaint: '', priority: 'normal', notes: '' });
        setSelectedPatient(null);
        fetchRecentVisits();
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reception</h1>
          <p className="text-slate-400">Patient registration and ticket management</p>
        </div>
        <div className="flex items-center bg-slate-800 rounded-lg p-1">
          {[
            { id: 'search', label: 'Search Patient', icon: Search },
            { id: 'register', label: 'Register New', icon: UserPlus },
            { id: 'queue', label: 'Queue', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'search' | 'register' | 'queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                    placeholder="Search by name, MRN, or phone..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  onClick={searchPatients}
                  disabled={loading}
                  className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'bg-cyan-600/20 border-cyan-500'
                          : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-slate-400">MRN: {patient.medical_record_number}</p>
                        </div>
                        <div className="text-right">
                          {patient.phone && (
                            <p className="text-sm text-slate-400">{patient.phone}</p>
                          )}
                          {patient.date_of_birth && (
                            <p className="text-xs text-slate-500">
                              DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="bg-slate-800/50 rounded-xl border border-cyan-500/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Create Visit</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-400">Patient</p>
                      <p className="text-white font-medium">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">MRN</p>
                      <p className="text-white font-medium">{selectedPatient.medical_record_number}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chief Complaint
                    </label>
                    <textarea
                      value={visitForm.chief_complaint}
                      onChange={(e) => setVisitForm({ ...visitForm, chief_complaint: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Describe the patient's main concern..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setVisitForm({ ...visitForm, priority: p })}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                            visitForm.priority === p
                              ? p === 'urgent'
                                ? 'bg-red-600 text-white'
                                : p === 'high'
                                ? 'bg-orange-600 text-white'
                                : p === 'normal'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={visitForm.notes}
                      onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Any additional information..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={createVisit}
                      disabled={loading || !selectedPatient}
                      className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-5 h-5" />
                      Generate Ticket
                    </button>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Recent Visits
              </h3>
              <div className="space-y-2">
                {recentVisits.slice(0, 5).map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3 bg-slate-900 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-cyan-400">{visit.ticket_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          visit.status === 'waiting'
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : visit.status === 'in_progress'
                            ? 'bg-cyan-600/20 text-cyan-400'
                            : 'bg-emerald-600/20 text-emerald-400'
                        }`}
                      >
                        {visit.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-white">
                      {visit.patient?.first_name} {visit.patient?.last_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(visit.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Register New Patient</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, gender: e.target.value as PatientForm['gender'] })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <textarea
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={patientForm.emergency_contact_name}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Blood Type
                  </label>
                  <select
                    value={patientForm.blood_type}
                    onChange={(e) => setPatientForm({ ...patientForm, blood_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select blood type</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Allergies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Penicillin, Aspirin"
                  />
                </div>
              </div>

              <button
                onClick={registerPatient}
                disabled={loading || !patientForm.first_name || !patientForm.last_name}
                className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                Register Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Queue</h3>
          <div className="space-y-2">
            {queue.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No patients in queue</p>
            ) : (
              queue.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {entry.visit?.patient?.first_name} {entry.visit?.patient?.last_name}
                      </p>
                      <p className="text-sm text-slate-400">
                        Ticket: {entry.visit?.ticket_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-400">{entry.department?.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
