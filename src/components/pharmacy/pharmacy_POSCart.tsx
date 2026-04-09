import { Plus, Minus, Trash2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  genericName?: string
  unitPrice: number
  stock?: number
  salePerPack?: number
  unitsPerPack?: number
  defaultDiscountPct?: number
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

type Props = {
  cart: CartLine[]
  products: Product[]
  productIndex?: Record<string, Product>
  hideOutOfStock?: boolean
  onInc: (id: string) => void
  onDec: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onSetQty: (id: string, qty: number) => void
  onQtyEnter?: () => void
  onUpdateLine?: (id: string, updates: Partial<CartLine>) => void
}

export default function Pharmacy_POSCart({ cart, products, productIndex, hideOutOfStock, onInc, onDec, onRemove, onClear, onSetQty, onQtyEnter, onUpdateLine }: Props) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="font-semibold text-slate-900">Shopping Cart ({cart.length})</div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 transition"
          aria-label="Clear cart"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-slate-100">
        {cart.length === 0 && (
          <div className="p-4 text-sm text-slate-500 text-center">No items in cart</div>
        )}
        {cart.map(line => {
          const p = (productIndex && productIndex[line.productId]) || products.find(pp => pp.id === line.productId)
          const unitPrice = Number(p?.unitPrice ?? line.unitPrice) || 0

          return (
            <div key={line.id} className={`p-3 ${hideOutOfStock ? 'bg-slate-50/50' : ''}`}>
              {/* Item name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 capitalize truncate">{p?.name || line.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.id)}
                  className="shrink-0 rounded p-1 text-rose-500 hover:bg-rose-50 transition"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Product Details - Show when Hide Meds is active */}
              {hideOutOfStock && p && (
                <div className="mt-2 bg-white rounded-lg p-2 border border-slate-100">
                  {/* Table Headers */}
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1">
                    <div>Stock</div>
                    <div>Sale/Pack</div>
                    <div>Unit/Pack</div>
                    <div>Sale/Unit</div>
                    <div>Max Disc.%</div>
                  </div>
                  {/* Table Row */}
                  <div className="grid grid-cols-5 gap-1 text-xs text-slate-700 items-center">
                    <div className="font-medium">{p.stock ?? '-'}</div>
                    <div className="font-medium">PKR {p.salePerPack?.toFixed(2) ?? '-'}</div>
                    <div className="font-medium">{p.unitsPerPack ?? '-'}</div>
                    <div className="font-medium">PKR {unitPrice.toFixed(2)}</div>
                    {/* Max Discount % - Read-only display of the limit */}
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 font-medium">Limit</div>
                      <div className="font-semibold text-rose-600">{line.maxDiscountPct ?? p.defaultDiscountPct ?? 0}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity controls and total */}
              <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Qty Control */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Qty:</span>
                    <button
                      type="button"
                      onClick={() => onDec(line.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      id={`pharmacy-pos-qty-${line.id}`}
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={e => {
                        const v = parseInt(e.target.value || '1', 10)
                        onSetQty(line.id, isNaN(v) ? 1 : v)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'ArrowDown' && !e.shiftKey) {
                          e.preventDefault()
                          e.stopPropagation()
                          const idx = cart.findIndex(l => l.id === line.id)
                          if (idx < cart.length - 1) {
                            const nextId = cart[idx + 1].id
                            const nextEl = document.getElementById(`pharmacy-pos-qty-${nextId}`) as HTMLInputElement | null
                            if (nextEl) { nextEl.focus(); nextEl.select() }
                          }
                          return
                        }
                        if (e.key === 'ArrowUp' && !e.shiftKey) {
                          e.preventDefault()
                          e.stopPropagation()
                          const idx = cart.findIndex(l => l.id === line.id)
                          if (idx > 0) {
                            const prevId = cart[idx - 1].id
                            const prevEl = document.getElementById(`pharmacy-pos-qty-${prevId}`) as HTMLInputElement | null
                            if (prevEl) { prevEl.focus(); prevEl.select() }
                          }
                          return
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          e.stopPropagation()
                          try {
                            const discEl = document.getElementById(`pharmacy-pos-disc-${line.id}`) as HTMLInputElement | null
                            if (discEl) {
                              discEl.focus()
                              discEl.select()
                            } else {
                              (e.target as HTMLInputElement).blur()
                              onQtyEnter?.()
                            }
                          } catch { }
                        }
                      }}
                      className="h-7 w-12 rounded border border-slate-300 bg-white text-center text-sm text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => onInc(line.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Discount Control - New */}
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Disc.%:</span>
                      <input
                        id={`pharmacy-pos-disc-${line.id}`}
                        type="number"
                        min={0}
                        max={line.maxDiscountPct ?? 100}
                        step="0.01"
                        value={line.discountPct ?? 0}
                        onChange={e => {
                          const limit = line.maxDiscountPct ?? 100
                          const val = parseFloat(e.target.value) || 0
                          const v = Math.max(0, Math.min(limit, val))
                          onUpdateLine?.(line.id, { discountPct: v })
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown' && !e.shiftKey) {
                            e.preventDefault()
                            e.stopPropagation()
                            const idx = cart.findIndex(l => l.id === line.id)
                            if (idx < cart.length - 1) {
                              const nextId = cart[idx + 1].id
                              const nextEl = document.getElementById(`pharmacy-pos-disc-${nextId}`) as HTMLInputElement | null
                              if (nextEl) { nextEl.focus(); nextEl.select() }
                            }
                            return
                          }
                          if (e.key === 'ArrowUp' && !e.shiftKey) {
                            e.preventDefault()
                            e.stopPropagation()
                            const idx = cart.findIndex(l => l.id === line.id)
                            if (idx > 0) {
                              const prevId = cart[idx - 1].id
                              const prevEl = document.getElementById(`pharmacy-pos-disc-${prevId}`) as HTMLInputElement | null
                              if (prevEl) { prevEl.focus(); prevEl.select() }
                            }
                            return
                          }
                          if (e.key === 'ArrowLeft' && e.ctrlKey) {
                            e.preventDefault()
                            e.stopPropagation()
                            const qtyEl = document.getElementById(`pharmacy-pos-qty-${line.id}`) as HTMLInputElement | null
                            if (qtyEl) {
                              qtyEl.focus()
                              qtyEl.select()
                            }
                            return
                          }
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            e.stopPropagation()
                            try {
                              const unitEl = document.getElementById(`pharmacy-pos-unit-${line.id}`) as HTMLSelectElement | null
                              if (unitEl) {
                                unitEl.focus()
                              } else {
                                (e.target as HTMLInputElement).blur()
                                onQtyEnter?.()
                              }
                            } catch { }
                          }
                        }}
                        className={`h-7 w-14 rounded border text-center text-sm font-medium ${(line.discountPct ?? 0) > 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        title={`Max allowed discount: ${line.maxDiscountPct ?? 100}%`}
                      />
                    </div>
                    {/* Display default discount percentage below */}
                    <div className="text-[10px] text-slate-500 font-medium pl-10">
                      Default: {line.maxDiscountPct ?? p?.defaultDiscountPct ?? 0}%
                    </div>
                  </div>

                  {/* Unit/Pack dropdown */}
                  <select
                    id={`pharmacy-pos-unit-${line.id}`}
                    value={line.packMode || 'loose'}
                    onChange={e => {
                      const newMode = e.target.value as 'loose' | 'pack'
                      onUpdateLine?.(line.id, { packMode: newMode })
                    }}
                    onKeyDown={e => {
                      if (e.key === 'ArrowDown' && !e.shiftKey) {
                        e.preventDefault()
                        e.stopPropagation()
                        const idx = cart.findIndex(l => l.id === line.id)
                        if (idx < cart.length - 1) {
                          const nextId = cart[idx + 1].id
                          const nextEl = document.getElementById(`pharmacy-pos-unit-${nextId}`) as HTMLSelectElement | null
                          if (nextEl) { nextEl.focus() }
                        }
                        return
                      }
                      if (e.key === 'ArrowUp' && !e.shiftKey) {
                        e.preventDefault()
                        e.stopPropagation()
                        const idx = cart.findIndex(l => l.id === line.id)
                        if (idx > 0) {
                          const prevId = cart[idx - 1].id
                          const prevEl = document.getElementById(`pharmacy-pos-unit-${prevId}`) as HTMLSelectElement | null
                          if (prevEl) { prevEl.focus() }
                        }
                        return
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        const searchEl = document.getElementById('pharmacy-pos-search') as HTMLInputElement | null
                        if (searchEl) {
                          searchEl.focus()
                          searchEl.select()
                        } else {
                          onQtyEnter?.()
                        }
                      }
                      if (e.key === 'ArrowLeft' && e.ctrlKey) {
                        e.preventDefault()
                        e.stopPropagation()
                        const discEl = document.getElementById(`pharmacy-pos-disc-${line.id}`) as HTMLInputElement | null
                        if (discEl) {
                          discEl.focus()
                          discEl.select()
                        }
                      }
                    }}
                    className="h-7 rounded border border-slate-300 px-2 text-xs"
                  >
                    <option value="loose">Unit</option>
                    <option value="pack">Pack ({p?.unitsPerPack || 1} units)</option>
                  </select>
                  <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ml-2">
                    Pack size: {p?.unitsPerPack || 1}
                  </span>
                  {line.packMode === 'pack' && p?.unitsPerPack && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 ml-2">
                      {Math.ceil(line.qty)} packs • {p.unitsPerPack} units/pack
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  {(line.discountPct ?? 0) > 0 && (
                    <div className="text-[10px] text-slate-400 line-through">
                      PKR {((line.packMode === 'pack' ? unitPrice * (p?.unitsPerPack || 1) : unitPrice) * line.qty).toFixed(2)}
                    </div>
                  )}
                  <div className="font-semibold text-slate-900">
                    PKR {(((line.packMode === 'pack' ? unitPrice * (p?.unitsPerPack || 1) : unitPrice) * line.qty) * (1 - (line.discountPct || 0) / 100)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
