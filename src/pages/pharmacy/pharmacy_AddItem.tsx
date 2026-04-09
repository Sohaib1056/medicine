import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, Loader2, Package } from 'lucide-react'
import { pharmacyApi } from '../../utils/api'

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

export default function Pharmacy_AddItem() {
  const navigate = useNavigate()
  
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

  // Focus on name field when page loads
  useEffect(() => {
    const nameInput = document.getElementById('medicine-name') as HTMLInputElement
    if (nameInput) {
      nameInput.focus()
    }
  }, [])

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

      // Success - navigate back to inventory
      navigate('/pharmacy/inventory', { 
        state: { 
          message: `Item "${formData.name}" created successfully!`,
          type: 'success'
        }
      })
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || 'Failed to create item. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pharmacy/inventory')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Inventory
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Add New Item</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Item Details</h2>
            <p className="text-sm text-gray-500 mt-1">Enter the details for the new inventory item</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Medicine Name */}
            <div>
              <label htmlFor="medicine-name" className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                id="medicine-name"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name</label>
              <input
                type="text"
                value={formData.genericName}
                onChange={(e) => handleChange('genericName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter generic name"
              />
            </div>

            {/* Row: Category, Manufacturer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Antibiotic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Number</label>
                <input
                  type="text"
                  value={formData.shelfNumber}
                  onChange={(e) => handleChange('shelfNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter shelf location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units Per Pack</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price Per Unit (Rs)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
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
                  <div className="w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter item description (optional)"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}