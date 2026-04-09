import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { labApi } from '../../utils/api'
import {
  LayoutDashboard, ClipboardPlus, ListChecks, FlaskConical, FileText, BarChart3, PieChart,
  Boxes, Truck, History, Undo2, RotateCcw, CalendarCheck, Users, Settings as Cog,
  CalendarDays, UserCog, ScrollText, Receipt, Droplets, PackageOpen, UserPlus, Wallet, Calculator,
  Banknote, ChevronDown, ChevronRight, LogOut
} from 'lucide-react'
import SwitchPortal from '../SwitchPortal'

type Item = { to: string; label: string; end?: boolean; icon: any }
type NavItem = Item | { label: string; icon: any; children: Item[] }

const nav: NavItem[] = [
  { to: '/lab', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/lab/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/lab/orders', label: 'Token Generation', icon: ClipboardPlus },
  { to: '/lab/tracking', label: 'Sample Tracking', icon: ListChecks },
  { to: '/lab/barcodes', label: 'Barcodes', icon: ListChecks },
  { to: '/lab/results', label: 'Result Entry', icon: FileText },
  { to: '/lab/reports', label: 'Reports Generator', icon: BarChart3 },
  { to: '/lab/settings', label: 'Settings', icon: Cog },
  { to: '/lab/income-ledger', label: 'Income Ledger', icon: Banknote },
  { to: '/lab/tests', label: 'Test Catalog', icon: FlaskConical },
  { to: '/lab/patient-profiling', label: 'Patient Profiling', icon: Users },
  { to: '/lab/report-approval', label: 'Report Approval', icon: FileText },
  { to: '/lab/referrals', label: 'Referrals', icon: ListChecks },
  { to: '/lab/reports-summary', label: 'Reports', icon: PieChart },
  { to: '/lab/inventory', label: 'Inventory', icon: Boxes },
  { to: '/lab/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/lab/purchase-history', label: 'Purchase History', icon: History },
  { to: '/lab/supplier-returns', label: 'Supplier Returns', icon: Undo2 },
  { to: '/lab/return-history', label: 'Return History', icon: RotateCcw },
  { to: '/lab/bb/donors', label: 'BB • Donors', icon: UserPlus },
  { to: '/lab/bb/inventory', label: 'BB • Inventory', icon: PackageOpen },
  { to: '/lab/bb/receivers', label: 'BB • Receivers', icon: Droplets },
  {
    label: 'Staff Management',
    icon: Users,
    children: [
      { to: '/lab/staff-attendance', label: 'Staff Attendance', icon: CalendarCheck },
      { to: '/lab/staff-management', label: 'Staff Management', icon: Users },
      { to: '/lab/staff-settings', label: 'Staff Settings', icon: Cog },
      { to: '/lab/staff-monthly', label: 'Staff Monthly', icon: CalendarDays },
    ]
  },
  { to: '/lab/expenses', label: 'Expenses', icon: Receipt },
  { to: '/lab/pay-in-out', label: 'Pay In / Out', icon: Wallet },
  { to: '/lab/manager-cash-count', label: 'Manager Cash Count', icon: Calculator },
  { to: '/lab/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/lab/user-management', label: 'User Management', icon: UserCog },
  { to: '/lab/sidebar-permissions', label: 'Sidebar Permissions', icon: Cog },
]

export const labSidebarNav = nav

function isParentItem(item: NavItem): item is { label: string; icon: any; children: Item[] } {
  return 'children' in item
}

export default function Lab_Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState<string>('admin')
  const [items, setItems] = useState(nav)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Auto-expand Staff Management if on a staff page
    const path = location.pathname
    if (path.startsWith('/lab/staff-')) {
      return new Set(['Staff Management'])
    }
    return new Set()
  })

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const logout = async () => {
    try { await labApi.logoutUser() } catch {}
    try { localStorage.removeItem('lab.session') } catch {}
    navigate('/lab/login')
  }

  useEffect(()=>{
    try {
      const raw = localStorage.getItem('lab.session') || localStorage.getItem('user')
      if (raw){
        const u = JSON.parse(raw)
        if (u?.role) setRole(String(u.role).toLowerCase())
      }
    } catch {}
  }, [])

  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{
        const res: any = await labApi.listSidebarPermissions(role)
        const doc = Array.isArray(res) ? res[0] : res
        const map = new Map<string, any>()
        const perms = (doc?.permissions || []) as Array<{ path: string; visible?: boolean; order?: number }>
        for (const p of perms) map.set(p.path, p)
        
        // Flatten for permission checking but keep structure
        const filterNav = (navItems: NavItem[]): NavItem[] => {
          return navItems.filter(item => {
            if (isParentItem(item)) {
              // For parent items, check if any child is visible
              const visibleChildren = item.children.filter(child => {
                const perm = map.get(child.to)
                return perm ? perm.visible !== false : true
              })
              return visibleChildren.length > 0
            }
            if (item.to === '/lab/sidebar-permissions' && String(role||'').toLowerCase() !== 'admin') return false
            const perm = map.get(item.to)
            return perm ? perm.visible !== false : true
          }).map(item => {
            if (isParentItem(item)) {
              return {
                ...item,
                children: item.children.filter(child => {
                  const perm = map.get(child.to)
                  return perm ? perm.visible !== false : true
                })
              }
            }
            return item
          })
        }
        
        const sorted = (navItems: NavItem[]): NavItem[] => {
          return navItems.sort((a, b) => {
            const getOrder = (item: NavItem) => {
              if (isParentItem(item)) return Number.MAX_SAFE_INTEGER
              return map.get(item.to)?.order ?? Number.MAX_SAFE_INTEGER
            }
            const oa = getOrder(a)
            const ob = getOrder(b)
            if (oa !== ob) return oa - ob
            const ia = nav.findIndex(n => n === a || (!isParentItem(n) && !isParentItem(a) && n.to === a.to))
            const ib = nav.findIndex(n => n === b || (!isParentItem(n) && !isParentItem(b) && n.to === b.to))
            return ia - ib
          })
        }
        
        const computed = sorted(filterNav(nav))
        if (mounted) setItems(computed)
      } catch { if (mounted) setItems(nav) }
    })()
    return ()=>{ mounted = false }
  }, [role])

  const renderNavItem = (item: NavItem) => {
    if (isParentItem(item)) {
      const Icon = item.icon
      const isExpanded = expandedMenus.has(item.label)
      const isActive = item.children.some(child => location.pathname === child.to || location.pathname.startsWith(child.to + '/'))
      
      if (collapsed) {
        // In collapsed mode, just show the parent icon and navigate to first child on click
        return (
          <NavLink
            key={item.label}
            to={item.children[0]?.to || '#'}
            title={item.label}
            className={({ isActive: navActive }) => {
              const base = 'rounded-md p-2 text-sm font-medium flex items-center justify-center'
              const active = navActive || isActive
                ? 'text-white'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              return `${base} ${active}`
            }}
          >
            {({ isActive: navActive }) => (
              <Icon className={navActive || isActive ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-700'} />
            )}
          </NavLink>
        )
      }
      
      return (
        <div key={item.label} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleMenu(item.label)}
            className={`w-full rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2 ${
              isActive
                ? 'text-white'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            style={isActive ? { background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-700) 100%)' } : undefined}
          >
            <Icon className={isActive ? 'h-4 w-4 text-white' : 'h-4 w-4 text-slate-700'} />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isExpanded && (
            <div className="ml-4 pl-2 border-l border-slate-200 space-y-1">
              {item.children.map(child => {
                const ChildIcon = child.icon
                return (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive: childActive }) => {
                      const base = 'rounded-md px-3 py-1.5 text-sm flex items-center gap-2'
                      const active = childActive
                        ? 'text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      return `${base} ${active}`
                    }}
                    style={({ isActive: childActive }) => childActive ? { background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-700) 100%)' } : undefined}
                    end={child.end}
                  >
                    {({ isActive: childActive }) => (
                      <>
                        <ChildIcon className={childActive ? 'h-3.5 w-3.5 text-white' : 'h-3.5 w-3.5 text-slate-600'} />
                        <span>{child.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )
    }
    
    // Regular item
    const Icon = item.icon
    return (
      <NavLink
        key={item.to}
        to={item.to}
        title={collapsed ? item.label : undefined}
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
            {!collapsed && <span>{item.label}</span>}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <>
      <style>{`
        .scrollbar-hide-on-hover {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide-on-hover::-webkit-scrollbar {
          width: 0;
          background: transparent;
        }
        .scrollbar-hide-on-hover:hover {
          scrollbar-width: thin;
        }
        .scrollbar-hide-on-hover:hover::-webkit-scrollbar {
          width: 1px;
          background: transparent;
        }
        .scrollbar-hide-on-hover:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .scrollbar-hide-on-hover:hover::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <aside
        className={`hidden md:flex ${collapsed ? 'md:w-16' : 'md:w-60'} md:flex-none md:shrink-0 md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:flex-col md:border-r`}
      style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
    >
      <nav className={`scrollbar-hide-on-hover flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'} space-y-1`}>
        {items.map(item => renderNavItem(item))}
        <div className={collapsed ? 'mt-2 mb-2' : 'mt-4 mb-2'}>
          <SwitchPortal collapsed={collapsed} currentPortal="lab" />
        </div>
        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={collapsed ? 'w-full inline-flex items-center justify-center rounded-md p-2 text-sm font-medium' : 'w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium'}
          style={{ backgroundColor: '#ffffff', color: 'var(--navy)', border: '1px solid var(--navy)' }}
          onMouseEnter={e => { try { ;(e.currentTarget as any).style.backgroundColor = 'rgba(15,45,92,0.06)' } catch {} }}
          onMouseLeave={e => { try { ;(e.currentTarget as any).style.backgroundColor = '#ffffff' } catch {} }}
        ><LogOut className={collapsed ? 'h-5 w-5' : 'h-4 w-4'} /> {!collapsed && 'Logout'}</button>
      </nav>
      </aside>
    </>
  )
}
