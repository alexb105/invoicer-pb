# Invoice App - Modular Structure

This document describes the new modular structure of the Invoice application.

## Module Organization

The application has been refactored from a single `app.js` file into multiple ES6 modules for better maintainability and organization.

### Core Modules

- **`js/main.js`** - Main application entry point
- **`js/modules/Init.js`** - Application initialization and dependency injection
- **`js/modules/AppState.js`** - Global application state management

### Feature Modules

- **`js/modules/InvoiceSettings.js`** - Invoice settings (VAT, MOT amounts)
- **`js/modules/InvoiceTable.js`** - Invoice table functionality and calculations
- **`js/modules/Row.js`** - Individual table row management
- **`js/modules/InvoiceDoc.js`** - Document management (print, finish, date)

### Customer Management Modules

- **`js/modules/CustomerDB.js`** - Customer database operations
- **`js/modules/CustomerBook.js`** - Customer book UI and interactions
- **`js/modules/SaveCustomerInvoice.js`** - Invoice saving functionality
- **`js/modules/InvoiceFinderPanel.js`** - Invoice search and retrieval

### Utility Modules

- **`js/modules/utils.js`** - Utility functions (random string generation, business info loading)

## Module Dependencies

```
main.js
└── Init.js
    ├── utils.js
    ├── CustomerDB.js
    ├── InvoiceSettings.js
    ├── InvoiceTable.js
    │   └── Row.js
    ├── CustomerBook.js
    │   ├── AppState.js
    │   └── utils.js
    ├── InvoiceDoc.js
    ├── InvoiceFinderPanel.js
    │   ├── AppState.js
    │   └── Row.js
    └── SaveCustomerInvoice.js
        └── AppState.js
```

## Benefits of Modular Structure

1. **Separation of Concerns** - Each module has a single responsibility
2. **Maintainability** - Easier to locate and modify specific functionality
3. **Reusability** - Modules can be imported and used independently
4. **Testing** - Individual modules can be tested in isolation
5. **Code Organization** - Related functionality is grouped together
6. **Dependency Management** - Clear import/export relationships

## Usage

The application now loads through `js/main.js` which imports the `Init` class and initializes the application. The HTML file has been updated to use `type="module"` for ES6 module support.

## Browser Compatibility

This modular structure requires a modern browser that supports ES6 modules. All major browsers (Chrome, Firefox, Safari, Edge) support ES6 modules.

## Backup

The original `app.js` file has been backed up as `app.js.backup` for reference.
