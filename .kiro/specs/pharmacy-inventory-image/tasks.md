# Implementation Plan: Pharmacy Inventory Image

## Overview

Additive implementation across three surfaces: backend multer upload endpoint + static serving + CORS, desktop edit dialog image UI, and external website. The `publicProducts` controller and `update` controller are already fully implemented — work focuses on wiring multer, completing the route, updating the dialog, and building the website.

## Tasks

- [x] 1. Install multer and add static file serving to backend
  - Run `npm install multer` and `npm install --save-dev @types/multer` in `backend/`
  - In `backend/src/app.ts`, add `app.use('/uploads/pharmacy', express.static(path.join(__dirname, '..', '..', 'uploads', 'pharmacy')))` before `app.use('/api', apiRouter)`
  - _Requirements: 2.5_

- [x] 2. Create upload controller and wire upload route
  - [x] 2.1 Create `backend/src/modules/pharmacy/controllers/upload.controller.ts`
    - Configure multer with `dest: 'uploads/pharmacy/'`, `limits.fileSize: 5 * 1024 * 1024`, and a `fileFilter` accepting only `image/jpeg`, `image/png`, `image/webp`, `image/gif`
    - Export `uploadImage` handler: call `multer.single('image')`, catch `LIMIT_FILE_SIZE` → 400, catch invalid MIME → 400, no file → 400, success → `{ url: '/uploads/pharmacy/<filename>' }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 2.2 Write property test for upload MIME type filter (Property 3)
    - **Property 3: Upload endpoint accepts only valid MIME types**
    - **Validates: Requirements 2.2, 2.4**
    - Use fast-check to generate arbitrary MIME type strings; assert the filter function returns `true` iff MIME is in the allowed set
  - [x] 2.3 Register upload route and add CORS to public products route in `backend/src/modules/pharmacy/routes/index.ts`
    - Add `import cors from 'cors'` and `import * as Upload from '../controllers/upload.controller'`
    - Add `r.post('/inventory/upload-image', Upload.uploadImage)` before the existing inventory routes
    - Add route-level CORS to the public products route: `r.get('/public/products', cors({ origin: 'http://localhost:8080', credentials: false }), InventoryItems.publicProducts)`
    - _Requirements: 2.1, 3.6_

- [x] 3. Checkpoint — Ensure backend compiles and upload route responds correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Write backend property-based tests for publicProducts controller
  - [ ]* 4.1 Write property test for in-stock filter (Property 4)
    - **Property 4: Public API returns only in-stock items**
    - **Validates: Requirements 3.2**
    - Use fast-check to generate arrays of inventory items with random `onHand` values; mock `InventoryItem.find` and assert all returned items have `onHand > 0`
  - [ ]* 4.2 Write property test for response shape (Property 5)
    - **Property 5: Public API response shape**
    - **Validates: Requirements 3.3**
    - Use fast-check to generate in-stock items; assert every item in the response contains all required fields: `name`, `category`, `genericName`, `manufacturer`, `brand`, `description`, `image`, `onHand`, `lastSalePerUnit`, `unitsPerPack`
  - [ ]* 4.3 Write property test for search filter correctness (Property 6)
    - **Property 6: Public API search filter correctness**
    - **Validates: Requirements 3.4**
    - Use fast-check to generate arbitrary search strings and inventory arrays; assert every returned item matches the search string (case-insensitively) in at least one of `name`, `category`, `genericName`, `manufacturer`, or `brand`
  - [ ]* 4.4 Write property test for limit enforcement (Property 7)
    - **Property 7: Public API limit enforcement**
    - **Validates: Requirements 3.5**
    - Use fast-check to generate integers in [1, 500]; assert `response.items.length <= limit`

- [ ] 5. Write backend property-based tests for inventory update controller
  - [ ]* 5.1 Write property test for image field persistence round-trip (Property 1)
    - **Property 1: Image field persistence round-trip**
    - **Validates: Requirements 1.2**
    - Use fast-check to generate valid image strings (HTTPS URLs and Base64 data URIs); PUT then GET the item and assert the returned `image` equals the input
  - [ ]* 5.2 Write property test for image field preservation on unrelated updates (Property 2)
    - **Property 2: Image field preservation on unrelated updates**
    - **Validates: Requirements 1.4**
    - Use fast-check to generate arbitrary image strings; set image on item, PUT without `image` field, assert image is unchanged in the response

- [x] 6. Update `pharmacy_EditInventoryItem` dialog with image upload UI
  - [x] 6.1 Add `uploadInventoryImage(file: File): Promise<{ url: string }>` to `pharmacyApi`
    - POST to `/api/pharmacy/inventory/upload-image` with `FormData` containing the file under the `image` field
    - _Requirements: 5.3_
  - [x] 6.2 Replace the plain Image URL `<input type="text">` in `pharmacy_EditInventoryItem.tsx` with the image management section
    - Add `uploadError` and `uploadLoading` state
    - Render image thumbnail when `image` is non-empty
    - Add `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">` that calls `pharmacyApi.uploadInventoryImage`, sets `image` to the returned URL on success, or sets `uploadError` on failure
    - Add a "Remove" button that sets `image` to `''`
    - Show `uploadError` inline below the file input; disable the file input while `uploadLoading` is true
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 6.3 Write property test for product card image display (Property 9)
    - **Property 9: Product card image display**
    - **Validates: Requirements 4.2, 4.3**
    - Use fast-check to generate product objects with arbitrary `image` values (non-empty string or absent/empty); render the card and assert `<img src>` equals the image value when present, or a placeholder element exists when absent

- [x] 7. Checkpoint — Ensure dialog compiles and image upload/remove works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create external website
  - [x] 8.1 Create `website/package.json` with `express` dependency and a `start` script (`node server.js`)
    - _Requirements: 4.1_
  - [x] 8.2 Create `website/server.js` — minimal Express server on port 8080
    - Serve static files from `website/public/`
    - Route `GET /products` → send `public/products.html`
    - _Requirements: 4.1_
  - [x] 8.3 Create `website/public/products.html` — single-file page with embedded CSS and vanilla JS
    - On load, fetch `http://localhost:4000/api/pharmacy/public/products`
    - Render a responsive grid of medicine cards showing `name`, `category`, `description`, `lastSalePerUnit`
    - Show `<img src="{image}">` when `image` is non-empty; show a placeholder SVG when absent
    - Show "No products currently available." when `items` is empty
    - Show "Failed to load products. Please try again." banner on fetch error
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 8.4 Write property test for product card renders required fields (Property 8)
    - **Property 8: Product card renders required fields**
    - **Validates: Requirements 4.4**
    - Use fast-check to generate product objects with non-empty `name`, `category`, `description`, and `lastSalePerUnit`; render the card HTML and assert each value appears as visible text

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- The `publicProducts` controller and `update` controller are already fully implemented — no changes needed to their logic
- The `InventoryItem` model already has `image` and `description` fields — no schema changes needed
