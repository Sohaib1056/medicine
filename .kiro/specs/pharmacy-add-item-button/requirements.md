# Requirements Document

## Introduction

This feature adds an "Add Item" button to the pharmacy inventory page that allows users to directly create new inventory items without going through the invoice approval workflow. Currently, inventory items can only be added by creating an invoice, which then goes through a pending review process before items are added to inventory. This direct creation path provides a faster way to add items when invoice details are not needed.

## Glossary

- **Inventory_Page**: The pharmacy inventory management page that displays all inventory items in a table with tabs for different views (All Items, Pending Review, Low Stock, etc.)
- **Add_Item_Button**: A new button on the Inventory_Page that opens a form for directly creating inventory items
- **Add_Item_Dialog**: A modal dialog/form that allows users to enter details for a new inventory item
- **Inventory_Item**: A product/medicine record in the pharmacy inventory system with properties like name, category, manufacturer, pricing, stock levels, etc.
- **Invoice_Workflow**: The existing process where items are added via Add Invoice → Pending Review → Approve → Item added to inventory
- **Direct_Creation**: The new process where items are created immediately without invoice approval

## Requirements

### Requirement 1: Add Item Button Placement

**User Story:** As a pharmacy user, I want to see an "Add Item" button on the inventory page, so that I can quickly access the direct item creation feature.

#### Acceptance Criteria

1. THE Inventory_Page SHALL display an "Add Item" button alongside the existing "Add Invoice" button
2. THE Add_Item_Button SHALL be visually consistent with other action buttons on the page
3. THE Add_Item_Button SHALL include an appropriate icon (e.g., Package or Plus icon)
4. THE Add_Item_Button SHALL have a keyboard shortcut displayed in its title attribute

### Requirement 2: Add Item Dialog Display

**User Story:** As a pharmacy user, I want to open a form when I click the "Add Item" button, so that I can enter the details for a new inventory item.

#### Acceptance Criteria

1. WHEN the Add_Item_Button is clicked, THE Inventory_Page SHALL open the Add_Item_Dialog
2. THE Add_Item_Dialog SHALL be a modal overlay that prevents interaction with the page behind it
3. THE Add_Item_Dialog SHALL have a clear title indicating "Add Inventory Item" or similar
4. THE Add_Item_Dialog SHALL include a close button (X) in the header
5. WHEN the close button is clicked, THE Add_Item_Dialog SHALL close without saving
6. WHEN the Escape key is pressed, THE Add_Item_Dialog SHALL close without saving

### Requirement 3: Item Details Form Fields

**User Story:** As a pharmacy user, I want to enter comprehensive item details in the form, so that the inventory item has all necessary information.

#### Acceptance Criteria

1. THE Add_Item_Dialog SHALL include a text input field for medicine name (required)
2. THE Add_Item_Dialog SHALL include a text input field for generic name (optional)
3. THE Add_Item_Dialog SHALL include a text input field for category (optional)
4. THE Add_Item_Dialog SHALL include a text input field for manufacturer (optional)
5. THE Add_Item_Dialog SHALL include a text input field for brand (optional)
6. THE Add_Item_Dialog SHALL include a text input field for unit type (optional)
7. THE Add_Item_Dialog SHALL include a text input field for shelf number (optional)
8. THE Add_Item_Dialog SHALL include a number input field for units per pack with default value of 1
9. THE Add_Item_Dialog SHALL include a number input field for initial stock quantity (on hand) with default value of 0
10. THE Add_Item_Dialog SHALL include a number input field for minimum stock level (optional)
11. THE Add_Item_Dialog SHALL include a number input field for sale price per unit (optional)
12. THE Add_Item_Dialog SHALL include a checkbox for narcotic classification with default value of false
13. THE Add_Item_Dialog SHALL include a text input field for barcode (optional)
14. THE Add_Item_Dialog SHALL include a textarea field for description (optional)

### Requirement 4: Form Validation

