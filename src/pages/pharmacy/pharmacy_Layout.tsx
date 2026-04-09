import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Pharmacy_Sidebar from '../../components/pharmacy/pharmacy_Sidebar'
import Pharmacy_Header from '../../components/pharmacy/pharmacy_Header'
import { useEffect, useState } from 'react'
import { PharmacySettingsProvider } from '../../contexts/PharmacySettingsContext'
import { PHARMACY_SHORTCUTS } from '../../utils/pharmacy_shortcuts'

export default function Pharmacy_Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('pharmacy.theme') as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('pharmacy.theme', theme)
    } catch { }

    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      try { html.classList.remove('dark') } catch { }
    }
  }, [theme])

  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = (t?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || !!t?.isContentEditable
      if (isTyping) return

      const ctx = { navigate, pathname: location.pathname }
      for (const s of PHARMACY_SHORTCUTS) {
        if (s.docsOnly) continue
        if (s.match(e, ctx)) {
          s.run(e, ctx)
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown as any)
    return () => window.removeEventListener('keydown', onKeyDown as any)
  }, [navigate, location.pathname])

  const shell = theme === 'dark' ? 'h-dvh bg-slate-900 text-slate-100' : 'h-dvh bg-slate-50 text-slate-900'

  return (
    <PharmacySettingsProvider>
      <div className={theme === 'dark' ? 'pharmacy-scope dark' : 'pharmacy-scope'}>
        <div className={shell}>
          <div className="sticky top-0 z-20 w-full md:border-b" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-700) 100%)', borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="flex h-14">
              <Pharmacy_Header
                variant="navy"
                onToggleSidebar={() => setCollapsed(c => !c)}
                theme={theme}
                onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              />
            </div>
          </div>

          <div className="flex">
            <Pharmacy_Sidebar collapsed={collapsed} />
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </PharmacySettingsProvider>
  )
}
