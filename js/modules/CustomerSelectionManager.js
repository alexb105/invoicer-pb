import { AppState } from './AppState.js';

// Customer Selection Manager Module
export class CustomerSelectionManager {
    constructor() {
        this.invoiceOperations = [];
        this.customerSelectionIndicator = null;
        this.invoiceTable = null;
        this.initializeUI();
        this.setupEventListeners();
    }

    // Method to set invoice table reference
    setInvoiceTable(invoiceTable) {
        this.invoiceTable = invoiceTable;
    }

    initializeUI() {
        // Create customer selection indicator
        this.createCustomerSelectionIndicator();
        
        // Get all invoice operation buttons
        this.invoiceOperations = [
            document.querySelector('.btn-add-row'),
            document.querySelector('.btn-mot-row'),
            document.querySelector('.btn-delete-row'),
            document.querySelector('#btn-save-invoice'),
            document.querySelector('.btn-print'),
            document.querySelector('.btn-finish')
        ].filter(btn => btn !== null);

        // Initially disable invoice operations
        this.updateInvoiceOperationsState();
    }

    createCustomerSelectionIndicator() {
        // Create backdrop element
        const backdrop = document.createElement('div');
        backdrop.id = 'customer-selection-backdrop';
        backdrop.className = 'customer-selection-backdrop';
        
        // Create a customer selection status indicator
        const indicator = document.createElement('div');
        indicator.id = 'customer-selection-indicator';
        indicator.className = 'customer-selection-indicator';
        indicator.innerHTML = `
            <div class="selection-status">
                <span class="status-icon">⚠️</span>
                <span class="status-text">No customer selected</span>
            </div>
            <div class="selection-actions">
                <button class="btn-select-customer" id="btn-select-customer">Select Customer</button>
            </div>
        `;
        
        // Insert backdrop and indicator after the top navigation
        const nav = document.querySelector('.top-nav');
        nav.insertAdjacentElement('afterend', backdrop);
        backdrop.appendChild(indicator);
        
        this.customerSelectionIndicator = indicator;
        this.customerSelectionBackdrop = backdrop;
    }

    setupEventListeners() {
        // Listen for customer selection changes
        document.addEventListener('customerSelected', () => {
            this.updateCustomerSelectionIndicator();
            this.updateInvoiceOperationsState();
        });

        // Listen for customer deselection
        document.addEventListener('customerDeselected', () => {
            this.updateCustomerSelectionIndicator();
            this.updateInvoiceOperationsState();
        });

        // Handle select customer button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-select-customer') {
                this.openCustomerSelection();
            }
        });
    }

    openCustomerSelection() {
        // Open customer book modal
        const customerBookBtn = document.querySelector('#btn-open-customer-book');
        if (customerBookBtn) {
            customerBookBtn.click();
        }
    }

    updateCustomerSelectionIndicator() {
        if (!this.customerSelectionIndicator || !this.customerSelectionBackdrop) return;

        if (AppState.isCustomerSelected()) {
            // Hide the indicator and backdrop when customer is selected
            this.customerSelectionBackdrop.style.display = 'none';
        } else {
            // Show the indicator and backdrop when no customer is selected
            this.customerSelectionBackdrop.style.display = 'block';
            this.customerSelectionIndicator.className = 'customer-selection-indicator not-selected';
            
            const statusIcon = this.customerSelectionIndicator.querySelector('.status-icon');
            const statusText = this.customerSelectionIndicator.querySelector('.status-text');
            const selectBtn = this.customerSelectionIndicator.querySelector('#btn-select-customer');
            
            statusIcon.textContent = '⚠️';
            statusText.textContent = 'No customer selected';
            selectBtn.textContent = 'Select Customer';
        }
    }

    updateInvoiceOperationsState() {
        const isCustomerSelected = AppState.isCustomerSelected();
        
        this.invoiceOperations.forEach(btn => {
            if (btn) {
                if (isCustomerSelected) {
                    btn.removeAttribute('disabled');
                    btn.classList.remove('disabled');
                } else {
                    btn.setAttribute('disabled', 'true');
                    btn.classList.add('disabled');
                }
            }
        });
    }

    // Method to validate customer selection before operations
    validateCustomerSelection(operationName = 'this operation') {
        if (!AppState.isCustomerSelected()) {
            this.showCustomerRequiredMessage(operationName);
            return false;
        }
        return true;
    }

    showCustomerRequiredMessage(operationName) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'customer-required-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-text">Please select a customer before ${operationName}</span>
                <button class="notification-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Method to be called when customer is selected
    onCustomerSelected(customer) {
        AppState.setCustomerSelection(customer);
        document.dispatchEvent(new CustomEvent('customerSelected'));
    }

    // Method to be called when customer is deselected
    onCustomerDeselected() {
        AppState.clearCustomerSelection();
        document.dispatchEvent(new CustomEvent('customerDeselected'));
    }

    // Method to handle finish button - clear customer selection and reset invoice
    onFinishInvoice() {
        if (!this.validateCustomerSelection('finishing invoice')) {
            return;
        }
        
        // Clear customer selection
        this.onCustomerDeselected();
        
        // Clear invoice table
        if (this.invoiceTable) {
            this.invoiceTable.clearInvoiceData();
        }
        
        // Clear customer details inputs
        const customerDetailsInput = document.querySelector(".customer-details-input");
        const carDetailsInputs = document.querySelectorAll(".info-val");
        
        if (customerDetailsInput) customerDetailsInput.value = '';
        carDetailsInputs.forEach(input => input.value = '');
        
        // Show success message
        this.showFinishMessage();
    }

    showFinishMessage() {
        const notification = document.createElement('div');
        notification.className = 'customer-required-notification';
        notification.style.background = 'rgba(34, 197, 94, 0.95)';
        notification.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-text">Invoice completed! Customer selection cleared.</span>
                <button class="notification-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}
