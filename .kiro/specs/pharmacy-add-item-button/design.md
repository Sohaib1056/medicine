# Design Document: Pharmacy Add Item Button

## Overview

This feature introduces a direct item creation capability to the pharmacy inventory system. Currently, inventory items can only be added through the invoice approval workflow (Add Invoice → Pending Review → Approve). This design adds an "Add Item" button that opens a dialog for immediate inventory item creation, bypassing the invoice workflow when invoice details are not needed.

The feature consists of three main components:
1. Frontend UI: Add Item button and dialog form
2. Backend API: New endpoint for direct item creation
3. Integration: Image upload support and state management

This design leverages existing infrastructure (InventoryItem model, image upload endpoint) while adding new UI components and a simplified creation endpoint.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Inventory Page (React)                    │
│  ┌────────────────┐  ┌──────────────────────────────────┐  │
│  │  Add Item Btn  │  │    Inventory Table               │  │
│  └────────┬───────┘  └──────────────────────────────────┘  │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Add Item Dialog (Modal)                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Form Fields (name, category, pricing, etc.)  │  │  │
│  │  │  Image Upload Component                        │  │  │
│  │  │  Validation Logic                              │  │  │
│  │  │  Submit Button                                 │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ POST /pharmacy/inventory
                           │ POST /pharmacy/inventory/upload-image
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /pharmacy/inventory                            │  │
│  │  - Validate input                                    │  │
│  │  - Normalize medicine name → key                    │  │
│  │  - Check uniqueness                                  │  │
│  │  - Set defaults                                      │  │
│  │  - Create InventoryItem document                    │  │
│  │  - Create audit log                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /pharmacy/inventory/upload-image (existing)    │  │
│  │  - Handle multipart file upload                      │  │
│  │  - Store in backend/uploads/pharmacy/               │  │
│  │  - Return image URL                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pharmacy_inventoryitems collection                  │  │
│  │  - Unique key index (lowercase name)                 │  │
│  │  - Timestamps (createdAt, updatedAt)                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pharmacy_auditlogs collection                       │  │
│  │  - Track item creation events                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: User clicks "Add Item" button (or presses "M" keyboard shortcut)
2. **Dialog Display**: Modal dialog opens with empty form
3. **Form Input**: User fills in item details (name required, others optional)
4. **Image Upload** (optional): User selects image → uploads to `/pharmacy/inventory/upload-image` → receives URL → stores in form state
5. **Form Submission**: User clicks "Create Item" → validates form → sends POST to `/pharmacy/inventory`
6. **Backend Processing**: 
   - Validates required fields
   - Normalizes medicine name to lowercase key
   - Checks for duplicate key (case-insensitive)
   - Sets default values for optional fields
   - Creates InventoryItem document
   - Creates audit log entry
7. **Response Handling**: 
   - Success: Close dialog, show success toast, refresh inventory table
   - Error: Display error message in dialog, keep dialog open

## Components and Interfaces

### Frontend Components

#### 1. Add Item Button

Location: `src/pages/pharmacy/pharmacy_Inventory.tsx`

```typescript
// Add to existing button group in Inventory page
<button
  onClick={() => setAddItemOpen(true)}
  title="Add Item (M)"
  className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 flex items-center gap-2"
>
  <Package className="h-4 w-4" />
  Add Item
</button>
```

State management:
```typescript
const [addItemOpen, setAddItemOpen] = useState(false)
```

Keyboard shortcut handler (add to existing handleKeyDown):
```typescript
// M: Add Item
else if (e.key.toLowerCase() === 'm' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
  e.preventDefault();
  setAddItemOpen(true);
}
```

#### 2. Add Item Dialog Component

New component: `src/components/pharmacy/pharmacy_AddItemDialog.tsx`

```typescript
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
}
```

Component structure:
- Modal overlay with backdrop
- Dialog container with header, body, footer
- Form with controlled inputs
- Image upload section with preview
- Validation error display
- Submit button with loading state

#### 3. Image Upload Section

Integrated within AddItemDialog:

```typescript
const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string>('')
const [uploading, setUploading] = useState(false)

const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    setErrors(prev => ({ ...prev, image: 'Invalid file type' }))
    return
  }
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => setImagePreview(e.target?.result as string)
  reader.readAsDataURL(file)
  
  // Upload immediately
  setUploading(true)
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await pharmacyApi.uploadInventoryImage(formData)
    setFormData(prev => ({ ...prev, image: response.url }))
  } catch (err) {
    setErrors(prev => ({ ...prev, image: 'Upload failed' }))
  } finally {
    setUploading(false)
  }
}
```

