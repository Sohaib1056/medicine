import { Request, Response } from 'express'
import { InventoryItem } from '../../pharmacy/models/InventoryItem'

// Helper to check if medicine is expired
function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const now = new Date()
  return expiry < now
}

// Helper to transform inventory item to product format
function transformToProduct(item: any) {
  const price = Number(item.lastSalePerUnit || 0)
  const discount = Number(item.defaultDiscountPct || 0)
  const originalPrice = discount > 0 ? price / (1 - discount / 100) : price
  const stock = Number(item.onHand || 0)
  const expired = isExpired(item.earliestExpiry)
  
  return {
    id: item._id.toString(),
    name: item.name,
    genericName: item.genericName || '',
    brand: item.brand || item.manufacturer || '',
    manufacturer: item.manufacturer || '',
    category: item.category || 'Medicine',
    price: Number(price.toFixed(2)),
    originalPrice: Number(originalPrice.toFixed(2)),
    discount: discount,
    image: item.image || '',
    description: item.description || '',
    inStock: stock > 0 && !expired,
    stock: expired ? 0 : stock,
    requiresPrescription: item.narcotic || false,
    form: item.unitType || '',
    packSize: item.unitsPerPack > 1 ? `${item.unitsPerPack} units/pack` : '1 unit',
    unitsPerPack: item.unitsPerPack || 1,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 100) + 10,
  }
}

// GET /api/products - List all products
export async function list(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || ''
    const category = (req.query.category as string) || ''
    const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)))
    const page = Math.max(1, Number(req.query.page || 1))
    const skip = (page - 1) * limit

    // Build filter - only show items with stock > 0
    const filter: any = { onHand: { $gt: 0 } }
    
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp(escaped, 'i')
      filter.$or = [
        { name: rx },
        { category: rx },
        { genericName: rx },
        { manufacturer: rx },
        { brand: rx }
      ]
    }
    
    if (category && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i')
    }

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .select({
          name: 1,
          category: 1,
          genericName: 1,
          manufacturer: 1,
          brand: 1,
          image: 1,
          description: 1,
          onHand: 1,
          lastSalePerUnit: 1,
          unitsPerPack: 1,
          unitType: 1,
          narcotic: 1,
          defaultDiscountPct: 1,
          earliestExpiry: 1,
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(filter),
    ])

    // Transform items and filter out expired ones
    const products = items
      .map(transformToProduct)
      .filter(p => p.inStock) // Remove expired items

    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: products.length,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products',
    })
  }
}

// GET /api/products/categories - Get all unique categories with counts
export async function categories(req: Request, res: Response) {
  try {
    const categoriesData = await InventoryItem.aggregate([
      {
        $match: {
          category: { $nin: [null, ''], $exists: true },
          onHand: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])
    
    const categories = categoriesData.map(cat => ({
      name: cat._id,
      count: cat.count,
    }))
    
    res.json({
      success: true,
      categories,
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch categories',
    })
  }
}

// GET /api/products/brands - Get all unique brands/manufacturers
export async function brands(req: Request, res: Response) {
  try {
    const manufacturers = await InventoryItem.distinct('manufacturer', {
      manufacturer: { $nin: [null, ''], $exists: true },
      onHand: { $gt: 0 },
    })
    
    const brands = await InventoryItem.distinct('brand', {
      brand: { $nin: [null, ''], $exists: true },
      onHand: { $gt: 0 },
    })
    
    // Combine and deduplicate
    const allBrands = [...new Set([...manufacturers, ...brands])].sort()
    
    res.json({
      success: true,
      brands: allBrands,
    })
  } catch (error: any) {
    console.error('Error fetching brands:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch brands',
    })
  }
}

// GET /api/products/:id - Get single product by ID
export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const item = await InventoryItem.findById(id).lean()
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      })
    }

    const product = transformToProduct(item)
    
    if (!product.inStock) {
      return res.status(404).json({
        success: false,
        error: 'Product is out of stock or expired',
      })
    }

    res.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product',
    })
  }
}
