import { ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth';
import { NotificationBell } from '../lib/notifications';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  TestTube,
  Pill,
  ClipboardList,
  UserCheck,
  MonitorPlay,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react';

type MenuItem = {
  icon: ReactNode;
  label: string;
  path: string;
  roles?: Array<'superadmin' | 'admin' | 'receptionist' | 'nurse' | 'doctor' | 'lab_tech' | 'pharmacist'>;
};

const menuItems: MenuItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: 'dashboard' },
  { icon: <UserCheck className="w-5 h-5" />, label: 'Reception', path: 'reception', roles: ['receptionist', 'admin', 'superadmin'] },
  { icon: <ClipboardList className="w-5 h-5" />, label: 'Triage', path: 'triage', roles: ['nurse', 'admin', 'superadmin'] },
  { icon: <Stethoscope className="w-5 h-5" />, label: 'Consultation', path: 'consultation', roles: ['doctor', 'admin', 'superadmin'] },
  { icon: <TestTube className="w-5 h-5" />, label: 'Laboratory', path: 'lab', roles: ['lab_tech', 'admin', 'superadmin'] },
  { icon: <Pill className="w-5 h-5" />, label: 'Pharmacy', path: 'pharmacy', roles: ['pharmacist', 'admin', 'superadmin'] },
  { icon: <MonitorPlay className="w-5 h-5" />, label: 'Queue Display', path: 'display' },
  { icon: <Building2 className="w-5 h-5" />, label: 'Hospital Accounts', path: 'superadmin', roles: ['superadmin'] },
  { icon: <Users className="w-5 h-5" />, label: 'User Management', path: 'users', roles: ['admin'] },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: 'settings', roles: ['admin'] },
];

type DashboardLayoutProps = {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(profile?.role || 'receptionist')
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

  const handleNav = (path: string) => {
    onNavigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">HMS</h1>
            <p className="text-xs text-slate-400">Hospital System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1 hover:bg-slate-700 rounded"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {filteredMenuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                currentPage === item.path
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-700 rounded-lg"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-3">
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {profile?.role && roleLabels[profile.role]}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-slate-700">
                        <p className="font-medium text-white">{profile?.full_name}</p>
                        <p className="text-sm text-slate-400">{profile?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-600/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