**User Story:** As a pharmacy user, I want the form to validate my input, so that I don't create invalid inventory items.

#### Acceptance Criteria

1. WHEN the medicine name field is empty, THE Add_Item_Dialog SHALL display a validation error message
2. WHEN the form is submitted with an empty medicine name, THE Add_Item_Dialog SHALL prevent submission and highlight the error
3. WHEN numeric fields contain non-numeric values, THE Add_Item_Dialog SHALL display validation error messages
4. WHEN units per pack is less than 1, THE Add_Item_Dialog SHALL display a validation error message
5. WHEN initial stock quantity is negative, THE Add_Item_Dialog SHALL display a validation error message

### Requirement 5: Item Creation via API

**User Story:** As a pharmacy user, I want the form to create the inventory item when I submit it, so that the item is immediately available in inventory.

#### Acceptance Criteria

1. THE Add_Item_Dialog SHALL include a "Create Item" or "Save" button
2. WHEN the Create button is clicked with valid data, THE Add_Item_Dialog SHALL send a POST request to create the inventory item
3. THE Backend_API SHALL provide an endpoint to create inventory items directly (e.g., POST /pharmacy/inventory)
4. WHEN the API request succeeds, THE Add_Item_Dialog SHALL close
5. WHEN the API request succeeds, THE Inventory_Page SHALL refresh to display the newly created item
6. WHEN the API request fails, THE Add_Item_Dialog SHALL display an error message to the user
7. WHEN the API request is in progress, THE Create button SHALL be disabled and show a loading indicator

### Requirement 6: Backend Item Creation Logic

**User Story:** As a system, I want to create inventory items with proper data normalization, so that items are stored consistently.

#### Acceptance Criteria

1. THE Backend_API SHALL normalize the medicine name to lowercase for the key field
2. THE Backend_API SHALL set default values for optional fields when not provided
3. THE Backend_API SHALL validate that the medicine name is unique (case-insensitive)
4. WHEN a duplicate medicine name is detected, THE Backend_API SHALL return an error response with status code 400
5. THE Backend_API SHALL calculate and store avgCostPerUnit as 0 for directly created items
6. THE Backend_API SHALL set timestamps (createdAt, updatedAt) automatically

### Requirement 7: Keyboard Shortcuts

**User Story:** As a pharmacy user, I want keyboard shortcuts for the Add Item feature, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN the user presses a designated key (e.g., "M" for Medicine), THE Inventory_Page SHALL open the Add_Item_Dialog
2. THE keyboard shortcut SHALL only trigger when the user is not typing in an input field
3. THE keyboard shortcut SHALL be documented in the button's title attribute
4. WHEN the Add_Item_Dialog is open and the user presses Enter, THE form SHALL submit if valid
5. WHEN the Add_Item_Dialog is open and the user presses Escape, THE dialog SHALL close

### Requirement 8: Image Upload Support

**User Story:** As a pharmacy user, I want to upload an image for the inventory item, so that items can be visually identified.

#### Acceptance Criteria

1. THE Add_Item_Dialog SHALL include an image upload field
2. WHEN an image file is selected, THE Add_Item_Dialog SHALL display a preview of the image
3. THE Add_Item_Dialog SHALL accept common image formats (JPEG, PNG, GIF, WebP)
4. WHEN an image is uploaded, THE Backend_API SHALL store the image and return the image URL
5. THE Backend_API SHALL use the existing /pharmacy/inventory/upload-image endpoint for image uploads
6. WHEN the item is created with an image, THE image URL SHALL be stored in the Inventory_Item record

### Requirement 9: Success Feedback

**User Story:** As a pharmacy user, I want confirmation when an item is created successfully, so that I know the operation completed.

#### Acceptance Criteria

1. WHEN an item is created successfully, THE Inventory_Page SHALL display a success notification or toast message
2. THE success message SHALL include the name of the created item
3. THE success message SHALL automatically dismiss after 3-5 seconds
4. THE newly created item SHALL be visible in the inventory table after refresh
