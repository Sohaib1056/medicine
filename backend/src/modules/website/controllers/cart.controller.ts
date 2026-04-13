import { Request, Response } from 'express'
import { Cart } from '../models/Cart'
import { InventoryItem } from '../../pharmacy/models/InventoryItem'

// Coupon codes
const COUPONS: Record<string, number> = {
  'FIRST30': 30,
  'SAVE10': 10,
  'DEVICE20': 20,
  'BOGO': 15,
}

// Helper to get cart identifier
function getCartIdentifier(req: Request) {
  const sessionId = req.headers['x-session-id'] as string
  const userId = (req as any).user?.id
  return { sessionId, userId }
}

// Helper to check if medicine is expired
function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const now = new Date()
  return expiry < now
}

// Helper to validate and sync cart with live inventory
async function validateCartItems(cart: any) {
  const warnings = {
    removedItems: [] as string[],
    priceChanges: [] as any[],
    stockChanges: [] as any[],
  }

  const validatedItems = []

  for (const item of cart.items) {
    // Fetch live data from pharmacy inventory
    const inventoryItem = await InventoryItem.findById(item.productId).lean()

    if (!inventoryItem) {
      warnings.removedItems.push(`${item.name} - Product no longer available`)
      continue
    }

    // Check if expired
    if (isExpired(inventoryItem.earliestExpiry)) {
      warnings.removedItems.push(`${item.name} - Product expired`)
      continue
    }

    // Check stock
    const availableStock = Number(inventoryItem.onHand || 0)
    if (availableStock <= 0) {
      warnings.removedItems.push(`${item.name} - Out of stock`)
      continue
    }

    // Calculate live price
    const livePrice = Number(inventoryItem.lastSalePerUnit || 0)
    const discount = Number(inventoryItem.defaultDiscountPct || 0)
    const originalPrice = discount > 0 ? livePrice / (1 - discount / 100) : livePrice

    // Check for price changes
    if (Math.abs(item.finalPrice - livePrice) > 0.01) {
      warnings.priceChanges.push({
        name: item.name,
        oldPrice: item.finalPrice,
        newPrice: livePrice,
      })
    }

    // Cap quantity to available stock
    let quantity = item.quantity
    if (quantity > availableStock) {
      quantity = availableStock
      warnings.stockChanges.push({
        name: item.name,
        requestedQty: item.quantity,
        availableQty: availableStock,
      })
    }

    // Update item with live data
    validatedItems.push({
      productId: item.productId,
      name: inventoryItem.name,
      brand: inventoryItem.brand || inventoryItem.manufacturer || '',
      manufacturer: inventoryItem.manufacturer || '',
      category: inventoryItem.category || 'Medicine',
      image: inventoryItem.image || '',
      form: inventoryItem.unitType || '',
      packSize: inventoryItem.unitsPerPack > 1 ? `${inventoryItem.unitsPerPack} units/pack` : '1 unit',
      requiresPrescription: inventoryItem.narcotic || false,
      originalPrice: Number(originalPrice.toFixed(2)),
      finalPrice: Number(livePrice.toFixed(2)),
      discountPercent: discount,
      quantity,
      stockAvailable: availableStock,
      unitsPerPack: inventoryItem.unitsPerPack || 1,
    })
  }

  return { validatedItems, warnings }
}

