import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronUp, Stethoscope, Pill, ClipboardList, Landmark, User } from 'lucide-react'
import { hospitalApi } from '../utils/api'

export type Portal = {
  key: string
  label: string
  path: string
  sessionKey: string
  icon: any
}

const portals: Portal[] = [
  { key: 'hospital', label: 'Hospital', path: '/hospital', sessionKey: 'hospital.session', icon: Building2 },
  { key: 'doctor', label: 'Doctor', path: '/doctor', sessionKey: 'doctor.session', icon: Stethoscope },
  { key: 'pharmacy', label: 'Pharmacy', path: '/pharmacy', sessionKey: 'pharmacy.user', icon: Pill },
  { key: 'finance', label: 'Finance', path: '/finance/pharmacy-reports', sessionKey: 'finance.session', icon: Landmark },
]

type Props = {
  collapsed?: boolean
  currentPortal: string
}

type Doctor = {
  _id: string
  name: string
  username?: string
  specialization?: string
  phone?: string
}

export default function SwitchPortal({ collapsed = false, currentPortal }: Props) {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [showDoctorDialog, setShowDoctorDialog] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  // Check if current user is admin (only check current portal's session)
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const sessionKeys = [
          'hospital.session',
          'doctor.session',
          'pharmacy.user',
          'pharmacy.session',
          'lab.session',
          'lab.user',
          'reception.user',
          'reception.session',
          'diagnostic.user',
          'diagnostic.session',
          'aesthetic.session',
          'finance.session',
          'user'
        ]

        for (const key of sessionKeys) {
          const raw = localStorage.getItem(key)
          if (raw) {
            try {
              const u = JSON.parse(raw)
              if (u?.role && String(u.role).toLowerCase() === 'admin') {
                setIsAdmin(true)
                return
              }
            } catch {
              // Ignore parse errors for individual keys
            }
          }
        }
        setIsAdmin(false)
      } catch {
        setIsAdmin(false)
      }
    }
    
    checkAdmin()
    // Listen for storage changes
    window.addEventListener('storage', checkAdmin)
    return () => window.removeEventListener('storage', checkAdmin)
  }, [currentPortal])

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const handleSwitch = (portal: Portal) => {
    if (portal.key === currentPortal) {
      setOpen(false)
      return
    }

    // If switching to doctor portal, show doctor selection dialog
    if (portal.key === 'doctor') {
      setShowDoctorDialog(true)
      setOpen(false)
      return
    }

    try {
      // Get current user data from any existing session
      let userData: any = null
      const sessionKeys = [
        'hospital.session',
        'doctor.session',
        'pharmacy.user',
        'pharmacy.session',
        'lab.session',
        'reception.user',
        'reception.session',
        'diagnostic.user',
        'aesthetic.session',
        'finance.session',
        'user'
      ]
      
      for (const key of sessionKeys) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.username || parsed?.name || parsed?.id) {
            userData = parsed
            break
          }
        }
      }

      // Create admin session for target portal if user is admin
      if (userData && isAdmin) {
        // Exclude id/_id - each portal has different user schemas
        // Carrying over IDs causes CastError (e.g., "admin" string as doctorId)
        const { id, _id, ...safeUserData } = userData
        
        const adminSession = {
          ...safeUserData,
          role: 'admin',
          // Preserve common fields
          username: userData.username || userData.name || 'admin',
          name: userData.name || userData.username || 'Admin',
          // Don't set id - let the target portal resolve it from its own schema
        }
        
        // Set session for target portal
        localStorage.setItem(portal.sessionKey, JSON.stringify(adminSession))
        
        // Also set a generic user key for compatibility
        localStorage.setItem('user', JSON.stringify(adminSession))
      }

      // Navigate to target portal (no reload needed - React Router handles it)
      navigate(portal.path)
    } catch {
      // Fallback: just navigate
      navigate(portal.path)
    }
    setOpen(false)
  }

  // Fetch doctors when dialog opens
  useEffect(() => {
    if (!showDoctorDialog) return
    setLoadingDoctors(true)
    hospitalApi.listDoctors({ limit: 500 })
      .then((res: any) => {
        const docs: Doctor[] = res?.doctors || res?.items || []
        setDoctors(docs)
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false))
  }, [showDoctorDialog])

  const filteredDoctors = doctors.filter(d =>
    d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.username?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase())
  )

  const handleDoctorSelect = (doctor: Doctor) => {
    const portal = portals.find(p => p.key === 'doctor')
    if (!portal) return

    try {
      // Create doctor session with selected doctor's info
      const doctorSession = {
        id: doctor._id,
        name: doctor.name,
        username: doctor.username || doctor.name,
        role: 'doctor',
        specialization: doctor.specialization || '',
        phone: doctor.phone || '',
      }

      // Set session for doctor portal
      localStorage.setItem(portal.sessionKey, JSON.stringify(doctorSession))
      localStorage.setItem('user', JSON.stringify(doctorSession))

      // Navigate to doctor portal
      navigate(portal.path)
    } catch {
      navigate(portal.path)
    }
    setShowDoctorDialog(false)
    setOpen(false)
    setDoctorSearch('')
  }

  // Only show for admin users
  if (!isAdmin) return null

  const currentPortalData = portals.find(p => p.key === currentPortal) || portals[0]
  const CurrentIcon = currentPortalData.icon

  return (
    <>
      <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={collapsed ? 'Switch Portal' : undefined}
        className={collapsed
          ? 'w-full rounded-md p-2 text-sm font-medium flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          : 'w-full rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }
        style={{ backgroundColor: 'rgba(15,45,92,0.04)' }}
      >
        <CurrentIcon className={collapsed ? 'h-5 w-5' : 'h-4 w-4'} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Switch Portal</span>
            <ChevronUp className={`h-4 w-4 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
          </>
        )}
      </button>

      {open && (
        <div className={`absolute z-50 ${collapsed ? 'left-full bottom-0 ml-2' : 'bottom-full left-0 right-0 mb-1'} max-h-64 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg`}>
          <div className="py-1">
            {portals.map((portal) => {
              const Icon = portal.icon
              const isActive = portal.key === currentPortal
              return (
                <button
                  key={portal.key}
                  type="button"
                  onClick={() => handleSwitch(portal)}
                  disabled={isActive}
                  className={`w-full px-3 py-2 text-sm flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{portal.label}</span>
                  {isActive && <span className="ml-auto text-xs text-slate-400">Current</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>

    {/* Doctor Selection Dialog */}
    {showDoctorDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-base font-semibold text-slate-800">Select Doctor</h3>
            <p className="text-xs text-slate-500">Choose which doctor portal to switch to</p>
          </div>
          <div className="p-4">
            <input
              type="text"
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              placeholder="Search doctors by name, username, or specialization..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />
            <div className="mt-3 max-h-64 overflow-auto rounded-md border border-slate-200">
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                  Loading doctors...
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  {doctorSearch ? 'No doctors found' : 'No doctors available'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor._id}
                      type="button"
                      onClick={() => handleDoctorSelect(doctor)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{doctor.name}</div>
                        <div className="text-xs text-slate-500">
                          {doctor.specialization || 'No specialization'}
                          {doctor.username && ` • ${doctor.username}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowDoctorDialog(false)
                setDoctorSearch('')
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

export { portals }
