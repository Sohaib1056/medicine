# Implementation Plan: Pharmacy Add Item Button

## Overview

This implementation adds a direct item creation feature to the pharmacy inventory page. Users can click an "Add Item" button to open a dialog form for creating inventory items immediately, bypassing the invoice approval workflow. The implementation includes frontend UI components (button, dialog, form), backend API endpoint, form validation, image upload support, and keyboard shortcuts.

## Tasks

- [ ] 1. Create Add Item Dialog component with form fields
  - Create new file `src/components/pharmacy/pharmacy_AddItemDialog.tsx`
  - Implement modal dialog with backdrop and close functionality
  - Add form fields: name (required), genericName, category, manufacturer, brand, unitType, shelfNumber, unitsPerPack (default 1), onHand (default 0), minStock, salePerUnit, narcotic (checkbox, default false), barcode, description (textarea)
  - Implement controlled form inputs with useState for form data
  - Add close button (X) in header and Escape key handler
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1-3.14_

- [ ]* 1.1 Write unit tests for Add Item Dialog component
  - Test dialog opens and closes correctly
  - Test all form fields render with correct labels and defaults
  - Test Escape key closes dialog
  - _Requirements: 2.1-2.6, 3.1-3.14_

- [ ] 2. Implement form validation logic
  - Add useState for form errors
  - Validate medicine name is required and non-empty
  - Validate unitsPerPack >= 1
  - Validate onHand >= 0
  - Validate numeric fields contain valid numbers
  - Display inline error messages below fields
  - Highlight invalid fields with red border
  - Prevent form submission when validation fails
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 2.1 Write unit tests for form validation
  - Test empty name shows error
  - Test negative stock shows error
  - Test units per pack < 1 shows error
  - Test valid form passes validation
  - _Requirements: 4.1-4.5_

- [ ] 3. Implement image upload functionality in dialog
  - Add file input field for image selection
  - Add useState for imageFile, imagePreview, and uploading state
  - Validate file type (JPEG, PNG, GIF, WebP) client-side
  - Create image preview using FileReader
  - Upload image to existing `/pharmacy/inventory/upload-image` endpoint
  - Store returned image URL in form data
  - Display upload errors below image field
  - Show loading indicator during upload
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 3.1 Write unit tests for image upload UI
  - Test file selection shows preview
  - Test invalid file type shows error
  - Test upload loading state
  - _Requirements: 8.1-8.3_

- [ ] 4. Add backend API endpoint for creating inventory items
  - Add route `POST /pharmacy/inventory` in `backend/src/modules/pharmacy/routes/index.ts`
  - Implement `create` controller function in `backend/src/modules/pharmacy/controllers/inventory_items.controller.ts`
  - Validate required field: medicine name
  - Normalize medicine name to lowercase for key field
  - Check for duplicate key (case-insensitive) and return 400 error if exists
  - Validate numeric fields (unitsPerPack >= 1, onHand >= 0)
  - Set default values for optional fields (unitsPerPack=1, onHand=0, avgCostPerUnit=0, lastSalePerUnit=0)
  - Create InventoryItem document with provided data
  - Return 201 status with created item data
  - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 4.1 Write property test for medicine name normalization
  - **Property 1: Medicine name normalization**
  - **Validates: Requirements 6.1**
  - Generate random medicine names with mixed cases
  - Verify key is always lowercase version of name
  - Run 100+ iterations with fast-check or similar PBT library

- [ ]* 4.2 Write property test for duplicate detection
  - **Property 2: Duplicate detection is case-insensitive**
  - **Validates: Requirements 6.3, 6.4**
  - Generate random medicine name and create item
  - Generate case variations of the same name
  - Verify all variations are rejected with 400 error
  - Run 100+ iterations

- [ ]* 4.3 Write property test for default values
  - **Property 3: Default values for optional fields**
  - **Validates: Requirements 6.2**
  - Generate random subsets of optional fields
  - Create items with those fields
  - Verify missing fields have correct defaults (unitsPerPack=1, onHand=0, avgCostPerUnit=0, lastSalePerUnit=0, narcotic=false)
  - Run 100+ iterations

- [ ]* 4.4 Write unit tests for backend validation
  - Test required field validation (empty name returns 400)
  - Test numeric field validation (negative values return 400)
  - Test duplicate name detection returns 400
  - Test successful creation returns 201
  - _Requirements: 4.1-4.5, 6.3, 6.4_

- [ ] 5. Add audit logging for item creation
  - Import AuditLog model in inventory_items.controller.ts
  - Create audit log entry after successful item creation
  - Set actor from req.user (name, email, or 'system')
  - Set action: 'Create Inventory Item', label: 'CREATE_INVENTORY'
  - Set detail: item name and key
  - Wrap audit log creation in try-catch (don't block item creation on failure)
  - _Requirements: 6.6_

- [ ] 6. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add API client method for creating inventory items
  - Add `createInventoryItem` method to pharmacyApi object in `src/utils/api.ts`
  - Accept form data as parameter (name, genericName, category, etc.)
  - Send POST request to `/pharmacy/inventory`
  - Handle response and error cases
  - Throw error with message from server response
  - _Requirements: 5.2, 5.3_

- [ ] 8. Implement form submission logic in dialog
  - Add useState for loading state
  - Add handleSubmit function that validates form
  - Call pharmacyApi.createInventoryItem with form data
  - Disable submit button and show loading indicator during API call
  - Handle success: call onSuccess callback, close dialog
  - Handle error: display error message at top of dialog, keep dialog open
  - Add "Create Item" button in dialog footer
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7_

- [ ]* 8.1 Write integration tests for form submission
  - Test successful item creation flow
  - Test error handling for duplicate name
  - Test error handling for validation failures
  - Test loading state during API call
  - _Requirements: 5.1-5.7_

- [ ] 9. Add "Add Item" button to Inventory page
  - Open `src/pages/pharmacy/pharmacy_Inventory.tsx`
  - Add useState for addItemOpen state
  - Add "Add Item" button next to "Add Invoice" button
  - Use Package icon from lucide-react
  - Set title attribute: "Add Item (M)"
  - Set onClick to open dialog (setAddItemOpen(true))
  - Style button consistently with existing action buttons
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 10. Integrate Add Item Dialog into Inventory page
  - Import pharmacy_AddItemDialog component
  - Add AddItemDialog component to JSX with open={addItemOpen}
  - Pass onClose handler to set addItemOpen to false
  - Pass onSuccess handler to refresh inventory and show success toast
  - Implement success toast notification with item name
  - Auto-dismiss toast after 3-5 seconds
  - Trigger inventory refresh by incrementing refreshTick
  - _Requirements: 2.1, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 11. Implement keyboard shortcuts
  - Add "M" key handler to existing handleKeyDown function in Inventory page
  - Check that user is not typing in input field (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')
  - Open Add Item dialog when "M" is pressed
  - Add Enter key handler in dialog to submit form when valid
  - Ensure Escape key handler closes dialog
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 11.1 Write unit tests for keyboard shortcuts
  - Test "M" key opens dialog
  - Test "M" key doesn't trigger when typing in input
  - Test Enter key submits form
  - Test Escape key closes dialog
  - _Requirements: 7.1-7.5_

- [ ] 12. Final checkpoint - Ensure all tests pass and feature works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses TypeScript for both frontend (React) and backend (Express)
- Existing infrastructure is reused: InventoryItem model, image upload endpoint, audit log system
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows with database and API