### Backend API

#### New Endpoint: Create Inventory Item

Route: `POST /pharmacy/inventory`

Location: Add to `backend/src/modules/pharmacy/routes/index.ts`:
```typescript
r.post('/inventory', InventoryItems.create)
```

Controller: Add to `backend/src/modules/pharmacy/controllers/inventory_items.controller.ts`:

```typescript
export async function create(req: Request, res: Response) {
  const {
    name,
    genericName,
    manufacturer,
    category,
    brand,
    unitType,
    shelfNumber,
    barcode,
    narcotic,
    unitsPerPack,
    minStock,
    onHand,
    salePerUnit,
    image,
    description,
  } = req.body || {}

  // Validate required fields
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Medicine name is required' })
  }

  // Normalize name to key
  const key = String(name).trim().toLowerCase()

  // Check for duplicate
  const existing = await InventoryItem.findOne({ key })
  if (existing) {
    return res.status(400).json({ 
      error: 'An item with this name already exists (case-insensitive)' 
    })
  }

  // Validate numeric fields
  const unitsPerPackNum = Number(unitsPerPack) || 1
  if (unitsPerPackNum < 1) {
    return res.status(400).json({ error: 'Units per pack must be at least 1' })
  }

  const onHandNum = Number(onHand) || 0
  if (onHandNum < 0) {
    return res.status(400).json({ error: 'Initial stock cannot be negative' })
  }

  // Create item
  const item = new InventoryItem({
    key,
    name: String(name).trim(),
    genericName: genericName ? String(genericName).trim() : undefined,
    manufacturer: manufacturer ? String(manufacturer).trim() : undefined,
    category: category ? String(category).trim() : undefined,
    brand: brand ? String(brand).trim() : undefined,
    unitType: unitType ? String(unitType).trim() : undefined,
    shelfNumber: shelfNumber ? String(shelfNumber).trim() : undefined,
    barcode: barcode ? String(barcode).trim() : undefined,
    narcotic: Boolean(narcotic),
    unitsPerPack: unitsPerPackNum,
    onHand: onHandNum,
    minStock: minStock ? Number(minStock) : undefined,
    lastSalePerUnit: salePerUnit ? Number(salePerUnit) : 0,
    avgCostPerUnit: 0,
    image: image ? String(image).trim() : undefined,
    description: description ? String(description).trim() : undefined,
  })

  try {
    await item.save()
  } catch (err: any) {
    return res.status(400).json({ 
      error: err?.message || 'Failed to create item' 
    })
  }

  // Create audit log
  try {
    const actor = (req as any).user?.name || (req as any).user?.email || 'system'
    await AuditLog.create({
      actor,
      action: 'Create Inventory Item',
      label: 'CREATE_INVENTORY',
      method: 'POST',
      path: req.originalUrl,
      at: new Date().toISOString(),
      detail: `${item.name} — key:${item.key}`,
    })
  } catch {}

  res.status(201).json({ 
    ok: true, 
    item: {
      _id: item._id,
      key: item.key,
      name: item.name,
      onHand: item.onHand,
    }
  })
}
```

### API Client Method

Add to `src/utils/api.ts` (pharmacyApi object):

