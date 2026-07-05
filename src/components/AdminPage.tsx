import { useState, useEffect } from 'react';
import {
  getProfiles,
  getDepartments,
  createProfile,
  updateProfile,
  Profile,
  Department,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  Users,
  UserPlus,
  Edit,
  Building,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type UserForm = {
  email: string;
  full_name: string;
  role: Profile['role'];
  department_id: string;
};

export function AdminPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'departments'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>({
    email: '',
    full_name: '',
    role: 'receptionist',
    department_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getProfiles();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.full_name) return;
    setLoading(true);

    try {
      await createProfile({
        email: userForm.email,
        full_name: userForm.full_name,
        role: userForm.role,
        department_id: userForm.department_id || null,
      });

      fetchUsers();
      setShowUserForm(false);
      setUserForm({ email: '', full_name: '', role: 'receptionist', department_id: '' });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setLoading(true);

    try {
      await updateProfile(editingUser.id, {
        full_name: userForm.full_name,
        role: userForm.role,
        department_id: userForm.department_id || null,
      });
      fetchUsers();
      setEditingUser(null);
      setShowUserForm(false);
      setUserForm({ email: '', full_name: '', role: 'receptionist', department_id: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: Profile) => {
    setLoading(true);
    try {
      await updateProfile(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrator',
    receptionist: 'Receptionist',
    nurse: 'Nurse',
    doctor: 'Doctor',
    lab_tech: 'Lab Technician',
    pharmacist: 'Pharmacist',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400">Manage users and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center bg-slate-900 rounded-lg p-1">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'departments', label: 'Departments', icon: Building },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'users' | 'departments')}
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{user.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.full_name}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                        <Shield className="w-3 h-3" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {departments.find((d) => d.id === user.department_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.is_active
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {user.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({
                              email: user.email,
                              full_name: user.full_name,
                              role: user.role,
                              department_id: user.department_id || '',
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-6 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <Building className="w-8 h-8 text-cyan-400" />
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.is_active ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{dept.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">Code: {dept.code}</p>
                  <p className="text-sm text-slate-400">Prefix: {dept.prefix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create User Modal */}
      {(showUserForm || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={!!editingUser}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Profile['role'] })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Department (Optional)</label>
              <select
                value={userForm.department_id}
                onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">None</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={loading}
                className="flex-1 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserForm(false);
                  setUserForm({ email: '', full_name: '', role: 'receptionist', department_id: '' });
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
