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
import { CustomerSelectionManager } from './CustomerSelectionManager.js';
import { AIChatPanel } from './AIChatPanel.js';

// Application Initialization Module
export class Init {
    constructor() {
        loadBusinessInfo();
        const customerDb = new CustomerDB();
        const invoiceSettings = new InvoiceSettings();
        
        // Initialize Customer Selection Manager first
        const customerSelectionManager = new CustomerSelectionManager();
        
        const invoiceTable = new InvoiceTable(invoiceSettings, customerSelectionManager);
        customerSelectionManager.setInvoiceTable(invoiceTable);
        const customerBook = new CustomerBook(invoiceTable, customerDb, customerSelectionManager);
        new InvoiceDoc(invoiceTable, customerBook, invoiceSettings, customerSelectionManager);
        new InvoiceFinderPanel(customerDb, invoiceTable, customerSelectionManager);
        new SaveCustomerInvoice(customerDb, invoiceTable, customerSelectionManager);
        
        // Initialize Analytics
        const analytics = new Analytics(customerDb);
        const analyticsPanel = new AnalyticsPanel(analytics);
        
        // Connect analytics button
        const analyticsBtn = document.getElementById('btn-open-analytics');
        analyticsBtn.addEventListener('click', () => {
            analyticsPanel.show();
        });

        // Initialize AI Chat
        const aiChatPanel = new AIChatPanel();
        
        // Connect AI chat button
        const aiChatBtn = document.getElementById('btn-open-ai-chat');
        aiChatBtn.addEventListener('click', () => {
            aiChatPanel.show();
        });

        // Connect finish button
        const finishBtn = document.querySelector('.btn-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                customerSelectionManager.onFinishInvoice();
            });
        }
    }
}
