import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, History as HistoryIcon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', icon: FileText, label: 'Generator Naskah' },
    { to: '/riwayat', icon: HistoryIcon, label: 'Riwayat Naskah' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-800">
      {/* Header / Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">GEN-SAT <span className="text-blue-600">2026</span></span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex gap-6 text-sm font-medium text-slate-600 hidden md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-5 pt-5'
                      : 'hover:text-blue-600 transition-colors pb-5 pt-5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{user?.displayName || 'Guru'}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 overflow-hidden flex-shrink-0">
              <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || user?.email}`} alt="profile" />
            </div>
            <button
              onClick={signOut}
              className="p-2 ml-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Steps (Optional on smaller devices or adapted) */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col gap-2">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Navigasi Utama</h3>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  isActive
                    ? 'flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer'
                }
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-sm font-semibold">{link.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Status Penyimpanan</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-xs text-slate-600">Terhubung ke Database</p>
            </div>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 overflow-auto flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
