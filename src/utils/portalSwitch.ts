export type SwitchPortal = 'hospital' | 'reception' | 'finance' | 'lab' | 'pharmacy' | 'diagnostic' | 'doctor' | 'aesthetic'
export type SwitchTarget = { portal: SwitchPortal; label: string; username?: string; role?: string }

const DEFAULT_TARGETS: SwitchTarget[] = [
  { portal: 'hospital', label: 'Hospital (admin)' },
  { portal: 'finance', label: 'Finance (admin)' },
  { portal: 'pharmacy', label: 'Pharmacy (admin)' },
]

export function isSwitchMode(): boolean {
  try {
    const raw = localStorage.getItem('portalSwitch.enabled')
    if (raw === 'true') return true
    const targets = getSwitchTargetsCache()
    return targets.length > 0
  } catch {
    return true
  }
}

export function setSwitchMode(fromPortal: string, toPortal: SwitchPortal): void {
  try {
    localStorage.setItem('portalSwitch.enabled', 'true')
    localStorage.setItem('portalSwitch.from', String(fromPortal || 'doctor'))
    localStorage.setItem('portalSwitch.to', String(toPortal))
    const recent = { at: new Date().toISOString(), from: String(fromPortal || 'doctor'), to: String(toPortal) }
    localStorage.setItem('portalSwitch.recent', JSON.stringify(recent))
  } catch {}
}

export function getSwitchTargetsCache(): SwitchTarget[] {
  try {
    const raw = localStorage.getItem('portalSwitch.targets')
    const saved = raw ? JSON.parse(raw) : null
    const arr: SwitchTarget[] = Array.isArray(saved) ? saved : DEFAULT_TARGETS
    return arr.map(t => ({
      portal: t.portal,
      username: t.username || 'admin',
      role: t.role || 'admin',
      label: t.label || buildLabel(t.portal, t.username || 'admin'),
    }))
  } catch {
    return DEFAULT_TARGETS
  }
}

export function ensureModuleSessionForPortal(portal: SwitchPortal, user?: { username?: string; role?: string }): void {
  try {
    const username = user?.username || 'admin'
    const role = user?.role || 'admin'
    const key = `${portal}.session`
    const sess = { id: 'switch', username, role, name: username }
    localStorage.setItem(key, JSON.stringify(sess))
    const global = { portal, username, role, at: new Date().toISOString() }
    localStorage.setItem('portalSwitch.user', JSON.stringify(global))
  } catch {}
}

function buildLabel(portal: SwitchPortal, username: string): string {
  const names: Record<SwitchPortal, string> = {
    hospital: 'Hospital',
    reception: 'Reception',
    finance: 'Finance',
    lab: 'Lab',
    pharmacy: 'Pharmacy',
    diagnostic: 'Diagnostic',
    doctor: 'Doctor',
    aesthetic: 'Aesthetic',
  }
  const p = names[portal] || portal
  return `${p} (${username})`
}
