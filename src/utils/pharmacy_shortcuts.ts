import type { NavigateFunction } from 'react-router-dom'

export type PharmacyShortcutContext = {
  navigate: NavigateFunction
  pathname: string
  isEdit?: boolean
}

export type PharmacyShortcut = {
  id: string
  section: 'Navigation' | 'POS' | 'Inventory' | 'Customers' | 'Suppliers' | 'Sales History' | 'Dashboard' | 'Reports' | 'Settings' | 'Purchase Orders' | 'Audit' | 'Supplier Returns'
  label: string
  keys: string
  docsOnly?: boolean
  match: (e: KeyboardEvent, ctx: PharmacyShortcutContext) => boolean
  run: (e: KeyboardEvent, ctx: PharmacyShortcutContext) => void
}

const key = (e: KeyboardEvent) => (e.key?.toLowerCase?.() || '')

export const PHARMACY_SHORTCUTS: PharmacyShortcut[] = [
  {
    id: 'nav_dashboard',
    section: 'Navigation',
    label: 'Open Dashboard',
    keys: 'Shift + D',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'd',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy')
    },
  },
  {
    id: 'nav_pos',
    section: 'Navigation',
    label: 'Open POS',
    keys: 'Shift + N',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'n',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/pos')
    },
  },
  {
    id: 'nav_inventory',
    section: 'Navigation',
    label: 'Open Inventory',
    keys: 'Shift + I',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'i',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/inventory')
    },
  },
  {
    id: 'nav_add_invoice',
    section: 'Navigation',
    label: 'Open Add Invoice',
    keys: 'Shift + A',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'a',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/inventory/add-invoice')
    },
  },
  {
    id: 'nav_sales_history',
    section: 'Navigation',
    label: 'Open Sales History',
    keys: 'Shift + S',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 's',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/sales-history')
    },
  },
  {
    id: 'nav_purchase_orders',
    section: 'Navigation',
    label: 'Open Purchase Orders',
    keys: 'Shift + O',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'o',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/purchase-orders')
    },
  },
  {
    id: 'nav_reports',
    section: 'Navigation',
    label: 'Open Reports',
    keys: 'Shift + R',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'r',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/reports')
    },
  },
  {
    id: 'nav_customers',
    section: 'Navigation',
    label: 'Open Customers',
    keys: 'Shift + C',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'c',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/customers')
    },
  },
  {
    id: 'nav_suppliers',
    section: 'Navigation',
    label: 'Open Suppliers',
    keys: 'Shift + U',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'u',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/suppliers')
    },
  },
  {
    id: 'nav_settings',
    section: 'Navigation',
    label: 'Open Settings',
    keys: 'Shift + T',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 't',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/settings')
    },
  },
  {
    id: 'nav_guidelines',
    section: 'Navigation',
    label: 'Open Guidelines',
    keys: 'Shift + G',
    match: (e) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'g',
    run: (e, ctx) => {
      e.preventDefault()
      ctx.navigate('/pharmacy/guidelines')
    },
  },
  {
    id: 'pos_focus_search',
    section: 'POS',
    label: 'Focus POS search',
    keys: 'Ctrl + D',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'd' && ctx.pathname.startsWith('/pharmacy/pos'),
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-pos-search') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'pos_payment_shift_enter',
    section: 'POS',
    label: 'Open payment dialog',
    keys: 'Shift + Enter',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_process_payment',
    section: 'POS',
    label: 'Process payment',
    keys: 'Ctrl + P',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'p' && ctx.pathname.startsWith('/pharmacy/pos'),
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:pos:pay')) } catch { }
    },
  },
  {
    id: 'pos_close_receipt',
    section: 'POS',
    label: 'Close bill receipt dialog',
    keys: 'Ctrl + Q',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_select_suggestion',
    section: 'POS',
    label: 'Select customer suggestion (Enter) / Navigate suggestions (Up/Down)',
    keys: 'Enter / Up / Down',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_reorder_last',
    section: 'POS',
    label: 'Re-order last purchase (selected customer)',
    keys: 'Ctrl + Shift + R',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_customer_history',
    section: 'POS',
    label: 'Open customer history (if customer selected) / product history (if cart has item)',
    keys: 'Ctrl + Shift + H',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_focus_customer_phone',
    section: 'POS',
    label: 'Focus customer phone',
    keys: 'Ctrl + Shift + F',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_focus_last_qty',
    section: 'POS',
    label: 'Focus last cart item qty',
    keys: 'Alt + Backspace',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_remove_last',
    section: 'POS',
    label: 'Remove last cart item',
    keys: 'Delete',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_qty_inc',
    section: 'POS',
    label: 'Increase qty (last cart item)',
    keys: '+',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_qty_dec',
    section: 'POS',
    label: 'Decrease qty (last cart item)',
    keys: '-',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_nav_up',
    section: 'POS',
    label: 'Navigate medicines list up',
    keys: 'Arrow Up',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_nav_down',
    section: 'POS',
    label: 'Navigate medicines list down',
    keys: 'Arrow Down',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'pos_cart_add_selected',
    section: 'POS',
    label: 'Add selected medicine to cart',
    keys: 'Enter',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_focus_search',
    section: 'Inventory',
    label: 'Focus inventory search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname.startsWith('/pharmacy/inventory'),
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-inventory-search') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'inv_update_stock',
    section: 'Inventory',
    label: 'Update Stock',
    keys: 'Ctrl + U',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'u' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:inventory:update-stock')) } catch { }
    },
  },
  {
    id: 'inv_audit_adjust',
    section: 'Inventory',
    label: 'Audit Adjustment',
    keys: 'Ctrl + J',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'j' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:inventory:audit-adjust')) } catch { }
    },
  },
  {
    id: 'inv_add_invoice',
    section: 'Inventory',
    label: 'Add Invoice',
    keys: 'Ctrl + I',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'i' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:inventory:add-invoice')) } catch { }
    },
  },
  {
    id: 'inv_refresh',
    section: 'Inventory',
    label: 'Refresh Inventory',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:inventory:refresh')) } catch { }
    },
  },
  {
    id: 'inv_export',
    section: 'Inventory',
    label: 'Export Inventory',
    keys: 'Ctrl + E',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'e' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:inventory:export')) } catch { }
    },
  },
  {
    id: 'inv_import_excel',
    section: 'Inventory',
    label: 'Import Excel',
    keys: 'Ctrl + Shift + E',
    match: (e, ctx) => e.ctrlKey && e.shiftKey && !e.altKey && key(e) === 'e' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      document.getElementById('pharmacy-excel-import')?.click()
    },
  },
  {
    id: 'inv_import_csv',
    section: 'Inventory',
    label: 'Import CSV',
    keys: 'Ctrl + Shift + C',
    match: (e, ctx) => e.ctrlKey && e.shiftKey && !e.altKey && key(e) === 'c' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      document.getElementById('pharmacy-csv-import')?.click()
    },
  },
  {
    id: 'inv_approve_all',
    section: 'Inventory',
    label: 'Approve All (Pending Review)',
    keys: 'Shift + A',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_reject_all',
    section: 'Inventory',
    label: 'Reject All (Pending Review)',
    keys: 'Shift + R',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_edit_first',
    section: 'Inventory',
    label: 'Edit First Item',
    keys: 'Alt + E',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_approve_first',
    section: 'Inventory',
    label: 'Approve First Item (Pending Review)',
    keys: 'Alt + A',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_reject_first',
    section: 'Inventory',
    label: 'Reject First Item (Pending Review)',
    keys: 'Alt + R',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_delete_first',
    section: 'Inventory',
    label: 'Delete First Item (All Items)',
    keys: 'Alt + D',
    docsOnly: true,
    match: () => false,
    run: () => { },
  },
  {
    id: 'inv_tab_all',
    section: 'Inventory',
    label: 'Switch to All Items',
    keys: 'Alt + 1',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '1' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'All Items' })) } catch { }
    },
  },
  {
    id: 'inv_tab_pending',
    section: 'Inventory',
    label: 'Switch to Pending Review',
    keys: 'Alt + 2',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '2' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Pending Review' })) } catch { }
    },
  },
  {
    id: 'inv_tab_low',
    section: 'Inventory',
    label: 'Switch to Low Stock',
    keys: 'Alt + 3',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '3' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Low Stock' })) } catch { }
    },
  },
  {
    id: 'inv_tab_expiring',
    section: 'Inventory',
    label: 'Switch to Expiring Soon',
    keys: 'Alt + 4',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '4' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Expiring Soon' })) } catch { }
    },
  },
  {
    id: 'inv_tab_out',
    section: 'Inventory',
    label: 'Switch to Out of Stock',
    keys: 'Alt + 5',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '5' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Out of Stock' })) } catch { }
    },
  },
  {
    id: 'inv_tab_narcotics',
    section: 'Inventory',
    label: 'Switch to Narcotics',
    keys: 'Alt + 6',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '6' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Narcotics' })) } catch { }
    },
  },
  {
    id: 'inv_tab_dead',
    section: 'Inventory',
    label: 'Switch to Dead Items',
    keys: 'Alt + 7',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === '7' && ctx.pathname === '/pharmacy/inventory',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new CustomEvent('pharmacy:inventory:set-tab', { detail: 'Dead Items' })) } catch { }
    },
  },
  // Invoice Page
  {
    id: 'inv_add_row',
    section: 'Inventory',
    label: 'Add New Item Row & Focus Name Field',
    keys: 'Alt + N',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === 'n' && ctx.pathname.includes('/pharmacy/inventory/add-invoice'),
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:invoice:add-row')) } catch { }
    },
  },
  {
    id: 'inv_save_invoice',
    section: 'Inventory',
    label: 'Save/Update Invoice',
    keys: 'Ctrl + S',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 's' && ctx.pathname.includes('/pharmacy/inventory/add-invoice'),
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:invoice:save')) } catch { }
    },
  },
  {
    id: 'inv_hold_invoice',
    section: 'Inventory',
    label: 'Hold Invoice',
    keys: 'Ctrl + H',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'h' && ctx.pathname.includes('/pharmacy/inventory/add-invoice'),
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:invoice:hold')) } catch { }
    },
  },
  {
    id: 'inv_focus_supplier',
    section: 'Inventory',
    label: 'Focus Supplier Search',
    keys: 'Alt + S',
    match: (e, ctx) => e.altKey && !e.ctrlKey && !e.shiftKey && key(e) === 's' && ctx.pathname.includes('/pharmacy/inventory/add-invoice'),
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-add-invoice-supplier') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'inv_cancel_invoice',
    section: 'Inventory',
    label: 'Cancel Invoice',
    keys: 'Esc',
    match: (e, ctx) => !e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Escape' && ctx.pathname.includes('/pharmacy/inventory/add-invoice'),
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:invoice:cancel')) } catch { }
    },
  },
  // Customers
  {
    id: 'cust_focus_search',
    section: 'Customers',
    label: 'Focus customer search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/customers',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-customers-search') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'cust_add',
    section: 'Customers',
    label: 'Add Customer',
    keys: 'Ctrl + A',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'a' && ctx.pathname === '/pharmacy/customers',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:customers:add')) } catch { }
    },
  },
  {
    id: 'cust_export',
    section: 'Customers',
    label: 'Export Customers',
    keys: 'Ctrl + E',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'e' && ctx.pathname === '/pharmacy/customers',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:customers:export')) } catch { }
    },
  },
  // Suppliers
  {
    id: 'supp_focus_search',
    section: 'Suppliers',
    label: 'Focus supplier search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/suppliers',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-suppliers-search') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'supp_add',
    section: 'Suppliers',
    label: 'Add Supplier',
    keys: 'Ctrl + A',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'a' && ctx.pathname === '/pharmacy/suppliers',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:suppliers:add')) } catch { }
    },
  },
  // Sales History
  {
    id: 'sales_focus_search',
    section: 'Sales History',
    label: 'Focus medicine search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/sales-history',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-sales-history-medicine') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'sales_export_csv',
    section: 'Sales History',
    label: 'Export CSV',
    keys: 'Ctrl + E',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'e' && ctx.pathname === '/pharmacy/sales-history',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:sales:export-csv')) } catch { }
    },
  },
  {
    id: 'sales_export_pdf',
    section: 'Sales History',
    label: 'Export PDF',
    keys: 'Ctrl + P',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'p' && ctx.pathname === '/pharmacy/sales-history',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:sales:export-pdf')) } catch { }
    },
  },
  // Dashboard
  {
    id: 'db_refresh',
    section: 'Dashboard',
    label: 'Refresh Dashboard',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:dashboard:refresh')) } catch { }
    },
  },
  // Reports
  {
    id: 'rep_refresh',
    section: 'Reports',
    label: 'Refresh Report',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy/reports',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:reports:refresh')) } catch { }
    },
  },
  {
    id: 'rep_print',
    section: 'Reports',
    label: 'Print Closing Sheet',
    keys: 'Ctrl + P',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'p' && ctx.pathname === '/pharmacy/reports',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:reports:print')) } catch { }
    },
  },
  {
    id: 'rep_download',
    section: 'Reports',
    label: 'Download Closing Sheet',
    keys: 'Ctrl + D',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'd' && ctx.pathname === '/pharmacy/reports',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:reports:download')) } catch { }
    },
  },
  // Settings
  {
    id: 'set_save',
    section: 'Settings',
    label: 'Save Settings',
    keys: 'Ctrl + S',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 's' && ctx.pathname === '/pharmacy/settings',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:settings:save')) } catch { }
    },
  },
  // Purchase Orders
  {
    id: 'po_add',
    section: 'Purchase Orders',
    label: 'Create Purchase Order',
    keys: 'Ctrl + A',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'a' && ctx.pathname === '/pharmacy/purchase-orders',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:po:add')) } catch { }
    },
  },
  {
    id: 'po_focus_search',
    section: 'Purchase Orders',
    label: 'Focus PO search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/purchase-orders',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-po-search') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'po_refresh',
    section: 'Purchase Orders',
    label: 'Refresh POs',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy/purchase-orders',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:po:refresh')) } catch { }
    },
  },
  // Audit
  {
    id: 'audit_focus_search',
    section: 'Audit',
    label: 'Focus search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/audit',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'audit_refresh',
    section: 'Audit',
    label: 'Refresh Data',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy/audit',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:audit:refresh')) } catch { }
    },
  },
  {
    id: 'audit_export',
    section: 'Audit',
    label: 'Export CSV',
    keys: 'Ctrl + E',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'e' && ctx.pathname === '/pharmacy/audit',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:audit:export')) } catch { }
    },
  },
  {
    id: 'audit_print',
    section: 'Audit',
    label: 'Print Report',
    keys: 'Ctrl + P',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'p' && ctx.pathname === '/pharmacy/audit',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:audit:print')) } catch { }
    },
  },
  // Supplier Returns
  {
    id: 'sup_ret_focus_search',
    section: 'Supplier Returns',
    label: 'Focus supplier search',
    keys: 'Shift + F',
    match: (e, ctx) => e.shiftKey && !e.ctrlKey && !e.altKey && key(e) === 'f' && ctx.pathname === '/pharmacy/supplier-returns',
    run: (e) => {
      e.preventDefault()
      setTimeout(() => { (document.getElementById('pharmacy-supplier-return-supplier') as HTMLInputElement | null)?.focus() }, 0)
    },
  },
  {
    id: 'sup_ret_refresh',
    section: 'Supplier Returns',
    label: 'Search/Refresh',
    keys: 'Ctrl + R',
    match: (e, ctx) => e.ctrlKey && !e.shiftKey && !e.altKey && key(e) === 'r' && ctx.pathname === '/pharmacy/supplier-returns',
    run: (e) => {
      e.preventDefault()
      try { window.dispatchEvent(new Event('pharmacy:sup-ret:refresh')) } catch { }
    },
  },
]
