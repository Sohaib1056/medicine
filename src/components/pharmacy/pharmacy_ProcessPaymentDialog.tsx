import { useState, useEffect, useRef } from 'react'
import { pharmacyApi } from '../../utils/api'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (data: {
    method: 'cash' | 'credit'
    customer?: string
    customerId?: string
    customerPhone?: string
    cashReceived?: number
    changeReturn?: number
  }) => void
  totalAmount: number
  initialCustomer?: {
    id?: string
    name?: string
    phone?: string
  }
}

export default function Pharmacy_ProcessPaymentDialog({ open, onClose, onConfirm, totalAmount, initialCustomer }: Props) {
  const [form, setForm] = useState<{ name: string; phone: string; customerId?: string }>({ name: '', phone: '', customerId: undefined })
  const [cashReceived, setCashReceived] = useState<string>('')
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [customerSuggestions, setCustomerSuggestions] = useState<Array<{ id: string; name: string; phone: string }>>([])

  useEffect(() => {
    if (open) {
      console.log('Payment dialog opening with initialCustomer:', initialCustomer)
      setForm({
        name: initialCustomer?.name || '',
        phone: initialCustomer?.phone || '',
        customerId: initialCustomer?.id || undefined
      })
      console.log('Payment dialog form set to:', {
        name: initialCustomer?.name || '',
        phone: initialCustomer?.phone || '',
        customerId: initialCustomer?.id || undefined
      })
      setCashReceived('')
      setCustomerSuggestions([])

      // Auto-focus phone number field when dialog opens
      setTimeout(() => {
        phoneInputRef.current?.focus()
      }, 100)
    }
  }, [open, initialCustomer])

  // Search customer when phone number changes
  useEffect(() => {
    const phone = (form.phone || '').replace(/-/g, '').trim()

    if (phone.length >= 3) {
      setSearchingCustomer(true)
      const timer = setTimeout(async () => {
        try {
          const res: any = await pharmacyApi.getCustomerByPhone(phone)
          if (res?.customer) {
            setCustomerSuggestions([{
              id: res.customer._id || res.customer.id,
              name: res.customer.name,
              phone: res.customer.phone
            }])
          } else {
            setCustomerSuggestions([])
          }
        } catch {
          setCustomerSuggestions([])
        } finally {
          setSearchingCustomer(false)
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setCustomerSuggestions([])
      setSearchingCustomer(false)
    }
  }, [form.phone])

  const changeReturn = cashReceived
    ? Math.max(0, Number(cashReceived) - totalAmount)
    : 0

  const handleConfirm = () => {
    const data: any = {
      method: 'cash',
      customer: form.name.trim() || undefined,
      customerId: form.customerId || initialCustomer?.id || undefined,
      customerPhone: form.phone.trim() || undefined,
      cashReceived: Number(cashReceived) || totalAmount,
      changeReturn: changeReturn
    }

    onConfirm(data)
  }

  const selectCustomer = (customer: { id: string; name: string; phone: string }) => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      customerId: customer.id
    })
    setCustomerSuggestions([])
  }

  const canConfirm = Number(cashReceived) >= totalAmount

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-0 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-extrabold text-slate-900">Process Payment</h3>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-blue-600 px-6 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 transition"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Phone Number (optional)
            </label>
            <input
              ref={phoneInputRef}
              type="text"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border-2 border-yellow-500 px-4 py-3 text-sm font-medium focus:border-yellow-600 focus:outline-none"
              placeholder="03xx-xxxxxxx"
            />

            {/* Customer Suggestions Dropdown */}
            {customerSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border-2 border-blue-300 bg-white shadow-xl">
                {customerSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-100 transition border-b border-slate-200 last:border-b-0"
                  >
                    <div className="text-sm font-bold text-slate-900">{customer.name}</div>
                    <div className="text-xs font-medium text-slate-600">{customer.phone}</div>
                  </button>
                ))}
              </div>
            )}

            {searchingCustomer && (
              <div className="absolute right-3 top-11 text-xs font-semibold text-blue-600">
                Searching...
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Customer Name (optional)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="Walk-in"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-y-2 border-slate-200">
            <span className="text-sm font-bold text-slate-700">Total Amount:</span>
            <span className="text-2xl font-extrabold text-slate-900">
              Rs {totalAmount.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Cash Received (Rendered)
            </label>
            <input
              type="number"
              value={cashReceived}
              onChange={e => setCashReceived(e.target.value)}
              min={0}
              step="0.01"
              className="w-full rounded-lg border-2 border-slate-400 px-4 py-3 text-lg font-bold text-slate-700 focus:border-slate-500 focus:outline-none"
              placeholder="Rs 0.00"
            />
          </div>

          {cashReceived && Number(cashReceived) >= totalAmount && (
            <div className="rounded-lg bg-green-100 border-2 border-green-400 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-green-800">Change to Return:</span>
                <span className="text-xl font-extrabold text-green-900">
                  Rs {changeReturn.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {cashReceived && Number(cashReceived) < totalAmount && (
            <div className="rounded-lg bg-red-100 border-2 border-red-400 p-3 text-sm font-bold text-red-800">
              Cash received is less than total amount
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-slate-400 px-8 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-lg bg-blue-700 px-8 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}
