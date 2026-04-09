import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Grid, List, Eye, EyeOff, History } from 'lucide-react'
import Pharmacy_POSCart from '../../components/pharmacy/pharmacy_POSCart'
import Pharmacy_ProcessPaymentDialog from '../../components/pharmacy/pharmacy_ProcessPaymentDialog'
import Pharmacy_POSReceiptDialog from '../../components/pharmacy/pharmacy_POSReceiptDialog'
import Pharmacy_CustomerHistoryDialog from '../../components/pharmacy/pharmacy_CustomerHistoryDialog'
import Pharmacy_AuthVerifyDialog from '../../components/pharmacy/Pharmacy_AuthVerifyDialog'
import { usePharmacySettings } from '../../contexts/PharmacySettingsContext'
import { pharmacyApi, hospitalApi } from '../../utils/api'

type Product = {
  id: string
  name: string
  genericName?: string
  manufacturer?: string
  salePerPack: number
  unitsPerPack: number
  unitPrice: number
  stock: number
  barcode?: string
  defaultDiscountPct?: number
  lineTaxType?: 'percent' | 'fixed'
  lineTaxValue?: number
}

type CartLine = {
  id: string
  productId: string
  name: string
  unitPrice: number
  qty: number
  discountRs?: number
  discountPct?: number
  maxDiscountPct?: number
  lineTaxType?: 'percent' | 'fixed'
  lineTaxValue?: number
  packMode?: 'loose' | 'pack'
}

