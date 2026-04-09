import { NavLink, useNavigate } from 'react-router-dom'
import { hospitalApi } from '../../utils/api'
import { LayoutDashboard, Users, Stethoscope, ScrollText, Bell, Search, FileText, Repeat2 } from 'lucide-react'
import { useState } from 'react'

import { ensureModuleSessionForPortal, getSwitchTargetsCache, isSwitchMode, setSwitchMode, type SwitchTarget } from '../../utils/portalSwitch'

type NavItem = { to: string; label: string; end?: boolean; icon: any }

const nav: NavItem[] = [
  { to: '/doctor', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/patient-search', label: 'Patient Search', icon: Search },
  { to: '/doctor/prescription', label: 'Prescription', icon: Stethoscope },
  { to: '/doctor/prescription-history', label: 'Prescription History', icon: ScrollText },
  { to: '/doctor/reports', label: 'Reports', icon: FileText },
  { to: '/doctor/settings', label: 'Settings', icon: Bell },
]

export default function Doctor_Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate()
  const [switchOpen, setSwitchOpen] = useState(false)
  const logout = async () => {
    try {
      const raw = localStorage.getItem('doctor.session')
      const u = raw ? JSON.parse(raw) : null
      await hospitalApi.logoutHospitalUser(u?.username||'doctor')
    } catch {}
    try { localStorage.removeItem('doctor.session') } catch {}
    navigate('/hospital/login')
  }

  const doSwitch = (t: SwitchTarget) => {
    try {
      const raw = localStorage.getItem('doctor.session') || localStorage.getItem('hospital.session') || localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      ensureModuleSessionForPortal(t.portal as any, { username: t.username || u?.username || 'admin', role: t.role || u?.role || 'admin' })
      setSwitchMode('doctor', t.portal as any)
    } catch {
      setSwitchMode('doctor', t.portal as any)
    }
    setSwitchOpen(false)
    if (t.portal === 'hospital') navigate('/hospital')
    else if (t.portal === 'finance') navigate('/finance')
    else if (t.portal === 'lab') navigate('/lab')
    else if (t.portal === 'pharmacy') navigate('/pharmacy')
    else if (t.portal === 'diagnostic') navigate('/diagnostic')
    else navigate('/doctor')
  }
  return (
    <>
      <aside
        className={`hidden md:flex ${collapsed ? 'md:w-14' : 'md:w-56'} md:flex-none md:shrink-0 md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:flex-col md:border-r`}
        style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
      >
      <nav className={`diagnostic-scroll flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'} space-y-1`}>
        {nav.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : item.label}
              style={({ isActive }) => (isActive ? ({ background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-700) 100%)' } as any) : undefined)}
              className={({ isActive }) => {
                const base = collapsed
                  ? 'rounded-md p-2 text-sm font-medium flex items-center justify-center'
                  : 'rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2'
                const active = isActive
                  ? 'text-white'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                return `${base} ${active}`
              }}
              end={item.end}
            >
              {({ isActive }) => (
                <>
                  <Icon className={collapsed ? (isActive ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-700') : (isActive ? 'h-4 w-4 text-white' : 'h-4 w-4 text-slate-700')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      <div className={collapsed ? 'p-2' : 'p-3'}>
        {isSwitchMode() && (
          <button
            type="button"
            onClick={() => setSwitchOpen(true)}
            title={collapsed ? 'Switch' : undefined}
            className={collapsed ? 'mb-2 w-full inline-flex items-center justify-center rounded-md p-2 text-sm font-medium' : 'mb-2 w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium'}
            style={{ backgroundColor: '#ffffff', color: 'var(--navy)', border: '1px solid var(--navy)' }}
            onMouseEnter={e => { try { ;(e.currentTarget as any).style.backgroundColor = 'rgba(15,45,92,0.06)' } catch {} }}
            onMouseLeave={e => { try { ;(e.currentTarget as any).style.backgroundColor = '#ffffff' } catch {} }}
          >
            <Repeat2 className={collapsed ? 'h-5 w-5' : 'h-4 w-4'} /> {!collapsed && 'Switch'}
          </button>
        )}
        <button
          title={collapsed ? 'Logout' : undefined}
          onClick={logout}
          className={collapsed ? 'w-full inline-flex items-center justify-center rounded-md p-2 text-sm font-medium' : 'w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium'}
          style={{ backgroundColor: '#ffffff', color: 'var(--navy)', border: '1px solid var(--navy)' }}
          onMouseEnter={e => { try { ;(e.currentTarget as any).style.backgroundColor = 'rgba(15,45,92,0.06)' } catch {} }}
          onMouseLeave={e => { try { ;(e.currentTarget as any).style.backgroundColor = '#ffffff' } catch {} }}
        >
          <span className="sr-only">Logout</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={collapsed ? 'h-5 w-5' : 'h-4 w-4'}><path d="M8.25 4.5A2.25 2.25 0 0 1 10.5 2.25h6A2.25 2.25 0 0 1 18.75 4.5v15A2.25 2.25 0 0 1 16.5 21.75h-6A2.25 2.25 0 0 1 8.25 19.5v-3.75a.75.75 0 0 1 1.5 0v3.75c0 .414.336.75.75.75h6a.75.75 0 0 0 .75-.75v-15a.75.75 0 0 0-.75-.75h-6a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 1-1.5 0V4.5Z"/><path d="M12.22 8.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H3.75a.75.75 0 0 1 0-1.5h9.44l-.97-.97a.75.75 0 0 1 0-1.06Z"/></svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
      </aside>

      {switchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between px-5 py-3 text-base font-semibold text-white" style={{ background: 'linear-gradient(90deg, var(--navy) 0%, #2563eb 100%)' }}>
              <div>Switch Portal</div>
              <button type="button" onClick={() => setSwitchOpen(false)} className="rounded-md px-2 py-1 text-sm font-semibold text-white/90 hover:bg-white/10">✕</button>
            </div>
            <div className="space-y-3 p-5">
              <div className="text-sm text-slate-700">Select a portal to open without login.</div>
              <div className="max-h-80 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  {getSwitchTargetsCache().map(t => (
                    <button
                      key={`${t.portal}:${t.username || ''}`}
                      type="button"
                      onClick={() => doSwitch(t)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={() => setSwitchOpen(false)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
