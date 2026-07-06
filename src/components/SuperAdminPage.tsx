import { useState, useEffect } from 'react';
import {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  uploadHospitalLogo,
  getHospitalSettings,
  updateHospitalSettings,
  uploadHospitalSettingsLogo,
  Hospital,
  HospitalSettings,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Settings,
  Image,
  Save,
  X,
  CheckCircle,
} from 'lucide-react';

export function SuperAdminPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState<'hospitals' | 'settings'>('hospitals');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
  });
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hospitalsData, settingsData] = await Promise.all([
        getHospitals(),
        getHospitalSettings(),
      ]);
      setHospitals(hospitalsData);
      setSettings(settingsData);
      if (settingsData) {
        setSettingsForm({
          name: settingsData.name || '',
          address: settingsData.address || '',
          phone: settingsData.phone || '',
          email: settingsData.email || '',
          website: settingsData.website || '',
          logo_url: settingsData.logo_url || '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHospital = async () => {
    if (!hospitalForm.name || !hospitalForm.code) return;
    setLoading(true);

    try {
      await createHospital({
        name: hospitalForm.name,
        code: hospitalForm.code,
        address: hospitalForm.address || null,
        phone: hospitalForm.phone || null,
        email: hospitalForm.email || null,
      });
      fetchData();
      setShowHospitalForm(false);
      setHospitalForm({ name: '', code: '', address: '', phone: '', email: '' });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHospital = async () => {
    if (!editingHospital) return;
    setLoading(true);

    try {
      await updateHospital(editingHospital.id, {
        name: hospitalForm.name,
        code: hospitalForm.code,
        address: hospitalForm.address || null,
        phone: hospitalForm.phone || null,
        email: hospitalForm.email || null,
      });
      fetchData();
      setEditingHospital(null);
      setShowHospitalForm(false);
      setHospitalForm({ name: '', code: '', address: '', phone: '', email: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return;
    setLoading(true);
    try {
      await deleteHospital(id);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (hospitalId: string) => {
    if (!logoUrl) return;
    setLoading(true);
    try {
      await uploadHospitalLogo(hospitalId, logoUrl);
      fetchData();
      setLogoUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateHospitalSettings({
        name: settingsForm.name,
        address: settingsForm.address || null,
        phone: settingsForm.phone || null,
        email: settingsForm.email || null,
        website: settingsForm.website || null,
        logo_url: settingsForm.logo_url || null,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSettingsLogo = async () => {
    if (!settingsForm.logo_url) return;
    setLoading(true);
    try {
      await uploadHospitalSettingsLogo(settingsForm.logo_url);
      fetchData();
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
          <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
          <p className="text-slate-400">Manage hospital accounts and settings</p>
        </div>
        {activeTab === 'hospitals' && (
          <button
            onClick={() => setShowHospitalForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Hospital
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center bg-slate-900 rounded-lg p-1">
            {[
              { id: 'hospitals', label: 'Hospital Accounts', icon: Building2 },
              { id: 'settings', label: 'Hospital Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'hospitals' | 'settings')}
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

        {activeTab === 'hospitals' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitals.map((hospital) => (
                <div key={hospital.id} className="p-6 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    {hospital.logo_url ? (
                      <img src={hospital.logo_url} alt={hospital.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hospital.is_active ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {hospital.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{hospital.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">Code: {hospital.code}</p>
                  {hospital.address && <p className="text-sm text-slate-400">{hospital.address}</p>}
                  {hospital.phone && <p className="text-sm text-slate-300 mt-2">{hospital.phone}</p>}
                  {hospital.email && <p className="text-sm text-cyan-400">{hospital.email}</p>}

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <label className="block text-xs text-slate-400 mb-1">Logo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter logo image URL"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg py-1.5 px-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                      <button
                        onClick={() => handleUploadLogo(hospital.id)}
                        disabled={loading || !logoUrl}
                        className="p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingHospital(hospital);
                        setHospitalForm({
                          name: hospital.name,
                          code: hospital.code,
                          address: hospital.address || '',
                          phone: hospital.phone || '',
                          email: hospital.email || '',
                        });
                        setShowHospitalForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHospital(hospital.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hospitals.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No hospital accounts yet</p>
                <button
                  onClick={() => setShowHospitalForm(true)}
                  className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors"
                >
                  Add First Hospital
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="p-6 max-w-2xl">
            <div className="space-y-6">
              {settings.logo_url && (
                <div className="flex justify-center">
                  <img src={settings.logo_url} alt={settings.name} className="w-24 h-24 rounded-xl object-cover" />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-300 mb-2">Hospital Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Phone</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Website</label>
                <input
                  type="text"
                  value={settingsForm.website}
                  onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Logo URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settingsForm.logo_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleUploadSettingsLogo}
                    disabled={loading || !settingsForm.logo_url}
                    className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hospital Create/Edit Modal */}
      {showHospitalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingHospital ? 'Edit Hospital' : 'Create New Hospital'}
              </h3>
              <button
                onClick={() => {
                  setEditingHospital(null);
                  setShowHospitalForm(false);
                  setHospitalForm({ name: '', code: '', address: '', phone: '', email: '' });
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Hospital Name *</label>
              <input
                type="text"
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Hospital Code *</label>
              <input
                type="text"
                value={hospitalForm.code}
                onChange={(e) => setHospitalForm({ ...hospitalForm, code: e.target.value })}
                placeholder="e.g., GH001"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={hospitalForm.phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={hospitalForm.email}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={editingHospital ? handleUpdateHospital : handleCreateHospital}
                disabled={loading || !hospitalForm.name || !hospitalForm.code}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {editingHospital ? 'Update Hospital' : 'Create Hospital'}
              </button>
              <button
                onClick={() => {
                  setEditingHospital(null);
                  setShowHospitalForm(false);
                  setHospitalForm({ name: '', code: '', address: '', phone: '', email: '' });
                }}
                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
