import { useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { pharmacyApi } from '../../utils/api'

interface AddItemDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  genericName: string
  category: string
  manufacturer: string
  brand: string
  unitType: string
  shelfNumber: string
  unitsPerPack: number
  onHand: number
  minStock: string
  salePerUnit: string
  narcotic: boolean
  barcode: string
  description: string
  image: string
}

interface FormErrors {
  name?: string
  unitsPerPack?: string
  onHand?: string
  salePerUnit?: string
  image?: string
  general?: string
}

export default function Pharmacy_AddItemDialog({ open, onClose, onSuccess }: AddItemDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    brand: '',
    unitType: '',
    shelfNumber: '',
    unitsPerPack: 1,
    onHand: 0,
    minStock: '',
    salePerUnit: '',
    narcotic: false,
    barcode: '',
    description: '',
    image: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        genericName: '',
        category: '',
        manufacturer: '',
        brand: '',
        unitType: '',
        shelfNumber: '',
        unitsPerPack: 1,
        onHand: 0,
        minStock: '',
        salePerUnit: '',
        narcotic: false,
        barcode: '',
        description: '',
        image: '',
      })
      setErrors({})
      setImageFile(null)
      setImagePreview('')
    }
  }, [open])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Invalid file type. Please select JPEG, PNG, GIF, or WebP.' }))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image file is too large. Maximum size is 5MB.' }))
      return
    }

    setImageFile(file)
    setErrors(prev => ({ ...prev, image: undefined }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload immediately
    setUploading(true)
    try {
      const response = await pharmacyApi.uploadInventoryImage(file)
      setFormData(prev => ({ ...prev, image: response.url }))
    } catch (err) {
      setErrors(prev => ({ ...prev, image: 'Image upload failed. Please try again.' }))
    } finally {
      setUploading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    // Medicine name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required'
    }

    // Units per pack must be >= 1
    if (formData.unitsPerPack < 1) {
      newErrors.unitsPerPack = 'Units per pack must be at least 1'
    }

    // Initial stock cannot be negative
    if (formData.onHand < 0) {
      newErrors.onHand = 'Stock quantity cannot be negative'
    }

    // Sale price must be valid number if provided
    if (formData.salePerUnit && isNaN(Number(formData.salePerUnit))) {
      newErrors.salePerUnit = 'Please enter a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setErrors(prev => ({ ...prev, general: undefined }))

    try {
      await pharmacyApi.createInventoryItem({
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || undefined,
        category: formData.category.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        unitType: formData.unitType.trim() || undefined,
        shelfNumber: formData.shelfNumber.trim() || undefined,
        unitsPerPack: formData.unitsPerPack,
        onHand: formData.onHand,
        minStock: formData.minStock ? Number(formData.minStock) : undefined,
        salePerUnit: formData.salePerUnit ? Number(formData.salePerUnit) : undefined,
        narcotic: formData.narcotic,
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
        image: formData.image || undefined,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to create item. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key to submit
  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && open && !loading) {
        const target = e.target as HTMLElement
        // Don't submit if user is typing in textarea
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleEnter)
    return () => window.removeEventListener('keydown', handleEnter)
  }, [open, loading, formData])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Inventory Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Medicine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter medicine name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Generic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
              <input
                type="text"
                value={formData.genericName}
                onChange={(e) => handleChange('genericName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter generic name"
              />
            </div>

            {/* Row: Category, Manufacturer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Antibiotic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter manufacturer"
                />
              </div>
            </div>

            {/* Row: Brand, Unit Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                <input
                  type="text"
                  value={formData.unitType}
                  onChange={(e) => handleChange('unitType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., tablet, ml"
                />
              </div>
            </div>

            {/* Row: Shelf Number, Barcode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Number</label>
                <input
                  type="text"
                  value={formData.shelfNumber}
                  onChange={(e) => handleChange('shelfNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter shelf location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter barcode"
                />
              </div>
            </div>

            {/* Row: Units Per Pack, Initial Stock, Min Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Per Pack</label>
                <input
                  type="number"
                  value={formData.unitsPerPack}
                  onChange={(e) => handleChange('unitsPerPack', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.unitsPerPack ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.unitsPerPack && <p className="mt-1 text-sm text-red-600">{errors.unitsPerPack}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={formData.onHand}
                  onChange={(e) => handleChange('onHand', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.onHand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.onHand && <p className="mt-1 text-sm text-red-600">{errors.onHand}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange('minStock', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Sale Price Per Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price Per Unit</label>
              <input
                type="number"
                step="0.01"
                value={formData.salePerUnit}
                onChange={(e) => handleChange('salePerUnit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salePerUnit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter sale price"
              />
              {errors.salePerUnit && <p className="mt-1 text-sm text-red-600">{errors.salePerUnit}</p>}
            </div>

            {/* Narcotic Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="narcotic"
                checked={formData.narcotic}
                onChange={(e) => handleChange('narcotic', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="narcotic" className="ml-2 block text-sm text-gray-700">
                Narcotic / Controlled Substance
              </label>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                  {uploading && (
                    <p className="mt-1 text-sm text-blue-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </p>
                  )}
                </div>
                {imagePreview && (
                  <div className="w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter item description (optional)"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading || uploading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
