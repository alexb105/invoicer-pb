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
        this.initializeApp();
    }

    async initializeApp() {
        try {
            loadBusinessInfo();
            
            // Initialize CustomerDB and wait for data to load
            const customerDb = new CustomerDB();
            await customerDb.waitForLoad();
            console.log('Init: CustomerDB loaded with', customerDb.dB.length, 'customers');
            
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
            if (analyticsBtn) {
                analyticsBtn.addEventListener('click', () => {
                    analyticsPanel.show();
                });
            }

            // Initialize AI Chat with the shared CustomerDB instance
            const aiChatPanel = new AIChatPanel(customerDb);
            
            // Connect AI chat button
            const aiChatBtn = document.getElementById('btn-open-ai-chat');
            if (aiChatBtn) {
                aiChatBtn.addEventListener('click', async () => {
                    // Ensure customer data is loaded before showing AI chat
                    if (typeof customerDb.waitForLoad === 'function') {
                        await customerDb.waitForLoad();
                    }
                    aiChatPanel.show();
                });
            } else {
                console.warn('AI Chat button not found in DOM');
            }
            
        } catch (error) {
            console.error('Error initializing application:', error);
        }

        // Connect finish button
        const finishBtn = document.querySelector('.btn-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                customerSelectionManager.onFinishInvoice();
            });
        }
    }
}
