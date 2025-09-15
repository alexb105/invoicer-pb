// Global application state
export const AppState = {
    selectedCustomer: null,
    selectedInvoiceId: null,
    
    // Check if a customer is currently selected
    isCustomerSelected() {
        return this.selectedCustomer !== null && this.selectedCustomer !== undefined;
    },
    
    // Clear customer selection
    clearCustomerSelection() {
        this.selectedCustomer = null;
        this.selectedInvoiceId = null;
    },
    
    // Set customer selection
    setCustomerSelection(customer) {
        this.selectedCustomer = customer;
        // Generate new invoice ID when customer is selected
        this.selectedInvoiceId = this.generateInvoiceId();
    },
    
    // Generate a unique invoice ID
    generateInvoiceId() {
        return 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
};