```typescript
async createInventoryItem(data: {
  name: string
  genericName?: string
  category?: string
  manufacturer?: string
  brand?: string
  unitType?: string
  shelfNumber?: string
  unitsPerPack?: number
  onHand?: number
  minStock?: number
  salePerUnit?: number
  narcotic?: boolean
  barcode?: string
  description?: string
  image?: string
}) {
  const response = await fetch(`${this.baseUrl}/pharmacy/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create item')
  }
  return response.json()
}
```

## Data Models

### InventoryItem Document (Existing Model)

The existing `InventoryItem` model already supports all required fields. No schema changes needed.

Key fields for direct creation:
- `key`: Normalized lowercase name (unique index)
- `name`: Display name (required)
- `genericName`: Generic medicine name (optional)
- `manufacturer`: Manufacturer name (optional)
- `category`: Category/group (optional)
- `brand`: Brand name (optional)
- `unitType`: Unit type (e.g., "tablet", "ml") (optional)
- `shelfNumber`: Physical shelf location (optional)
- `unitsPerPack`: Units per pack (default: 1)
- `onHand`: Current stock quantity (default: 0)
- `minStock`: Minimum stock threshold (optional)
- `lastSalePerUnit`: Sale price per unit (default: 0)
- `narcotic`: Narcotic classification (default: false)
- `barcode`: Barcode for scanning (optional)
- `image`: Image URL (optional)
- `description`: Detailed description (optional)
- `avgCostPerUnit`: Average cost (set to 0 for direct creation)
- `createdAt`, `updatedAt`: Timestamps (automatic)

### Form Data Structure

```typescript
interface CreateItemPayload {
  name: string                    // Required
  genericName?: string            // Optional
  category?: string               // Optional
  manufacturer?: string           // Optional
  brand?: string                  // Optional
  unitType?: string               // Optional
  shelfNumber?: string            // Optional
  unitsPerPack?: number           // Optional, default 1
  onHand?: number                 // Optional, default 0
  minStock?: number               // Optional
  salePerUnit?: number            // Optional, default 0
  narcotic?: boolean              // Optional, default false
  barcode?: string                // Optional
  description?: string            // Optional
  image?: string                  // Optional (URL from upload)
}
```

## Correctness Properties

This feature is primarily focused on UI interactions, form validation, and CRUD operations with external dependencies (database, file system). The testable requirements fall into these categories:

- **UI rendering and interactions**: Specific examples (button exists, dialog opens, etc.)
- **Form validation**: Specific edge cases (empty name, negative numbers, etc.)
- **API integration**: Integration tests with database and file system
- **Infrastructure**: Existing endpoints and models

However, there are a few universal properties in the backend logic that are suitable for property-based testing:

### Property 1: Medicine name normalization

*For any* valid medicine name string, the backend SHALL normalize it to lowercase for the key field, and the key SHALL always equal the name converted to lowercase.

**Validates: Requirements 6.1**

### Property 2: Duplicate detection is case-insensitive

*For any* medicine name, if an item with that name already exists (regardless of case), attempting to create another item with the same name (in any case variation) SHALL be rejected with a 400 error.

**Validates: Requirements 6.3, 6.4**

### Property 3: Default values for optional fields

*For any* create request with a subset of optional fields provided, the backend SHALL set default values for all missing optional numeric fields (unitsPerPack=1, onHand=0, lastSalePerUnit=0, avgCostPerUnit=0, narcotic=false).

**Validates: Requirements 6.2**

## Error Handling

### Frontend Error Handling

#### Validation Errors

Display inline validation errors for:
- Empty medicine name: "Medicine name is required"
- Units per pack < 1: "Units per pack must be at least 1"
- Negative stock: "Stock quantity cannot be negative"
- Invalid numeric input: "Please enter a valid number"

Error display strategy:
- Show errors below each field
- Highlight invalid fields with red border
- Prevent form submission until errors are resolved
- Clear errors when user corrects input

#### API Errors

Handle API error responses:
- 400 Bad Request: Display specific error message from server
- 409 Conflict (duplicate name): "An item with this name already exists"
- 500 Server Error: "Failed to create item. Please try again."
- Network errors: "Network error. Please check your connection."

Error display:
- Show error message at top of dialog
- Keep dialog open to allow user to correct and retry
- Provide "Retry" option for network errors

#### Image Upload Errors

Handle image upload failures:
- Invalid file type: "Please select a valid image file (JPEG, PNG, GIF, WebP)"
- Upload failure: "Image upload failed. Please try again."
- File too large: "Image file is too large. Maximum size is 5MB."

Error display:
- Show error below image upload field
- Allow user to select different file
- Item creation can proceed without image

### Backend Error Handling

#### Validation Errors (400 Bad Request)

Return structured error responses:
```typescript
{ error: 'Medicine name is required' }
{ error: 'Units per pack must be at least 1' }
{ error: 'Initial stock cannot be negative' }
{ error: 'An item with this name already exists (case-insensitive)' }
```

#### Database Errors

Handle Mongoose validation and duplicate key errors:
- Duplicate key error (E11000): Return 400 with user-friendly message
- Validation errors: Return 400 with specific field errors
- Connection errors: Return 500 with generic error message

#### Audit Log Failures

Audit log creation failures should not block item creation:
- Wrap audit log creation in try-catch
- Log error to console for debugging
- Return success response even if audit log fails

## Testing Strategy

### Unit Tests

Frontend unit tests (React Testing Library + Vitest):

1. **Button rendering**: Verify Add Item button is rendered with correct text, icon, and title
2. **Dialog open/close**: Test dialog opens on button click, closes on X button, closes on Escape key
3. **Form field rendering**: Verify all form fields are rendered with correct labels and default values
4. **Form validation**: 
   - Test empty name shows error
   - Test negative stock shows error
   - Test units per pack < 1 shows error
   - Test valid form passes validation
5. **Image upload UI**: Test file selection shows preview, test invalid file type shows error
6. **Keyboard shortcuts**: Test "M" key opens dialog, test Enter submits form, test Escape closes dialog
7. **Loading states**: Test submit button is disabled during API call
8. **Success feedback**: Test success toast is shown after successful creation

Backend unit tests (Jest):

1. **Validation**: Test required field validation, test numeric field validation
2. **Name normalization**: Test various name formats are normalized to lowercase key
3. **Default values**: Test optional fields get correct defaults when not provided
4. **Duplicate detection**: Test duplicate names are rejected (case-insensitive)
5. **Error responses**: Test appropriate error codes and messages for various failure scenarios

### Property-Based Tests

Backend property tests (using fast-check or similar):

1. **Property 1 - Name normalization**: 
   - Generate random medicine names with mixed cases
   - Verify key is always lowercase version of name
   - Run 100+ iterations

2. **Property 2 - Duplicate detection**:
   - Generate random medicine name
   - Create item with that name
   - Generate case variations of the same name
   - Verify all variations are rejected
   - Run 100+ iterations

3. **Property 3 - Default values**:
   - Generate random subsets of optional fields
   - Create items with those fields
   - Verify missing fields have correct defaults
   - Run 100+ iterations

Each property test must include a comment tag:
```typescript
// Feature: pharmacy-add-item-button, Property 1: For any valid medicine name string, the backend SHALL normalize it to lowercase for the key field
```

### Integration Tests

1. **End-to-end item creation**: 
   - Fill form with valid data
   - Submit form
   - Verify API call is made with correct payload
   - Verify item appears in inventory table after refresh

2. **Image upload integration**:
   - Select image file
   - Verify upload to /pharmacy/inventory/upload-image
   - Verify URL is included in create request
   - Verify image is displayed in inventory table

3. **Error handling flow**:
   - Submit form with duplicate name
   - Verify error message is displayed
   - Correct the error
   - Verify successful submission

4. **Database integration**:
   - Create item via API
   - Verify item is stored in MongoDB
   - Verify unique key constraint works
   - Verify timestamps are set

### Manual Testing

1. **Visual consistency**: Verify button and dialog styling matches existing UI
2. **Responsive design**: Test dialog on different screen sizes
3. **Accessibility**: Test keyboard navigation, screen reader compatibility
4. **Image preview**: Verify image preview displays correctly for various image sizes
5. **Success notification**: Verify toast message appears and auto-dismisses

## Implementation Notes

### State Management

Use React useState for local component state:
- Dialog open/close state in parent Inventory page
- Form data state in AddItemDialog component
- Image upload state in AddItemDialog component
- Loading state for API calls
- Error state for validation and API errors

No global state management needed for this feature.

### Form Validation

Implement validation in AddItemDialog component:
- Validate on blur for individual fields
- Validate on submit for entire form
- Use controlled inputs to track form state
- Display errors inline below each field

Validation rules:
- Medicine name: Required, non-empty after trim
- Units per pack: Must be >= 1
- Initial stock: Must be >= 0
- Numeric fields: Must be valid numbers or empty

### Image Upload Flow

1. User selects image file
2. Validate file type client-side
3. Create preview using FileReader
4. Upload immediately to `/pharmacy/inventory/upload-image`
5. Store returned URL in form state
6. Include URL in create item request
7. If upload fails, allow user to retry or proceed without image

### Keyboard Shortcuts

Add to existing keyboard shortcut handler in Inventory page:
- "M" key: Open Add Item dialog (when not typing in input)
- "Escape" key: Close dialog (when dialog is open)
- "Enter" key: Submit form (when dialog is open and form is valid)

Ensure shortcuts don't interfere with existing shortcuts (U, A, I, R, E, P, etc.)

### Success Feedback

After successful item creation:
1. Close dialog
2. Show success toast: "Item '{name}' created successfully"
3. Trigger inventory refresh (increment refreshTick)
4. Toast auto-dismisses after 3 seconds

Use existing toast/notification system if available, or implement simple toast component.

### Audit Logging

Create audit log entry for each item creation:
- Actor: Current user name/email or 'system'
- Action: 'Create Inventory Item'
- Label: 'CREATE_INVENTORY'
- Method: 'POST'
- Path: Request URL
- Timestamp: Current ISO timestamp
- Detail: Item name and key

Audit log failures should not block item creation.
