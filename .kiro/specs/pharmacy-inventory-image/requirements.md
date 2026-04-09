# Requirements Document

## Introduction

This feature adds image upload and storage capability to pharmacy inventory items, allowing staff to associate a product image with each medicine. These images are stored alongside the medicine description and exposed through a public REST API endpoint. An external website at `http://localhost:8080/products` consumes this API to display medicine listings with their images to end users.

The backend is a Node.js/TypeScript Express application. The pharmacy module lives at `backend/src/modules/pharmacy/`. The `InventoryItem` model already has `image` (String) and `description` (String) fields. A `publicProducts` controller function and route (`GET /api/pharmacy/public/products`) already exist as stubs.

---

## Glossary

- **Inventory_Item**: A pharmacy product record stored in the `pharmacy_inventoryitems` MongoDB collection, identified by a unique `key` (normalized lowercase name).
- **Image_Field**: The `image` property on an `Inventory_Item`, storing either a URL to a remotely hosted image or a Base64-encoded data URI for a locally uploaded file.
- **Public_Products_API**: The unauthenticated HTTP endpoint at `GET /api/pharmacy/public/products` that returns a list of in-stock inventory items with their public-facing fields.
- **External_Website**: The web page served at `http://localhost:8080/products` that fetches from the Public_Products_API and renders medicine cards with images.
- **Upload_Endpoint**: The HTTP endpoint that accepts a multipart image file and returns a stored image URL or data URI.
- **Pharmacy_Staff**: An authenticated user of the Electron/React desktop application who manages inventory.
- **Visitor**: An unauthenticated end user browsing the external website.

---

## Requirements

### Requirement 1: Image Storage on Inventory Items

**User Story:** As a Pharmacy_Staff member, I want to attach an image to an inventory item, so that product visuals are stored alongside medicine descriptions.

#### Acceptance Criteria

1. THE `Inventory_Item` model SHALL include an `image` field that stores a string value representing either an HTTPS URL or a Base64-encoded data URI with a supported MIME type (`image/jpeg`, `image/png`, `image/webp`, or `image/gif`).
2. WHEN a `PUT /api/pharmacy/inventory/:key` request is received with an `image` field in the request body, THE `Inventory_Item` SHALL persist the provided image value.
3. WHEN a `PUT /api/pharmacy/inventory/:key` request is received with an `image` field set to an empty string or `null`, THE `Inventory_Item` SHALL clear the stored image value.
4. WHEN a `PUT /api/pharmacy/inventory/:key` request is received without an `image` field, THE `Inventory_Item` SHALL retain its existing image value unchanged.

---

### Requirement 2: Image Upload Endpoint

**User Story:** As a Pharmacy_Staff member, I want to upload an image file from my computer, so that I can associate a locally stored image with an inventory item without hosting it externally.

#### Acceptance Criteria

1. THE `Upload_Endpoint` SHALL accept `POST /api/pharmacy/inventory/upload-image` requests with a `multipart/form-data` body containing a single file field named `image`.
2. WHEN a valid image file is uploaded, THE `Upload_Endpoint` SHALL return a JSON response containing a `url` field with the publicly accessible path to the stored image (e.g., `/uploads/pharmacy/<filename>`).
3. WHEN the uploaded file exceeds 5 MB, THE `Upload_Endpoint` SHALL return HTTP 400 with a JSON error message indicating the file size limit.
4. WHEN the uploaded file has a MIME type other than `image/jpeg`, `image/png`, `image/webp`, or `image/gif`, THE `Upload_Endpoint` SHALL return HTTP 400 with a JSON error message indicating the unsupported file type.
5. THE backend server SHALL serve uploaded image files as static assets from the `/uploads/pharmacy/` URL path.

---

### Requirement 3: Public Products API

**User Story:** As a Visitor, I want to browse available medicines with their images via an API, so that the external website can display up-to-date product listings.

#### Acceptance Criteria

1. THE `Public_Products_API` SHALL respond to `GET /api/pharmacy/public/products` requests without requiring authentication.
2. WHEN the `Public_Products_API` receives a request, THE `Public_Products_API` SHALL return a JSON object with an `items` array containing only `Inventory_Item` records where `onHand > 0`.
3. WHEN the `Public_Products_API` returns items, each item SHALL include the fields: `name`, `category`, `genericName`, `manufacturer`, `brand`, `description`, `image`, `onHand`, `lastSalePerUnit`, and `unitsPerPack`.
4. WHEN a `search` query parameter is provided, THE `Public_Products_API` SHALL filter items whose `name`, `category`, `genericName`, `manufacturer`, or `brand` fields match the search string (case-insensitive).
5. WHEN a `limit` query parameter is provided with a value between 1 and 500, THE `Public_Products_API` SHALL return at most that many items. WHEN no `limit` is provided, THE `Public_Products_API` SHALL default to returning at most 100 items.
6. THE `Public_Products_API` SHALL include CORS headers permitting cross-origin requests from `http://localhost:8080`.

---

### Requirement 4: External Website Product Display

**User Story:** As a Visitor, I want to see medicine cards with images on the external website, so that I can visually identify products.

#### Acceptance Criteria

1. THE `External_Website` SHALL fetch product data from `http://localhost:<backend_port>/api/pharmacy/public/products` on page load.
2. WHEN the `External_Website` renders a product card, THE `External_Website` SHALL display the product `image` if the `image` field is a non-empty string.
3. WHEN a product has no `image` value, THE `External_Website` SHALL display a placeholder image or icon in place of the product image.
4. THE `External_Website` SHALL display the product `name`, `category`, `description`, and `lastSalePerUnit` on each product card.
5. WHEN the `Public_Products_API` returns an empty `items` array, THE `External_Website` SHALL display a message indicating no products are currently available.
6. WHEN the `Public_Products_API` request fails, THE `External_Website` SHALL display an error message to the Visitor.

---

### Requirement 5: Image Management in the Desktop Application

**User Story:** As a Pharmacy_Staff member, I want to add or change a product image from within the inventory management UI, so that I can keep product visuals up to date without leaving the application.

#### Acceptance Criteria

1. WHEN a Pharmacy_Staff member opens the edit dialog for an `Inventory_Item`, THE edit form SHALL display the current image if one exists.
2. THE edit form SHALL provide a file input control that allows Pharmacy_Staff to select a local image file for upload.
3. WHEN a Pharmacy_Staff member selects a file and confirms the upload, THE edit form SHALL call the `Upload_Endpoint` and populate the image field with the returned URL.
4. THE edit form SHALL provide a control to remove the current image, which clears the image field before saving.
5. WHEN the image upload request fails, THE edit form SHALL display an error message to the Pharmacy_Staff member without closing the dialog.
