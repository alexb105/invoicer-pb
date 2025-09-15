import { AppState } from './AppState.js';

// Save Customer Invoice Module
export class SaveCustomerInvoice {

    constructor(customerDb, invoiceTable, customerSelectionManager) {
        this.invoiceTable = invoiceTable;
        this.customerDb = customerDb;
        this.customerSelectionManager = customerSelectionManager;
        this.saveCustomerInvoiceBtn = document.querySelector('#btn-save-invoice');
        this.connectListeners();
    }

    connectListeners() {

        this.saveCustomerInvoiceBtn.addEventListener("click", (e) => {
            // Validate customer selection before saving
            if (!this.customerSelectionManager.validateCustomerSelection('saving invoice')) {
                return;
            }

            const invoiceData = this.captureInvoiceData();
            this.customerDb.addCustomerInvoice(invoiceData);

            if (invoiceData.reg !== '') {
                e.target.setAttribute('disabled', 'true');

                e.target.textContent = 'Saving...';
                setTimeout(() => {
                    e.target.removeAttribute('disabled');
                    e.target.textContent = 'Save Invoice';
                }, 3000);
            }
        });
    }

    captureInvoiceData() {
        // const customerDetails = document.querySelector(".customer-details-input").value;
        const carDetails = Array.from(document.querySelectorAll(".info-val")).map(input => input.value);

        const tableRows = Array.from(document.querySelectorAll("tbody tr")).map(row => {
            return {
                qty: row.querySelector(".item-numb-value").value,
                description: row.querySelector(".item-descr-value").value,
                parts: row.querySelector(".item-parts-value").value,
                labor: row.querySelector(".item-labor-value").value
            };
        });


        const invoiceData = {
            invoiceId: AppState.selectedInvoiceId,
            mileage: carDetails[1],
            reg: carDetails[2],
            tableRows,
            totals: {
                totalLabour: this.invoiceTable.totalLaborAmount,
                totalParts: this.invoiceTable.totalPartAmount,
                finalTotal: this.invoiceTable.finalTotalAmount
            },
            date: document.querySelector(".date").textContent
        };
        // console.log(invoiceData);
        return invoiceData;
        // addInvoiceDataToDb(invoiceData)
    }

}
