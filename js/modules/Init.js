import { loadBusinessInfo } from './utils.js';
import { CustomerDB } from './CustomerDB.js';
import { InvoiceSettings } from './InvoiceSettings.js';
import { InvoiceTable } from './InvoiceTable.js';
import { CustomerBook } from './CustomerBook.js';
import { InvoiceDoc } from './InvoiceDoc.js';
import { InvoiceFinderPanel } from './InvoiceFinderPanel.js';
import { SaveCustomerInvoice } from './SaveCustomerInvoice.js';
import { Analytics } from './Analytics.js';
import { AnalyticsPanel } from './AnalyticsPanel.js';

// Application Initialization Module
export class Init {
    constructor() {
        loadBusinessInfo();
        const customerDb = new CustomerDB();
        const invoiceSettings = new InvoiceSettings();
        const invoiceTable = new InvoiceTable(invoiceSettings);
        const customerBook = new CustomerBook(invoiceTable, customerDb);
        new InvoiceDoc(invoiceTable, customerBook, invoiceSettings);
        new InvoiceFinderPanel(customerDb, invoiceTable);
        new SaveCustomerInvoice(customerDb, invoiceTable);
        
        // Initialize Analytics
        const analytics = new Analytics(customerDb);
        const analyticsPanel = new AnalyticsPanel(analytics);
        
        // Connect analytics button
        const analyticsBtn = document.getElementById('btn-open-analytics');
        analyticsBtn.addEventListener('click', () => {
            analyticsPanel.show();
        });
    }
}