export default function Pharmacy_POS() {
  const navigate = useNavigate()
  const { settings } = usePharmacySettings()
  const [query, setQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cart, setCart] = useState<CartLine[]>([])
  const [payOpen, setPayOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [payment, setPayment] = useState<{ method: 'cash' | 'credit'; customer?: string; customerId?: string; customerPhone?: string; cashReceived?: number; changeReturn?: number } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productIndex, setProductIndex] = useState<Record<string, Product>>({})
  const [busy, setBusy] = useState(false)
  const [receiptNo] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sel, setSel] = useState(0)
  const [hideOutOfStock, setHideOutOfStock] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacy.pos.hideOutOfStock')
      return saved ? JSON.parse(saved) : true // Default to true (Show Meds open by default)
    } catch {
      return true // Default to true (Show Meds open by default)
    }
  })

  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; qty: number; price: number }>>([])
  const [lastSale, setLastSale] = useState<any>(null)
  const [billDiscountPct, setBillDiscountPct] = useState<number>(0)
  const [billGstType] = useState<'percent' | 'fixed'>('percent')
  const [billGstValue, setBillGstValue] = useState<number>(settings.taxRate || 0)
  const [linkedPrescriptionId, setLinkedPrescriptionId] = useState<string | null>(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [onAuthVerified, setOnAuthVerified] = useState<(() => void) | null>(null)

  const [customerPhone, setCustomerPhone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<{ id: string; name: string; phone: string; lastDispense?: any } | null>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const customerPhoneInputRef = useRef<HTMLInputElement>(null)
  const patientNameRef = useRef<string>('') // Track patient name from prescription
  const prescriptionPatientRef = useRef<{ name: string; phone: string } | null>(null) // Persists across StrictMode remounts
  const customerPhoneWasSetRef = useRef(false) // Track if phone field was ever non-empty

  const searchCustomer = async (phone: string, preserveName?: string) => {
    const p = (phone || '').replace(/-/g, '').trim()
    if (!p || p.length < 3) return
    setSearchingCustomer(true)
    try {
      const res: any = await pharmacyApi.getCustomerByPhone(p)
      if (res?.customer) {
        // If preserveName is provided and database has Walk-in, use preserveName instead
        const dbName = res.customer.name || ''
        const finalName = preserveName && (dbName === 'Walk-in' || !dbName) ? preserveName : dbName

        console.log('searchCustomer: dbName=', dbName, 'preserveName=', preserveName, 'finalName=', finalName)

        setFoundCustomer({
          id: res.customer._id || res.customer.id,
          name: finalName,
          phone: res.customer.phone,
          lastDispense: res.lastDispense
        })
        console.log('searchCustomer: Set foundCustomer with name:', finalName)
      } else {
        setFoundCustomer(null)
      }
    } catch {
      setFoundCustomer(null)
    } finally {
      setSearchingCustomer(false)
    }
  }

  useEffect(() => {
    const p = (customerPhone || '').replace(/-/g, '').trim()
    if (p.length === 11) {
      customerPhoneWasSetRef.current = true
      // Use patientNameRef to preserve name from prescription
      const preserveName = patientNameRef.current || foundCustomer?.name || ''
      console.log('Auto-search triggered with preserveName:', preserveName)
      searchCustomer(p, preserveName)
    } else if (p.length === 0 && customerPhoneWasSetRef.current) {
      // Only clear when user actively typed then cleared the phone field
      customerPhoneWasSetRef.current = false
      setFoundCustomer(null)
      patientNameRef.current = ''
      prescriptionPatientRef.current = null
    }
  }, [customerPhone]) // Don't add foundCustomer to deps to avoid infinite loop

  const addToCart = useCallback(async (pid: string, opts?: { qty?: number; focusQty?: boolean }) => {
    let p = productIndex[pid] || products.find(pp => pp.id === pid)

    if (!p) {
      try {
        // pid might be an ID or a Name. 
        // We search for it.
        const res: any = await pharmacyApi.listInventory({ search: pid, limit: 50 })
        const items = res?.items || []

        // 1. Try exact ID match
        let it = items.find((i: any) => String(i._id || i.id || i.key) === String(pid))

        // 2. Try exact name match (case insensitive)
        if (!it) {
          it = items.find((i: any) => i.name?.toLowerCase().trim() === pid.toLowerCase().trim())
        }

        // 3. Try partial name match (starts with)
        if (!it) {
          it = items.find((i: any) => i.name?.toLowerCase().trim().startsWith(pid.toLowerCase().trim()))
        }

        // 4. If still no match, just take the first result if it exists
        if (!it && items.length > 0 && !/^[0-9a-fA-F]{24}$/.test(pid)) {
          it = items[0]
        }

        if (it) {
          p = {
            id: it._id || it.id || it.key || it.name,
            name: it.name,
            genericName: it.genericName || it.lastGenericName || undefined,
            manufacturer: it.manufacturer || undefined,
            salePerPack: Number(it.lastSalePerPack || 0),
            unitsPerPack: Number(it.unitsPerPack || 1),
            unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
            stock: Number(it.onHand || 0),
            barcode: it.barcode || undefined,
            defaultDiscountPct: Number(it.defaultDiscountPct || 0),
            lineTaxType: it.lastLineTaxType || undefined,
            lineTaxValue: Number(it.lastLineTaxValue || 0),
          }
          setProductIndex(prev => ({ ...prev, [p!.id]: p! }))
        }
      } catch (e) {
        console.error('Failed to fetch product for cart', e)
      }
    }

    if (!p) {
      showToast('error', `Product not found: ${pid}`)
      return null // Return null to indicate failure
    }

    if (p.stock <= 0) { setOutOfStockItem(p); return null }

    const addQty = opts?.qty || 1
    const finalProduct = p // Stable reference for the setter

    setCart(prev => {
      const found = prev.find(l => l.productId === finalProduct.id)
      if (found) {
        const max = Number(finalProduct.stock || 0)
        const nextQty = found.qty + addQty
        if (nextQty > max) {
          showToast('error', `Only ${max} in stock for ${finalProduct.name}`)
          return prev.map(l => (l.productId === finalProduct.id ? { ...l, qty: max } : l))
        }
        if (opts?.focusQty !== false) { pendingFocusLineIdRef.current = found.id } else { pendingFocusLineIdRef.current = null }
        return prev.map(l => (l.productId === finalProduct.id ? { ...l, qty: nextQty } : l))
      }
      const id = crypto.randomUUID()
      if (opts?.focusQty !== false) { pendingFocusLineIdRef.current = id } else { pendingFocusLineIdRef.current = null }
      const finalQty = Math.min(addQty, Number(finalProduct.stock || 0))
      return [...prev, {
        id,
        productId: finalProduct.id,
        name: finalProduct.name,
        unitPrice: finalProduct.unitPrice,
        qty: finalQty,
        discountPct: 0,
        maxDiscountPct: Math.max(0, Math.min(100, Number(finalProduct.defaultDiscountPct || 0))),
        lineTaxType: finalProduct.lineTaxType || 'percent',
        lineTaxValue: finalProduct.lineTaxValue || 0,
        packMode: 'loose'
      }]
    })
    return p // Return the product to indicate success
  }, [productIndex, products])

  const handleReorderHistory = useCallback(async (lines: Array<{ medicineId: string; name?: string; qty: number }>) => {
    showToast('success', `Loading ${lines.length} items from history...`)
    let first = true
    for (const line of lines) {
      const key = (line.name || '').trim() || line.medicineId
      await addToCart(key, { qty: line.qty, focusQty: first })
      first = false
    }
    try { searchInputRef.current?.blur() } catch { }
  }, [addToCart])

  const loadLastPrescription = useCallback(async () => {
    if (!foundCustomerRef.current?.lastDispense?.lines) {
      showToast('error', 'No last prescription found for this customer')
      return
    }
    const lines = foundCustomerRef.current.lastDispense.lines as any[]

    showToast('success', `Loading ${lines.length} items from last order...`)

    for (const line of lines) {
      // Prioritize Name for re-order since ID might change between inventory imports
      const targetName = line.name || line.medicineName
      const targetId = line.medicineId || line.id

      // Try name first as it is more stable for the user
      if (targetName) {
        const added = await addToCart(targetName, { qty: line.qty, focusQty: false })
        if (added) continue // If added by name successfully, move to next
      }

      // Fallback to ID if name failed or was missing
      if (targetId) {
        await addToCart(targetId, { qty: line.qty, focusQty: false })
      }
    }
  }, [addToCart])


  useEffect(() => {
    if (settings.taxRate !== undefined) {
      setBillGstValue(prev => prev === 0 ? settings.taxRate : prev)
    }
  }, [settings.taxRate])
  // Current pharmacy username to stamp sales
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('pharmacy.user')
      if (raw) {
        const u = JSON.parse(raw)
        if (u && typeof u.username === 'string') return u.username
      }
    } catch { }
    try { return localStorage.getItem('pharma_user') || '' } catch { return '' }
  }, [])

  // Held bills (server-side persistence)
  type HeldBill = { _id: string; createdAtIso?: string; createdAt?: string; billDiscountPct?: number; lines?: Array<{ medicineId: string; name: string; unitPrice: number; qty: number; discountRs?: number }> }
  const [heldOpen, setHeldOpen] = useState(false)
  const [heldBills, setHeldBills] = useState<HeldBill[]>([])
  const refreshHeld = async () => {
    try { const r: any = await pharmacyApi.listHoldSales(); setHeldBills(r?.items || []) } catch { setHeldBills([]) }
  }
  useEffect(() => { if (heldOpen) { refreshHeld() } }, [heldOpen])
  const holdBill = async () => {
    if (cart.length === 0) return
    try {
      const payload = {
        billDiscountPct: billDiscountPct || 0, lines: cart.map(l => {
          const sub = Number(l.unitPrice || 0) * Number(l.qty || 0)
          const disc = Math.max(0, Math.min(100, Number(l.discountPct || 0))) * sub / 100
          return { medicineId: l.productId, name: l.name, unitPrice: Number(l.unitPrice || 0), qty: l.qty, discountRs: Number(disc.toFixed(2)) }
        })
      }
      await pharmacyApi.createHoldSale(payload)
      setCart([])
      showToast('success', 'Bill held successfully')
      if (heldOpen) refreshHeld()
    } catch { showToast('error', 'Failed to hold bill') }
  }
  const restoreHeld = async (id: string) => {
    try {
      const r: any = await pharmacyApi.getHoldSale(id)
      const doc = r || {}
      const lines = (doc.lines || []) as Array<{ medicineId: string; name: string; unitPrice: number; qty: number; discountRs?: number }>
      setCart(lines.map(l => {
        const sub = Number(l.unitPrice || 0) * Number(l.qty || 0)
        const rs = Number(l.discountRs || 0)
        const pct = sub > 0 ? (rs / sub) * 100 : 0
        const p = productIndex[l.medicineId]
        return {
          id: crypto.randomUUID(),
          productId: l.medicineId,
          name: l.name,
          unitPrice: Number(l.unitPrice || 0),
          qty: Number(l.qty || 0),
          discountPct: Number(pct.toFixed(4)),
          maxDiscountPct: p ? p.defaultDiscountPct : Number(pct.toFixed(4))
        }
      }))
      setBillDiscountPct(Number(doc.billDiscountPct || 0))
      await pharmacyApi.deleteHoldSale(id)
      await refreshHeld()
      setHeldOpen(false)
    } catch { showToast('error', 'Failed to restore held bill') }
  }
  const deleteHeld = async (id: string) => { try { await pharmacyApi.deleteHoldSale(id); await refreshHeld() } catch { } }

  // Enhanced POS UX state
  const [searchOpen, setSearchOpen] = useState(false)
  const [suggestionSel, setSuggestionSel] = useState(0)
  const [genericAlternatives, setGenericAlternatives] = useState<Product[]>([])
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const outOfStockOkRef = useRef<HTMLButtonElement>(null)
  const pendingFocusLineIdRef = useRef<string | null>(null)
  const [outOfStockItem, setOutOfStockItem] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const [lowStockItems, setLowStockItems] = useState<Set<string>>(new Set())
  const scanRef = useRef<{ buf: string; last: number; timer?: ReturnType<typeof setTimeout> | null }>({ buf: '', last: 0, timer: null })
  // Stable refs to ensure instant Shift+Enter without stale closures
  const cartRef = useRef<CartLine[]>([])
  const payOpenRef = useRef(false)
  const receiptOpenRef = useRef(false)
  const billDiscountInputRef = useRef<HTMLInputElement>(null)
  const historyOpenRef = useRef(false)
  const foundCustomerRef = useRef<any>(null)
  useEffect(() => { cartRef.current = cart }, [cart])
  useEffect(() => { payOpenRef.current = payOpen }, [payOpen])
  useEffect(() => { receiptOpenRef.current = receiptOpen }, [receiptOpen])
  useEffect(() => { historyOpenRef.current = historyOpen }, [historyOpen])
  useEffect(() => { foundCustomerRef.current = foundCustomer }, [foundCustomer])

  // Debug logging for payment dialog
  useEffect(() => {
    if (payOpen) {
      console.log('Payment dialog opened with foundCustomer:', foundCustomer)
    }
  }, [payOpen, foundCustomer])

  // Dedicated Shift+Enter and Ctrl+Shift+H handler in capture phase for instant response
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+D to focus Search Bar - HIGH PRIORITY
      if (e.key.toLowerCase() === 'd' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        const searchInput = document.getElementById('pharmacy-pos-search') as HTMLInputElement | null
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
          setSearchOpen(true)
        } else if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
          setSearchOpen(true)
        }
        return
      }

      // Shift+Enter for Payment
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        if (!payOpenRef.current && !receiptOpenRef.current && cartRef.current.length > 0) {
          try { searchInputRef.current?.blur() } catch { }
          setPayOpen(true)
        }
      }
      // Ctrl+Shift+H for Product History OR Customer History
      if (e.key.toLowerCase() === 'h' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        if (foundCustomerRef.current) {
          setHistoryOpen(true)
        } else if (cartRef.current.length > 0) {
          const lastItem = cartRef.current[cartRef.current.length - 1]
          navigate(`/pharmacy/sales-history?medicine=${encodeURIComponent(lastItem.name)}`)
        } else {
          showToast('error', 'Select a product or find a customer first')
        }
      }
      // Ctrl+Shift+F to focus Customer Phone
      if (e.key.toLowerCase() === 'f' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        try { customerPhoneInputRef.current?.focus() } catch { }
      }
      // Ctrl+Shift+R to Reorder Last
      if (e.key.toLowerCase() === 'r' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        if (foundCustomerRef.current?.lastDispense) {
          loadLastPrescription()
        } else {
          showToast('error', 'No customer or previous purchase found')
        }
      }
      // Alt+BackSpace to focus last cart item qty
      if (e.key === 'Backspace' && e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        if (cartRef.current.length > 0) {
          const lastItem = cartRef.current[cartRef.current.length - 1]
          const el = document.getElementById(`pharmacy-pos-qty-${lastItem.id}`) as HTMLInputElement | null
          if (el) {
            el.focus()
            el.select()
          }
        } else {
          showToast('error', 'Cart is empty')
        }
      }
      // Ctrl+D to focus Search Bar
      if (e.key.toLowerCase() === 'd' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        try {
          const el = document.getElementById('pharmacy-pos-search') as HTMLInputElement | null;
          if (el) {
            el.focus();
            el.select();
            setSearchOpen(true);
          }
        } catch { }
      }
    }
    window.addEventListener('keydown', onGlobalKeyDown as any, true)
    return () => window.removeEventListener('keydown', onGlobalKeyDown as any, true)
  }, [])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res: any = await pharmacyApi.listInventory({ search: query || undefined, page, limit: rowsPerPage })
          if (!mounted) return
          const mapped: Product[] = (res.items || []).map((it: any) => ({
            id: it._id || it.key || it.name,
            name: it.name,
            genericName: it.genericName || it.lastGenericName || undefined,
            manufacturer: it.manufacturer || undefined,
            salePerPack: Number(it.lastSalePerPack || 0),
            unitsPerPack: Number(it.unitsPerPack || 1),
            unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
            stock: Number(it.onHand || 0),
            barcode: it.barcode || undefined,
            defaultDiscountPct: Number(it.defaultDiscountPct || 0),
            lineTaxType: it.lastLineTaxType || undefined,
            lineTaxValue: Number(it.lastLineTaxValue || 0),
          }))
          setProducts(mapped)
          setProductIndex(prev => {
            const next = { ...prev }
            for (const p of mapped) next[p.id] = p
            return next
          })
          const tp = Number(res?.totalPages || 1)
          if (!isNaN(tp)) setTotalPages(tp)

          // Check for stock alerts after loading products
          checkStockAlerts(mapped)
        } catch (e) { console.error(e) }
      })()
    return () => { mounted = false }
  }, [query, page, rowsPerPage])

  const filtered = useMemo(() => products, [products])
  const visible = useMemo(() => filtered, [filtered])

  const suggestions = useMemo(() => {
    const list = visible.slice(0, 8)
    if (!query.trim()) return [] as Product[]
    return list
  }, [visible, query])

  // Fetch generic alternatives when a suggestion is selected
  useEffect(() => {
    const p = suggestions[suggestionSel]
    if (!p || !p.genericName) {
      setGenericAlternatives([])
      return
    }

    let mounted = true
    setLoadingAlternatives(true)
    const gen = p.genericName.trim()

    // Use the listInventory API with the generic name as the search query
    pharmacyApi.listInventory({ search: gen, limit: 10 })
      .then((res: any) => {
        if (!mounted) return
        const mapped: Product[] = (res.items || [])
          .filter((it: any) => (it._id || it.key || it.name) !== p.id) // exclude current item
          .map((it: any) => ({
            id: it._id || it.key || it.name,
            name: it.name,
            genericName: it.genericName || it.lastGenericName || undefined,
            manufacturer: it.manufacturer || undefined,
            salePerPack: Number(it.lastSalePerPack || 0),
            unitsPerPack: Number(it.unitsPerPack || 1),
            unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
            stock: Number(it.onHand || 0),
            barcode: it.barcode || undefined,
            defaultDiscountPct: Number(it.defaultDiscountPct || 0),
            lineTaxType: it.lastLineTaxType || undefined,
            lineTaxValue: Number(it.lastLineTaxValue || 0),
          }))
        setGenericAlternatives(mapped)
      })
      .catch(() => { if (mounted) setGenericAlternatives([]) })
      .finally(() => { if (mounted) setLoadingAlternatives(false) })

    return () => { mounted = false }
  }, [suggestions, suggestionSel])

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setToast({ type, message })
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3000)
  }

  const getStock = (productId: string) => {
    const p = productIndex[productId] || products.find(pp => pp.id === productId)
    return Number(p?.stock || 0)
  }

  // Check for low stock items and generate alerts
  const checkStockAlerts = (productsList: Product[]) => {
    const lowStockSet = new Set<string>()

    productsList.forEach(p => {
      const stock = Number(p.stock || 0)
      // Consider low stock if <= 10 units or 20% of typical daily sales
      const lowStockThreshold = Math.max(10, Math.floor(stock * 0.2))
      if (stock > 0 && stock <= lowStockThreshold) {
        lowStockSet.add(p.id)
      }
    })

    setLowStockItems(lowStockSet)

    // Show alert for critically low stock items

  }


  const inc = (id: string) => {
    setCart(prev => {
      const line = prev.find(l => l.id === id)
      if (!line) return prev
      const max = getStock(line.productId)
      if (max > 0 && line.qty + 1 > max) {
        const p = products.find(pp => pp.id === line.productId)
        showToast('error', `Only ${max} in stock for ${p?.name || 'this item'}`)
        return prev
      }
      return prev.map(l => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
    })
  }
  const dec = (id: string) => setCart(prev => prev.map(l => (l.id === id ? { ...l, qty: Math.max(1, l.qty - 1) } : l)))
  const remove = (id: string) => setCart(prev => prev.filter(l => l.id !== id))
  const clear = () => setCart([])
  const setQty = (id: string, qty: number) => {
    setCart(prev => {
      const line = prev.find(l => l.id === id)
      if (!line) return prev
      const max = getStock(line.productId)
      const safe = Math.max(1, qty | 0)
      if (max > 0 && safe > max) {
        const p = products.find(pp => pp.id === line.productId)
        showToast('error', `Max available is ${max} for ${p?.name || 'this item'}`)
        return prev.map(l => (l.id === id ? { ...l, qty: max } : l))
      }
      return prev.map(l => (l.id === id ? { ...l, qty: safe } : l))
    })
  }
  const updateLine = (id: string, updates: Partial<CartLine>) => {
    setCart(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)))
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => {
      const p = productIndex[line.productId]
      const baseUnitPrice = Number(line.unitPrice ?? p?.unitPrice ?? 0)
      // In Pack mode, price is per pack (unit price × units per pack)
      const isPack = line.packMode === 'pack'
      const unitsPerPack = p?.unitsPerPack || 1
      const price = isPack ? baseUnitPrice * unitsPerPack : baseUnitPrice
      return sum + price * line.qty
    }, 0)
    const lineDiscount = cart.reduce((s, l) => {
      const p = productIndex[l.productId]
      const baseUnitPrice = Number(l.unitPrice || 0)
      const isPack = l.packMode === 'pack'
      const unitsPerPack = p?.unitsPerPack || 1
      const price = isPack ? baseUnitPrice * unitsPerPack : baseUnitPrice
      const lineSub = price * Number(l.qty || 0)
      const discPct = Math.max(0, Math.min(100, Number(l.discountPct || 0)))
      const disc = discPct * lineSub / 100
      return s + disc
    }, 0)
    // Calculate line tax
    const lineTax = cart.reduce((s, l) => {
      const p = productIndex[l.productId]
      const baseUnitPrice = Number(l.unitPrice || 0)
      const isPack = l.packMode === 'pack'
      const unitsPerPack = p?.unitsPerPack || 1
      const price = isPack ? baseUnitPrice * unitsPerPack : baseUnitPrice
      const discPct = Math.max(0, Math.min(100, Number(l.discountPct || 0)))
      const afterDiscount = price * (1 - discPct / 100)
      const taxType = l.lineTaxType || 'percent'
      const taxValue = Number(l.lineTaxValue || 0)
      let tax = 0
      if (taxType === 'percent') {
        tax = afterDiscount * taxValue / 100 * l.qty
      } else {
        tax = taxValue * l.qty // Fixed tax per item/pack
      }
      return s + tax
    }, 0)
    const billPct = billDiscountPct || 0
    const billDiscount = Math.max(0, ((subtotal - lineDiscount) * billPct) / 100)
    const totalDiscount = lineDiscount + billDiscount
    const billGstBase = Math.max(0, subtotal - totalDiscount)
    let billGstAmount = 0
    if (billGstType === 'percent') {
      billGstAmount = billGstBase * (billGstValue || 0) / 100
    } else {
      billGstAmount = billGstValue || 0
    }
    const total = subtotal - totalDiscount + lineTax + billGstAmount
    return { subtotal, lineDiscount, billDiscount, totalDiscount, tax: lineTax, billGstAmount, total }
  }, [cart, billDiscountPct, billGstType, billGstValue, productIndex])

  const refreshCartStocks = async () => {
    try {
      const fresh: Product[] = []
      for (const l of cart) {
        try {
          const res: any = await pharmacyApi.listInventory({ search: l.name, page: 1, limit: 1 })
          const it = (res?.items || [])[0]
          if (!it) continue
          const mapped: Product = {
            id: it._id || it.key || it.name,
            name: it.name,
            genericName: it.genericName || it.lastGenericName || undefined,
            salePerPack: Number(it.lastSalePerPack || 0),
            unitsPerPack: Number(it.unitsPerPack || 1),
            unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
            stock: Number(it.onHand || 0),
            barcode: it.barcode || undefined,
            defaultDiscountPct: Number(it.defaultDiscountPct || 0),
          }
          fresh.push(mapped)
        } catch { }
      }
      if (fresh.length) {
        setProductIndex(prev => {
          const next = { ...prev }
          for (const p of fresh) next[p.id] = p
          // Ensure current cart productIds also point to fresh by-name entries
          for (const l of cart) {
            const byName = fresh.find(f => f.name === l.name)
            if (byName) next[l.productId] = byName as any
          }
          return next
        })
      }
    } catch (e) { console.error('refreshCartStocks error', e) }
  }

  const openPayment = () => {
    try { searchInputRef.current?.blur() } catch { }

    console.log('Opening payment dialog with:')
    console.log('- foundCustomer:', foundCustomer)
    console.log('- customerPhone:', customerPhone)

    // Ensure foundCustomer has the phone from customerPhone state if it's missing
    if (foundCustomer && !foundCustomer.phone && customerPhone) {
      console.log('Updating foundCustomer phone from customerPhone state:', customerPhone)
      setFoundCustomer({
        ...foundCustomer,
        phone: customerPhone
      })
    }

    const limit = Number(settings.maxSaleLimit || 0)
    if (limit > 0 && totals.total > limit) {
      setOnAuthVerified(() => () => setPayOpen(true))
      setAuthOpen(true)
    } else {
      setPayOpen(true)
    }
  }
  const confirmPayment = async (data: { method: 'cash' | 'credit'; customer?: string; customerId?: string; customerPhone?: string; cashReceived?: number; changeReturn?: number }) => {
    console.log('confirmPayment called with data:', data)
    console.log('confirmPayment foundCustomer:', foundCustomer)
    console.log('confirmPayment customerPhone:', customerPhone)

    setPayment(data)
    setPayOpen(false)
    try {
      setBusy(true)

      // Merge data from payment dialog with foundCustomer state
      const customerIdFinal = data.customerId || foundCustomer?.id
      const nameInput = (data.customer || foundCustomer?.name || '').trim()
      const phoneInput = (data.customerPhone || foundCustomer?.phone || customerPhone || '').trim()

      console.log('confirmPayment merged data:', { customerIdFinal, nameInput, phoneInput })

      await refreshCartStocks()
      const bad = cart.find(l => {
        const max = getStock(l.productId)
        return max > 0 && Number(l.qty || 0) > max
      })
      if (bad) {
        const p = productIndex[bad.productId] || products.find(pp => pp.id === bad.productId)
        const max = getStock(bad.productId)
        showToast('error', `${p?.name || bad.name || 'Item'} quantity exceeds available stock${max > 0 ? ` (max ${max})` : ''}`)
        setReceiptOpen(false)
        setBusy(false)
        return
      }
      const itemsForReceipt = cart.map(l => {
        const unit = Number(l.unitPrice || 0)
        const p = productIndex[l.productId]
        const unitsPerPack = p?.unitsPerPack || 1
        const isPack = l.packMode === 'pack'
        // Calculate price per item based on pack mode
        const pricePerItem = isPack ? unit * unitsPerPack : unit
        const lineSub = pricePerItem * Number(l.qty || 0)
        // Calculate discount based on discountPct (same as billing summary)
        const discPct = Math.max(0, Math.min(100, Number(l.discountPct || 0)))
        const lineDisc = discPct * lineSub / 100
        return {
          name: l.name,
          qty: l.qty,
          price: pricePerItem,  // Pass calculated price (pack or unit)
          discountRs: Math.round(lineDisc * 100) / 100,
          lineTaxType: l.lineTaxType,
          lineTaxValue: l.lineTaxValue,
          packMode: l.packMode
        }
      })
      const lines = cart.map(l => {
        const p = productIndex[l.productId]
        const unitsPerPack = p?.unitsPerPack || 1
        const isPack = l.packMode === 'pack'
        const unit = Number(l.unitPrice || 0)
        // Save calculated price (pack or unit)
        const pricePerItem = isPack ? unit * unitsPerPack : unit
        const lineSub = pricePerItem * Number(l.qty || 0)
        const lineDisc = Math.max(0, Math.min(100, Number(l.discountPct || 0))) * lineSub / 100
        return {
          medicineId: l.productId,
          name: l.name,
          unitPrice: pricePerItem,  // Save calculated price, not raw unit price
          qty: l.qty,
          discountRs: Number(lineDisc.toFixed(2)),
          lineTaxType: l.lineTaxType,
          lineTaxValue: l.lineTaxValue,
          packMode: l.packMode
        }
      })
      const payload = {
        datetime: new Date().toISOString(),
        customer: nameInput || 'Walk-in',
        customerPhone: phoneInput || undefined,
        customerId: customerIdFinal || undefined,
        payment: data.method === 'cash' ? 'Cash' : 'Credit',
        discountPct: Number(billDiscountPct || 0),
        billGstType: billGstType,
        billGstValue: billGstValue,
        subtotal: totals.subtotal,
        total: totals.total,
        lineDiscountTotal: totals.lineDiscount,
        lineGstTotal: totals.tax,
        billGstAmount: totals.billGstAmount,
        lines,
        createdBy: currentUser || undefined,
        prescriptionId: linkedPrescriptionId || undefined,
      }
      const created = await pharmacyApi.createSale(payload)
      try {
        const pid = linkedPrescriptionId
        if (pid) {
          const resp: any = await hospitalApi.listReferrals({ type: 'pharmacy', status: 'pending', prescriptionId: pid, limit: 1 })
          const arr: any[] = resp?.referrals || []
          const rid = String((arr[0]?._id || arr[0]?.id || ''))
          if (rid) { await hospitalApi.updateReferralStatus(rid, 'completed') }
        }
      } catch { }
      setReceiptItems(itemsForReceipt)
      try {
        const hid = localStorage.getItem('pharmacy.pos.pendingRestoreHoldId')
        if (hid) {
          await pharmacyApi.deleteHoldSale(hid)
          localStorage.removeItem('pharmacy.pos.pendingRestoreHoldId')
          localStorage.removeItem('pharmacy.pos.pendingBillDiscountPct')
        }
      } catch { }
      setLastSale({
        no: created.billNo,
        method: data.method,
        cashReceived: data.cashReceived,
        changeReturn: data.changeReturn,
        discountPct: Number(billDiscountPct || 0),
        lineDiscountTotal: totals.lineDiscount,
        lineGstTotal: totals.tax,
        billGstType: billGstType,
        billGstValue: billGstValue,
        billGstAmount: totals.billGstAmount,
        customer: data.customer,
        customerPhone: data.customerPhone,
        fbr: {
          status: created?.fbrStatus || created?.fbr?.status,
          qrCode: created?.fbrQrCode || created?.qrCode || created?.fbr?.qrCode,
          fbrInvoiceNo: created?.fbrInvoiceNo || created?.fbr?.fbrInvoiceNo || created?.fbr?.invoiceNumber,
          mode: created?.fbrMode || created?.fbr?.mode,
          error: created?.fbrError || created?.fbr?.error,
        }
      })
      setReceiptOpen(true)
      setLinkedPrescriptionId(null)
      // Clear customer profile after successful payment — ready for next customer
      setFoundCustomer(null)
      setCustomerPhone('')
      prescriptionPatientRef.current = null
      patientNameRef.current = ''
      customerPhoneWasSetRef.current = false
      try { window.dispatchEvent(new CustomEvent('pharmacy:sale', { detail: created })) } catch { }
      // Refresh inventory so stock reflects the sale
      try {
        const res: any = await pharmacyApi.listInventory({ search: query || undefined, page, limit: rowsPerPage })
        const mapped: Product[] = (res.items || []).map((it: any) => ({
          id: it._id || it.key || it.name,
          name: it.name,
          genericName: it.genericName || it.lastGenericName || undefined,
          manufacturer: it.manufacturer || undefined,
          salePerPack: Number(it.lastSalePerPack || 0),
          unitsPerPack: Number(it.unitsPerPack || 1),
          unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
          stock: Number(it.onHand || 0),
          barcode: it.barcode || undefined,
          defaultDiscountPct: Number(it.defaultDiscountPct || 0),
          lineTaxType: it.lastLineTaxType || undefined,
          lineTaxValue: Number(it.lastLineTaxValue || 0),
        }))
        setProducts(mapped)
        setProductIndex(prev => {
          const next = { ...prev }
          for (const p of mapped) next[p.id] = p
          return next
        })
        const tp = Number(res?.totalPages || 1)
        if (!isNaN(tp)) setTotalPages(tp)

        // Check for stock alerts after refreshing inventory post-sale
        checkStockAlerts(mapped)
      } catch (e) { console.error('Failed to refresh inventory after sale', e) }
    } catch (e) {
      console.error(e)
      showToast('error', 'Failed to process payment')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    setSel(s => Math.max(0, Math.min(s, visible.length - 1)))
  }, [visible.length])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (payOpen || receiptOpen) return
      const t = e.target as HTMLElement | null
      const tag = (t?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || !!t?.isContentEditable

      // When search dropdown is open and search input is focused, do not handle here.
      // The input's onKeyDownCapture manages ArrowUp/Down and Enter to avoid double increments.
      const searchFocused = document.activeElement === searchInputRef.current
      if (searchOpen && searchFocused) { return }

      if (e.key === 'Enter' && e.shiftKey) { if (!payOpen && !receiptOpen && cart.length > 0) { e.preventDefault(); openPayment() } return }
      if (isTyping) return

      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, visible.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); return }
      if (e.key === 'Enter') { const item = visible[sel]; if (item) { e.preventDefault(); addToCart(item.id, { focusQty: true }) } return }
      if (e.key === 'Delete') { if (cart.length > 0) { e.preventDefault(); const id = cart[cart.length - 1].id; remove(id) } return }
      if (e.key === '+' || e.key === '=') { if (cart.length > 0) { e.preventDefault(); const id = cart[cart.length - 1].id; inc(id) } return }
      if (e.key === '-' || e.key === '_') { if (cart.length > 0) { e.preventDefault(); const id = cart[cart.length - 1].id; dec(id) } return }
    }
    const onPay = () => openPayment()
    const onAdd = async (ev: any) => {
      try {
        const lines: Array<{ name: string; productId?: string; qty: number }> = ev?.detail?.lines || []
        for (const ln of lines) {
          let pid = ln.productId || ''
          let product: Product | undefined

          // Try to fetch product details from inventory to get correct price and default discount
          try {
            const inv: any = await pharmacyApi.listInventory({ search: ln.name, page: 1, limit: 1 })
            const it = (inv.items || [])[0]
            if (it) {
              pid = it._id || it.key || it.name
              product = {
                id: pid,
                name: it.name,
                genericName: it.genericName || it.lastGenericName || undefined,
                manufacturer: it.manufacturer || undefined,
                salePerPack: Number(it.lastSalePerPack || 0),
                unitsPerPack: Number(it.unitsPerPack || 1),
                unitPrice: Number(it.lastSalePerUnit || ((it.unitsPerPack && it.lastSalePerPack) ? it.lastSalePerPack / it.unitsPerPack : 0)),
                stock: Number(it.onHand || 0),
                barcode: it.barcode || undefined,
                defaultDiscountPct: Number(it.defaultDiscountPct || 0),
                lineTaxType: it.lastLineTaxType || undefined,
                lineTaxValue: Number(it.lastLineTaxValue || 0),
              }
              setProducts(prev => {
                if (prev.some(p => p.id === product!.id)) return prev
                return [product!, ...prev]
              })
              setProductIndex(prev => ({ ...prev, [product!.id]: product! }))
            }
          } catch (e) {
            console.error('Error fetching inventory for referral item', e)
          }

          if (!pid || !product) {
            showToast('error', `Item not found in inventory: ${ln.name}`)
            continue
          }

          // Prevent adding items with zero or negative stock
          if (!product || product.stock <= 0) {
            showToast('error', `Cannot add ${ln.name} - Out of stock (0)`)
            continue
          }

          // Add to cart with correct price and default discount
          setCart(prev => {
            const found = prev.find(l => l.productId === pid)
            if (found) {
              const currentQty = found.qty
              const requestedAdd = Math.max(1, ln.qty | 0)
              const newTotal = currentQty + requestedAdd

              if (newTotal > product!.stock) {
                showToast('error', `Only ${product!.stock} units available for ${product!.name}. Adjusting to max stock.`)
                return prev.map(l => (l.productId === pid ? { ...l, qty: product!.stock } : l))
              }
              return prev.map(l => (l.productId === pid ? { ...l, qty: newTotal } : l))
            }

            const initialQty = Math.max(1, ln.qty | 0)
            const finalQty = Math.min(initialQty, product!.stock)

            if (initialQty > product!.stock) {
              showToast('error', `Only ${product!.stock} units available for ${product!.name}.`)
            }

            return [...prev, {
              id: crypto.randomUUID(),
              productId: pid,
              name: product!.name,
              unitPrice: product!.unitPrice,
              qty: finalQty,
              discountPct: 0,
              maxDiscountPct: Math.max(0, Math.min(100, Number(product!.defaultDiscountPct || 0))),
              lineTaxType: product!.lineTaxType || 'percent',
              lineTaxValue: product!.lineTaxValue || 0,
              packMode: 'loose'
            }]
          })
        }
      } catch (e) {
        console.error('onAdd error', e)
      }
    }
    window.addEventListener('keydown', onKeyDown as any, true)
    window.addEventListener('pharmacy:pos:pay' as any, onPay as any)
    window.addEventListener('pharmacy:pos:add' as any, onAdd as any)
    return () => {
      window.removeEventListener('keydown', onKeyDown as any, true)
      window.removeEventListener('pharmacy:pos:pay' as any, onPay as any)
      window.removeEventListener('pharmacy:pos:add' as any, onAdd as any)
    }
  }, [visible, sel, cart, products, searchOpen, suggestions, suggestionSel, payOpen, receiptOpen])

  // Process pending add lines (if navigated from prescription page)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pharmacy.pos.pendingAddLines')
      if (!raw) return
      localStorage.removeItem('pharmacy.pos.pendingAddLines')
      const lines = JSON.parse(raw) as Array<{ name: string; productId?: string; qty: number }>
      const ev = new CustomEvent('pharmacy:pos:add', { detail: { lines } })
      window.dispatchEvent(ev)
      try {
        const disc = localStorage.getItem('pharmacy.pos.pendingBillDiscountPct')
        if (disc) {
          localStorage.removeItem('pharmacy.pos.pendingBillDiscountPct')
          setBillDiscountPct(0)
        }
      } catch { }
      try {
        const pid = localStorage.getItem('pharmacy.pos.pendingPrescriptionId')
        if (pid) {
          localStorage.removeItem('pharmacy.pos.pendingPrescriptionId')
          setLinkedPrescriptionId(String(pid))
        }
      } catch { }

      // Load patient info from prescription
      try {
        const patientInfoRaw = localStorage.getItem('pharmacy.pos.pendingPatientInfo')
        if (patientInfoRaw) {
          localStorage.removeItem('pharmacy.pos.pendingPatientInfo')
          const patientInfo = JSON.parse(patientInfoRaw) as { name: string; phone: string }
          console.log('Loaded patient info from localStorage:', patientInfo)
          // Store in ref so StrictMode second-mount can also read it
          prescriptionPatientRef.current = patientInfo
        }
        // Always apply from ref (handles both normal mount and StrictMode second mount)
        if (prescriptionPatientRef.current) {
          const info = prescriptionPatientRef.current
          patientNameRef.current = info.name || ''
          if (info.name || info.phone) {
            setFoundCustomer({ id: '', name: info.name || '', phone: info.phone || '' })
            console.log('Set foundCustomer from prescription ref:', info)
          }
        }
      } catch (err) {
        console.error('Error loading patient info:', err)
      }
    } catch { }
  }, [])

  // Focus search input on mount and when dialogs close
  useEffect(() => { try { searchInputRef.current?.focus() } catch { } }, [])
  useEffect(() => {
    if (!searchInputRef.current) return
    if (payOpen || receiptOpen) return
    const t = setTimeout(() => { try { searchInputRef.current?.focus() } catch { } }, 0)
    return () => clearTimeout(t)
  }, [payOpen, receiptOpen])

  // Focus qty input after add
  useEffect(() => {
    const id = pendingFocusLineIdRef.current
    if (!id) return
    pendingFocusLineIdRef.current = null
    const t = setTimeout(() => {
      const el = document.getElementById(`pharmacy-pos-qty-${id}`) as HTMLInputElement | null
      if (!el) return
      try { el.focus(); el.select() } catch { }
    }, 0)
    return () => clearTimeout(t)
  }, [cart])

  // Out of stock modal focus / escape
  useEffect(() => {
    if (!outOfStockItem) return
    const t = setTimeout(() => { try { outOfStockOkRef.current?.focus() } catch { } }, 0)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOutOfStockItem(null) }
    window.addEventListener('keydown', onKey as any)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey as any) }
  }, [outOfStockItem])

  // Global scanner buffer (when no input focused)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (payOpen || receiptOpen) return
      const t = e.target as HTMLElement | null
      const tag = (t?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || !!t?.isContentEditable
      const activeId = (t as any)?.id ? String((t as any).id) : ''
      const isQtyInput = activeId.startsWith('pharmacy-pos-qty-')
      // Do not intercept typing in inputs (including quantity field). Scanner works only when no input is focused.
      if (isTyping) return
      const now = Date.now()
      if (now - scanRef.current.last > 120) scanRef.current.buf = ''
      scanRef.current.last = now
      if (scanRef.current.timer) { try { clearTimeout(scanRef.current.timer) } catch { } }
      const commit = () => {
        const code = scanRef.current.buf.trim()
        scanRef.current.buf = ''
        if (!code || code.length < 6) return
        const norm = (s: string) => String(s || '').replace(/\D/g, '')
        const p = products.find(pp => norm(pp.barcode || '') === norm(code))
        if (p) {
          addToCart(p.id, { focusQty: true })
          try {
            setQuery(''); setSearchOpen(false)
            // Blur qty input if focused, and refocus search box for continuous scanning
            if (isQtyInput && t && 'blur' in t) { (t as any).blur?.() }
            searchInputRef.current?.focus(); searchInputRef.current?.select()
          } catch { }
        } else {
          setQuery(code)
          setSearchOpen(true)
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) { commit(); return }
      if (e.key && e.key.length === 1) scanRef.current.buf += e.key
      scanRef.current.timer = setTimeout(commit, 180)
    }
    window.addEventListener('keydown', handler as any, true)
    return () => window.removeEventListener('keydown', handler as any, true)
  }, [products, payOpen, receiptOpen])

  // Clean up toast timer
  useEffect(() => () => { if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null } }, [])

  // Persist hideOutOfStock setting to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pharmacy.pos.hideOutOfStock', JSON.stringify(hideOutOfStock))
    } catch { }
  }, [hideOutOfStock])

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); setSearchOpen(true); setSuggestionSel(s => Math.min(s + 1, Math.max(0, suggestions.length - 1))); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); setSearchOpen(true); setSuggestionSel(s => Math.max(s - 1, 0)); return }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); e.stopPropagation();
      if (cart.length > 0 && !payOpen && !receiptOpen) {
        openPayment()
      }
      return
    }
    if (e.key === 'Enter') {
      const code = query.trim()
      if (code) {
        const byBarcode = products.find(p => (p.barcode || '') === code)
        if (byBarcode) { e.preventDefault(); e.stopPropagation(); addToCart(byBarcode.id, { focusQty: true }); setQuery(''); setSearchOpen(false); try { searchInputRef.current?.focus(); searchInputRef.current?.select() } catch { }; return }
      } else if (cart.length > 0) {
        // Search bar is empty, Enter pressed, cart is not empty
        e.preventDefault()
        e.stopPropagation()
        const lastItem = cart[cart.length - 1]
        const el = document.getElementById(`pharmacy-pos-qty-${lastItem.id}`) as HTMLInputElement | null
        if (el) {
          el.focus()
          el.select()
        }
        return
      }
      const item = suggestions[suggestionSel]
      if (item) { e.preventDefault(); e.stopPropagation(); addToCart(item.id, { focusQty: true }); setQuery(''); setSearchOpen(false); try { searchInputRef.current?.focus(); searchInputRef.current?.select() } catch { } }
      return
    }
    if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      try { searchInputRef.current?.focus(); searchInputRef.current?.select() } catch { }
      return
    }
    if (e.key === 'Escape') { e.stopPropagation(); setSearchOpen(false) }
  }

  const receiptLines = receiptItems

  const computedReceiptNo = useMemo(() => receiptNo || `B-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(receiptItems.length).padStart(3, '0')}`, [receiptNo, receiptItems])

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 min-h-full">
      {toast && (
        <div className="fixed right-4 top-4 z-70 w-[min(92vw,420px)]">
          <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ring-1 ring-black/5 ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`} role="status" aria-live="polite">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{toast.type === 'success' ? 'Success' : 'Error'}</div>
              <div className="mt-0.5 text-sm opacity-90">{toast.message}</div>
            </div>
            <button type="button" onClick={() => { if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null }; setToast(null) }} className="ml-1 rounded-md p-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>
        </div>
      )}

      {outOfStockItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Out of stock" onClick={() => setOutOfStockItem(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold text-slate-900">Out of stock</div>
            <div className="mt-2 text-sm text-slate-600"><span className="font-medium text-slate-800 capitalize">{outOfStockItem.name}</span> is currently out of stock and can't be added to the cart.</div>
            <div className="mt-5 flex justify-end"><button type="button" ref={outOfStockOkRef} className="btn" onClick={() => setOutOfStockItem(null)}>OK</button></div>
          </div>
        </div>
      ) : null}

      {/* Top Bar - Now full width at top */}
      <div className="flex flex-col gap-3">
        {/* Customer Search & Last Prescription */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Find Customer (Phone) <span className="ml-2 text-slate-400 font-medium">Ctrl+Shift+F</span> | <span className="text-blue-500">Alt+BackSpace (Edit Cart)</span></label>
            <div className="flex gap-2">
              <input
                ref={customerPhoneInputRef}
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchCustomer(customerPhone) }}
                placeholder="Enter phone number..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
              <button
                type="button"
                onClick={() => searchCustomer(customerPhone)}
                disabled={searchingCustomer || !customerPhone.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                {searchingCustomer ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {foundCustomer ? (
            <div className="flex-1 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 p-3 min-w-[300px]">
              <div className="flex flex-col">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Customer Profile</div>
                <div className="text-sm font-semibold text-slate-900">{foundCustomer.name}</div>
                <div className="text-xs text-slate-600">{foundCustomer.phone}</div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
                  >
                    <History className="h-3.5 w-3.5" /> View History (Ctrl+Shift+H)
                  </button>
                  {foundCustomer.lastDispense && (
                    <button
                      type="button"
                      onClick={loadLastPrescription}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Re-order Last (Ctrl+Shift+R)
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setFoundCustomer(null); prescriptionPatientRef.current = null; patientNameRef.current = ''; customerPhoneWasSetRef.current = false; setCustomerPhone('') }}
                  className="text-[10px] font-bold text-rose-600 hover:underline"
                >
                  Clear Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs text-slate-400 italic font-medium">Search phone to see history and re-order</p>
            </div>
          )}
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${view === 'grid' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <Grid className="h-4 w-4" /> Grid View
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${view === 'list' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <List className="h-4 w-4" /> List View
          </button>
          <button
            type="button"
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${!hideOutOfStock ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {!hideOutOfStock ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} {!hideOutOfStock ? 'Hide Meds' : 'Show Meds'}
          </button>
        </div>

        {/* Search Bar - Expanded */}
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            id="pharmacy-pos-search"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true); setSuggestionSel(0) }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => { setTimeout(() => setSearchOpen(false), 150) }}
            onKeyDownCapture={onSearchKeyDown}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="Search / scan barcode... (Ctrl+D)"
          />
          <button
            type="button"
            onClick={() => { setQuery(''); setSearchOpen(false); searchInputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-rose-500 p-1.5 text-white hover:bg-rose-600 transition"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>

          {searchOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col md:flex-row max-h-[80vh]">
              {/* Primary Suggestions */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border-r border-slate-100">
                <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Search Results</div>
                {suggestions.map((p, i) => (
                  <button type="button" key={p.id} onMouseEnter={() => setSuggestionSel(i)} onClick={() => { addToCart(p.id, { focusQty: true }); setQuery(''); setSearchOpen(false); try { searchInputRef.current?.focus(); searchInputRef.current?.select() } catch { } }} className={`relative flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${i === suggestionSel ? 'bg-sky-100/80 text-slate-900 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-slate-100' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {i === suggestionSel ? <span className="absolute left-0 top-0 h-full w-1 bg-sky-600" /> : null}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-900">{p.name}</div>
                      <div className="truncate text-xs text-slate-500">{p.genericName || ''} {p.manufacturer ? `· ${p.manufacturer}` : ''}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-semibold text-slate-700">PKR {p.unitPrice.toFixed(2)}</div>
                      <div className={`text-[11px] ${p.stock <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{p.stock <= 0 ? 'Out' : `Stock ${p.stock}`}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Generic Alternatives */}
              {(genericAlternatives.length > 0 || loadingAlternatives) && (
                <div className="w-full md:w-72 overflow-y-auto bg-slate-50 divide-y divide-slate-100 border-l border-slate-100">
                  <div className="sticky top-0 z-10 bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Generic Alternatives</span>
                    {loadingAlternatives && <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />}
                  </div>
                  {genericAlternatives.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => { addToCart(p.id, { focusQty: true }); setQuery(''); setSearchOpen(false); try { searchInputRef.current?.focus(); searchInputRef.current?.select() } catch { } }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-white transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-slate-800 text-xs">{p.name}</div>
                        <div className="truncate text-[10px] text-slate-500">{p.manufacturer || ''}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-bold text-slate-700">PKR {p.unitPrice.toFixed(2)}</div>
                        <div className={`text-[9px] ${p.stock <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{p.stock <= 0 ? 'Out' : `Stock ${p.stock}`}</div>
                      </div>
                    </button>
                  ))}
                  {!loadingAlternatives && genericAlternatives.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-slate-400 italic">No generic alternatives found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4 items-start">
        {/* Left Half: Products - Only shown if !hideOutOfStock */}
        {!hideOutOfStock && (
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Pagination Bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(1) }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            <div>
              {view === 'grid' ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.filter(p => !hideOutOfStock || p.stock > 0).map((p) => {
                    const stock = Number(p.stock || 0)
                    const isLowStock = lowStockItems.has(p.id)
                    const isOutOfStock = stock <= 0

                    return (
                      <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        {/* Header with name and stock */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 capitalize truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 capitalize truncate">
                              {p.genericName || 'Tablet'} {p.manufacturer ? `· ${p.manufacturer}` : ''}
                            </div>
                          </div>
                          <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${isOutOfStock ? 'bg-rose-100 text-rose-700' :
                            isLowStock ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                            Stock: {stock}
                          </div>
                        </div>

                        {/* Pricing info */}
                        <div className="mt-2 space-y-0.5">
                          <div className="text-xs text-slate-500">Sale/Pack: PKR {p.salePerPack.toFixed(2)}</div>
                          <div className="text-xs text-slate-500">Units/Pack: {p.unitsPerPack}</div>
                        </div>

                        {/* Unit price */}
                        <div className="mt-3 text-xl font-bold text-slate-900">PKR {p.unitPrice.toFixed(2)}</div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => addToCart(p.id, { focusQty: true })}
                          disabled={isOutOfStock}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="h-4 w-4" /> Add to Cart
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                  {/* Header Row */}
                  <div className="flex items-center gap-3 p-3 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <div className="flex-1">Medicine Name</div>
                    <div className="shrink-0 w-16 text-center">Stock</div>
                    <div className="shrink-0 w-20 text-center">Sale</div>
                    <div className="shrink-0 w-16 text-center">Pack</div>
                    <div className="shrink-0 w-20 text-center">Unit</div>
                    <div className="shrink-0 w-16 text-center">Disc</div>
                    <div className="shrink-0 w-16 text-center">Action</div>
                  </div>
                  
                  {visible.filter(p => !hideOutOfStock || p.stock > 0).map((p, i) => {
                    const stock = Number(p.stock || 0)
                    const isLowStock = lowStockItems.has(p.id)
                    const isOutOfStock = stock <= 0

                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 ${isOutOfStock ? 'bg-rose-50/30' :
                        isLowStock ? 'bg-amber-50/30' :
                          i === sel ? 'bg-slate-50' : ''
                        }`}>
                        {/* Medicine Name - Main column */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 capitalize truncate">{p.name}</div>
                          <div className="text-xs text-slate-500 capitalize truncate">{p.genericName || 'Tablet'} {p.manufacturer ? `· ${p.manufacturer}` : ''}</div>
                        </div>
                        
                        {/* Stock */}
                        <div className={`shrink-0 w-16 text-center text-xs font-medium ${isOutOfStock ? 'text-rose-700' :
                          isLowStock ? 'text-amber-700' :
                            'text-emerald-600'
                          }`}>
                          <div className="font-bold">{stock}</div>
                          <div className="text-[10px] text-slate-500">Stock</div>
                        </div>
                        
                        {/* Sale Price */}
                        <div className="shrink-0 w-20 text-center text-xs">
                          <div className="font-bold text-slate-900">Rs {p.unitPrice.toFixed(0)}</div>
                          <div className="text-[10px] text-slate-500">Sale</div>
                        </div>
                        
                        {/* Pack Info */}
                        <div className="shrink-0 w-16 text-center text-xs">
                          <div className="font-bold text-slate-700">{p.unitsPerPack}</div>
                          <div className="text-[10px] text-slate-500">Pack</div>
                        </div>
                        
                        {/* Unit Price */}
                        <div className="shrink-0 w-20 text-center text-xs">
                          <div className="font-bold text-slate-700">Rs {(p.salePerPack / p.unitsPerPack).toFixed(0)}</div>
                          <div className="text-[10px] text-slate-500">Unit</div>
                        </div>
                        
                        {/* Discount */}
                        <div className="shrink-0 w-16 text-center text-xs">
                          <div className="font-bold text-blue-600">{p.defaultDiscountPct || 0}%</div>
                          <div className="text-[10px] text-slate-500">Disc</div>
                        </div>
                        
                        {/* Add Button */}
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => addToCart(p.id, { focusQty: true })}
                            disabled={isOutOfStock}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" /> Add
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {visible.filter(p => !hideOutOfStock || p.stock > 0).length === 0 && <div className="p-4 text-sm text-slate-500">No items</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Half: Cart & Bill Summary */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <Pharmacy_POSCart
            cart={cart}
            products={products}
            productIndex={productIndex}
            hideOutOfStock={hideOutOfStock}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            onClear={clear}
            onSetQty={setQty}
            onQtyEnter={() => {
              try {
                searchInputRef.current?.focus()
                searchInputRef.current?.select()
                setSearchOpen(true)
              } catch { }
            }}
            onUpdateLine={updateLine}
          />

          {/* Bill Summary */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="font-semibold text-slate-900">Bill Summary</div>
              {hideOutOfStock && (
                <button
                  type="button"
                  onClick={() => setHideOutOfStock(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Show Meds
                </button>
              )}
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-700">
                <span>Total:</span>
                <span className="font-medium">PKR {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Discount:</span>
                <span className="font-medium">PKR {totals.lineDiscount.toFixed(2)}</span>
              </div>

              {/* Bill Discount Row */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <label className="text-xs text-slate-600">Bill Discount (Rs)</label>
                  <input
                    ref={billDiscountInputRef}
                    type="number"
                    min={0}
                    step={0.01}
                    value={totals.totalDiscount.toFixed(2)}
                    onChange={e => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0)
                      // If user enters total discount val, extra bill discount is val - lineDiscount
                      const extra = val - totals.lineDiscount
                      const base = Math.max(0, totals.subtotal - totals.lineDiscount)
                      const pct = base > 0 ? (extra / base) * 100 : 0
                      setBillDiscountPct(Number(pct.toFixed(6)))
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span>PKR {totals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={holdBill}
                  disabled={cart.length === 0}
                  className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  Hold Bill
                </button>
                <button
                  type="button"
                  onClick={() => setHeldOpen(true)}
                  className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Held Bills
                </button>
              </div>
              <button
                type="button"
                disabled={busy || cart.length === 0}
                onClick={openPayment}
                className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {busy ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          </div>

          <Pharmacy_ProcessPaymentDialog
            open={payOpen}
            onClose={() => setPayOpen(false)}
            onConfirm={confirmPayment}
            totalAmount={totals.total}
            initialCustomer={foundCustomer ? {
              id: foundCustomer.id || '',
              name: foundCustomer.name || '',
              phone: foundCustomer.phone || customerPhone || ''
            } : (customerPhone ? {
              id: '',
              name: '',
              phone: customerPhone
            } : undefined)}
          />
          {historyOpen && foundCustomer && (
            <Pharmacy_CustomerHistoryDialog
              open={historyOpen}
              onClose={() => setHistoryOpen(false)}
              customer={foundCustomer}
              onReorder={handleReorderHistory}
            />
          )}
          <Pharmacy_POSReceiptDialog
            open={receiptOpen}
            onClose={() => {
              setReceiptOpen(false)
              setCart([])
              setLastSale(null)
            }}
            receiptNo={lastSale?.no || computedReceiptNo}
            cashReceived={lastSale?.cashReceived !== undefined ? lastSale.cashReceived : payment?.cashReceived}
            changeReturn={lastSale?.changeReturn !== undefined ? lastSale.changeReturn : payment?.changeReturn}
            method={lastSale?.method || payment?.method || 'cash'}
            lines={receiptLines}
            discountPct={lastSale?.discountPct ?? billDiscountPct}
            lineDiscountRs={lastSale?.lineDiscountTotal ?? cart.reduce((s, l) => {
              const sub = Number(l.unitPrice || 0) * Number(l.qty || 0)
              const disc = Math.max(0, Math.min(100, Number(l.discountPct || 0))) * sub / 100
              return s + disc
            }, 0)}
            lineGstSum={lastSale?.lineGstTotal ?? totals.tax}
            customer={lastSale?.customer || payment?.customer}
            customerPhone={lastSale?.customerPhone || payment?.customerPhone}
            autoPrint={true}
            datetime={new Date().toISOString()}
            billGstType={lastSale?.billGstType || billGstType}
            billGstValue={lastSale?.billGstValue ?? billGstValue}
            billGstAmount={lastSale?.billGstAmount ?? totals.billGstAmount}
          />

          <Pharmacy_AuthVerifyDialog
            open={authOpen}
            onClose={() => { setAuthOpen(false); setOnAuthVerified(null) }}
            onVerified={() => { if (onAuthVerified) onAuthVerified() }}
            title="High Value Transaction"
            message={`The bill amount (Rs. ${totals.total.toFixed(2)}) exceeds the maximum limit (Rs. ${settings.maxSaleLimit}). Please verify password to proceed.`}
          />

          {heldOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-800">Held Bills</div>
                  <button type="button" onClick={() => setHeldOpen(false)} className="btn-outline-navy">Close</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y">
                  {heldBills.length === 0 && <div className="p-4 text-sm text-slate-500">No held bills</div>}
                  {heldBills.map(h => (
                    <div key={String((h as any)._id || '')}
                      className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div>
                        <div className="font-medium text-slate-800">{String((h as any)._id || '')}</div>
                        <div className="text-slate-600">{new Date(String(h.createdAtIso || h.createdAt || new Date().toISOString())).toLocaleString()} • Items: {(h.lines || []).length} • Bill Disc: {Number(h.billDiscountPct || 0)}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => restoreHeld(String((h as any)._id || ''))} className="btn">Restore</button>
                        <button type="button" onClick={() => deleteHeld(String((h as any)._id || ''))} className="btn-outline-navy">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