// Helper to calculate cart totals
function calculateTotals(items: any[], couponCode?: string) {
  const subtotal = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
  
  let couponDiscount = 0
  if (couponCode && COUPONS[couponCode.toUpperCase()]) {
    const discountPercent = COUPONS[couponCode.toUpperCase()]
    couponDiscount = (subtotal * discountPercent) / 100
  }

  const deliveryCharges = subtotal >= 2000 ? 0 : 150
  const total = subtotal - couponDiscount + deliveryCharges

  return {
    subtotal: Number(subtotal.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    deliveryCharges,
    total: Number(total.toFixed(2)),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

// GET /api/cart - Get cart with live validation
export async function getCart(req: Request, res: Response) {
  try {
    const { sessionId, userId } = getCartIdentifier(req)

    if (!sessionId && !userId) {
      return res.json({
        cart: {
          items: [],
          couponCode: undefined,
          couponDiscount: 0,
          subtotal: 0,
          deliveryCharges: 150,
          total: 150,
          itemCount: 0,
        },
        warnings: {
          removedItems: [],
          priceChanges: [],
          stockChanges: [],
        },
      })
    }

    // Find cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId

    let cart = await Cart.findOne(query)

    if (!cart) {
      return res.json({
        cart: {
          items: [],
          couponCode: undefined,
          couponDiscount: 0,
          subtotal: 0,
          deliveryCharges: 150,
          total: 150,
          itemCount: 0,
        },
        warnings: {
          removedItems: [],
          priceChanges: [],
          stockChanges: [],
        },
      })
    }

    // Validate and sync with live inventory
    const { validatedItems, warnings } = await validateCartItems(cart)

    // Update cart with validated items
    cart.items = validatedItems
    await cart.save()

    // Calculate totals
    const totals = calculateTotals(validatedItems, cart.couponCode)

    res.json({
      cart: {
        items: validatedItems,
        couponCode: cart.couponCode,
        ...totals,
      },
      warnings,
    })
  } catch (error: any) {
    console.error('Error getting cart:', error)
    res.status(500).json({
      error: error.message || 'Failed to get cart',
    })
  }
}

// POST /api/cart/add - Add item to cart
export async function addToCart(req: Request, res: Response) {
  try {
    const { productId, quantity = 1 } = req.body
    const { sessionId, userId } = getCartIdentifier(req)

    if (!sessionId && !userId) {
      return res.status(400).json({ error: 'Session ID or User ID required' })
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' })
    }

    // Fetch medicine from pharmacy inventory
    const inventoryItem = await InventoryItem.findById(productId).lean()

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Validate stock and expiry
    if (isExpired(inventoryItem.earliestExpiry)) {
      return res.status(400).json({ error: 'Product is expired' })
    }

    const availableStock = Number(inventoryItem.onHand || 0)
    if (availableStock <= 0) {
      return res.status(400).json({ error: 'Product is out of stock' })
    }

    if (quantity > availableStock) {
      return res.status(400).json({ 
        error: `Only ${availableStock} units available` 
      })
    }

    // Calculate price
    const price = Number(inventoryItem.lastSalePerUnit || 0)
    const discount = Number(inventoryItem.defaultDiscountPct || 0)
    const originalPrice = discount > 0 ? price / (1 - discount / 100) : price

    // Find or create cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId

    let cart = await Cart.findOne(query)

    if (!cart) {
      cart = new Cart({
        sessionId: userId ? undefined : sessionId,
        userId: userId || undefined,
        items: [],
      })
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.productId === productId
    )

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      if (newQuantity > availableStock) {
        return res.status(400).json({ 
          error: `Only ${availableStock} units available` 
        })
      }
      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item
      cart.items.push({
        productId,
        name: inventoryItem.name,
        brand: inventoryItem.brand || inventoryItem.manufacturer || '',
        manufacturer: inventoryItem.manufacturer || '',
        category: inventoryItem.category || 'Medicine',
        image: inventoryItem.image || '',
        form: inventoryItem.unitType || '',
        packSize: inventoryItem.unitsPerPack > 1 ? `${inventoryItem.unitsPerPack} units/pack` : '1 unit',
        requiresPrescription: inventoryItem.narcotic || false,
        originalPrice: Number(originalPrice.toFixed(2)),
        finalPrice: Number(price.toFixed(2)),
        discountPercent: discount,
        quantity,
        stockAvailable: availableStock,
        unitsPerPack: inventoryItem.unitsPerPack || 1,
      } as any)
    }

    await cart.save()

    const itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

    res.json({
      success: true,
      message: 'Item added to cart',
      itemCount,
      cart: {
        items: cart.items,
        ...calculateTotals(cart.items, cart.couponCode),
      },
    })
  } catch (error: any) {
    console.error('Error adding to cart:', error)
    res.status(500).json({
      error: error.message || 'Failed to add item to cart',
    })
  }
}

// PUT /api/cart/update - Update item quantity
export async function updateQuantity(req: Request, res: Response) {
  try {
    const { productId, quantity } = req.body
    const { sessionId, userId } = getCartIdentifier(req)

    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID and quantity required' })
    }

    // Find cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId
    else return res.status(400).json({ error: 'Session ID or User ID required' })

    const cart = await Cart.findOne(query)

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex((item: any) => item.productId === productId)

    if (itemIndex < 0) {
      return res.status(404).json({ error: 'Item not found in cart' })
    }

    // Validate against live stock
    const inventoryItem = await InventoryItem.findById(productId).lean()

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const availableStock = Number(inventoryItem.onHand || 0)

    if (quantity > availableStock) {
      return res.status(400).json({ 
        error: `Only ${availableStock} units available` 
      })
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity
    await cart.save()

    res.json({
      success: true,
      message: 'Quantity updated',
      cart: {
        items: cart.items,
        ...calculateTotals(cart.items, cart.couponCode),
      },
    })
  } catch (error: any) {
    console.error('Error updating quantity:', error)
    res.status(500).json({
      error: error.message || 'Failed to update quantity',
    })
  }
}

// DELETE /api/cart/remove/:productId - Remove item from cart
export async function removeFromCart(req: Request, res: Response) {
  try {
    const { productId } = req.params
    const { sessionId, userId } = getCartIdentifier(req)

    // Find cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId
    else return res.status(400).json({ error: 'Session ID or User ID required' })

    const cart = await Cart.findOne(query)

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    // Remove item
    cart.items = cart.items.filter((item: any) => item.productId !== productId)
    await cart.save()

    const itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

    res.json({
      success: true,
      message: 'Item removed from cart',
      itemCount,
      cart: {
        items: cart.items,
        ...calculateTotals(cart.items, cart.couponCode),
      },
    })
  } catch (error: any) {
    console.error('Error removing from cart:', error)
    res.status(500).json({
      error: error.message || 'Failed to remove item from cart',
    })
  }
}

// POST /api/cart/apply-coupon - Apply coupon code
export async function applyCoupon(req: Request, res: Response) {
  try {
    const { couponCode } = req.body
    const { sessionId, userId } = getCartIdentifier(req)

    if (!couponCode) {
      return res.status(400).json({ error: 'Coupon code required' })
    }

    const upperCode = couponCode.toUpperCase()

    if (!COUPONS[upperCode]) {
      return res.status(400).json({ error: 'Invalid coupon code' })
    }

    // Find cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId
    else return res.status(400).json({ error: 'Session ID or User ID required' })

    const cart = await Cart.findOne(query)

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    // Apply coupon
    cart.couponCode = upperCode
    await cart.save()

    const totals = calculateTotals(cart.items, upperCode)

    res.json({
      success: true,
      message: `Coupon ${upperCode} applied successfully`,
      discount: COUPONS[upperCode],
      savings: totals.couponDiscount,
      cart: {
        items: cart.items,
        couponCode: upperCode,
        ...totals,
      },
    })
  } catch (error: any) {
    console.error('Error applying coupon:', error)
    res.status(500).json({
      error: error.message || 'Failed to apply coupon',
    })
  }
}

// DELETE /api/cart/remove-coupon - Remove coupon
export async function removeCoupon(req: Request, res: Response) {
  try {
    const { sessionId, userId } = getCartIdentifier(req)

    // Find cart
    const query: any = {}
    if (userId) query.userId = userId
    else if (sessionId) query.sessionId = sessionId
    else return res.status(400).json({ error: 'Session ID or User ID required' })

    const cart = await Cart.findOne(query)

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    // Remove coupon
    cart.couponCode = undefined
    await cart.save()

    res.json({
      success: true,
      message: 'Coupon removed',
      cart: {
        items: cart.items,
        ...calculateTotals(cart.items),
      },
    })
  } catch (error: any) {
    console.error('Error removing coupon:', error)
    res.status(500).json({
      error: error.message || 'Failed to remove coupon',
    })
  }
}
