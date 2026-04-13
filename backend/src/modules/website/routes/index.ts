import { Router } from 'express'
import cors from 'cors'
import * as Products from '../controllers/products.controller'
import * as Cart from '../controllers/cart.controller'

const r = Router()

// Enable CORS for website frontend
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}

r.use(cors(corsOptions))

// Products API (public - no auth required)
r.get('/products', Products.list)
r.get('/products/categories', Products.categories)
r.get('/products/brands', Products.brands)
r.get('/products/:id', Products.getById)

// Cart API (session-based)
r.get('/cart', Cart.getCart)
r.post('/cart/add', Cart.addToCart)
r.put('/cart/update', Cart.updateQuantity)
r.delete('/cart/remove/:productId', Cart.removeFromCart)
r.post('/cart/apply-coupon', Cart.applyCoupon)
r.delete('/cart/remove-coupon', Cart.removeCoupon)

export default r
