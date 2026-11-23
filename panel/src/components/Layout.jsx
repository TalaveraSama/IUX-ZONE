import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Tv2,
  Film,
  Users,
  Layers,
  UserCheck,
  CalendarClock,
  Server,
  MonitorPlay,
  LogOut,
  Tv,
  Coins,
  Menu,
  X,
  ArrowUp,
  Database,
  Zap,
  Cpu,
  Activity,
  KeyRound
} from 'lucide-react';

/**
 * IUX-ZONE Panel — XUI.One Edition (motor TVLister 24/7)
 * Shell estilo XUI.one: sidebar oscura agrupada por módulos, acento azul,
 * topbar con versión y usuario abajo (como el admin de XUI.one).
 */
export default function Layout({ user, activeTab, setActiveTab, onLogout, onOpenWebTv, children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAdmin = user?.role === 'admin';

  // Menú unificado: estructura y terminología de XUI.one, motor TVLister.
  const NAV_SECTIONS = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'reseller'] },
        { id: 'lines', label: 'Usuarios, MAG & Enigma2', icon: Users, roles: ['admin', 'reseller'] },
        { id: 'resellers', label: 'Resellers & Créditos', icon: UserCheck, roles: ['admin'] }
      ]
    },
    {
      title: 'Streams',
      items: [
        { id: 'streams', label: 'Canales en Vivo', icon: Radio, roles: ['admin'] },
        { id: 'channels247', label: 'Canales 24/7 · Playout', icon: Tv2, badge: '24/7', roles: ['admin'] },
        { id: 'vod', label: 'VOD · Películas & Series', icon: Film, roles: ['admin'] },
        { id: 'bouquets', label: 'Bouquets & Categorías', icon: Layers, roles: ['admin'] },
        { id: 'epg', label: 'EPG & Reportes', icon: CalendarClock, roles: ['admin'] }
      ]
    },
    {
      title: 'Infraestructura',
      items: [
        { id: 'headend', label: 'Nodos Cabecera · DVB', icon: Cpu, badge: 'PRO', roles: ['admin'] },
        { id: 'ingest-protocols', label: 'Ingesta RTMP/SRT/MNF', icon: Zap, badge: 'MNF', roles: ['admin'] },
        { id: 'flussonic-2312', label: 'Flussonic 23.12', icon: Zap, roles: ['admin'] },
        { id: 'wk2500-catv', label: 'Salida CATV/UDP · WK2500', icon: Tv, badge: 'CATV', roles: ['admin'] },
        { id: 'system', label: 'Servidores & Seguridad', icon: Server, roles: ['admin'] }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'xui-import', label: 'Importar XUI.one · BD', icon: Database, badge: 'XUI', roles: ['admin'] },
        { id: 'ffmpeg-engine', label: 'Motor FFmpeg', icon: Activity, badge: 'ENGINE', roles: ['admin'] },
        { id: 'access-codes', label: 'Access Codes', icon: KeyRound, roles: ['admin'] }
      ]
    }
  ];

  const flatItems = NAV_SECTIONS.flatMap((s) => s.items).filter((item) =>
    item.roles.includes(user?.role || 'admin')
  );

  const currentLabel = flatItems.find((i) => i.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex bg-[#0f1116] text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar estilo XUI.one */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[248px] bg-[#14161b] border-r border-[#262a33] flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-[#262a33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#2f7ceb] flex items-center justify-center shadow-md shadow-blue-900/40">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-[0.08em] text-white text-[15px]">
                IUX<span className="text-[#3b8bfd]">-ZONE</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                XUI.One Edition
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => item.roles.includes(user?.role || 'admin'));
            if (!items.length) return null;
            return (
              <div key={section.title} className="mb-3">
                <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileOpen(false);
                        }}
                        className={`w-full relative flex items-center justify-between pl-4 pr-3 py-2 rounded-r-md text-[13px] font-medium transition ${
                          active
                            ? 'bg-[#1c2735] text-white'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#1d2026]'
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-[#2f7ceb]" />
                        )}
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#3b8bfd]' : 'text-slate-500'}`} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded border shrink-0 ${
                              active
                                ? 'bg-[#2f7ceb]/20 text-[#6fa9ff] border-[#2f7ceb]/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="px-1 pt-1 mt-2 border-t border-[#262a33]">
            <button
              onClick={onOpenWebTv}
              className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold bg-[#102a4d] hover:bg-[#14345f] text-[#7db4ff] border border-[#2f7ceb]/40 transition"
            >
              <MonitorPlay className="w-4 h-4 text-[#3b8bfd]" />
              Portal Cliente WebTV
            </button>
          </div>
        </nav>

        {/* Usuario + salir (estilo XUI admin) */}
        <div className="p-3 border-t border-[#262a33] bg-[#111318]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{user?.username}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                {isAdmin ? 'Super Admin' : 'Reseller'}
              </div>
            </div>
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                <Coins className="w-3 h-3" />
                {user?.credits ?? 0}
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1d2026] hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-[#262a33] transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
          <div className="mt-2.5 text-center text-[10px] text-slate-600">
            © 2026 IUX-ZONE · v3.0.0 · motor TVLister
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 px-4 lg:px-6 bg-[#14161b]/95 backdrop-blur border-b border-[#262a33] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md bg-[#1d2026] text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[15px] font-semibold text-white">{currentLabel}</h1>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-[#102a4d] text-[#6fa9ff] border border-[#2f7ceb]/40 font-bold tracking-wide">
              XUI.One Edition
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Motor online
            </span>
            <button
              onClick={onOpenWebTv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2f7ceb] hover:bg-[#3b8bfd] text-white font-medium transition shadow-sm"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WebTV</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">{children}</main>

        {/* Quick Scroll Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Ir arriba"
          className="fixed bottom-5 right-5 z-20 p-2.5 rounded-full bg-[#1d2026] hover:bg-[#2f7ceb] text-slate-200 border border-[#262a33] shadow-lg transition"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
