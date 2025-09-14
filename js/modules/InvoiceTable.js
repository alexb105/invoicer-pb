import { Row } from './Row.js';

// Invoice Table Module
export class InvoiceTable {
    constructor(InvoiceSettings) {
        this.invoiceSettings = InvoiceSettings;
        this.tBody = document.querySelector("tbody");
        this.isInput = false;
        this.tableTotalsConnections();
        this.tableDetailsConnections();
        this.rowArray = [];
        this.totalLaborAmount = 0;
        this.totalPartAmount = 0;
        this.finalTotalAmount = 0;
        this.addNewRowHandler();
        this.connectListeners();
    }

    tableDetailsConnections() {
        this.customerDetailsInput = document.querySelector(".customer-details-input");
        this.carDetailsInput = document.querySelectorAll(".info-val");
    }

    tableTotalsConnections() {
        this.PartsTotalDisplay = document.querySelector(".parts-total-value");
        this.LaborTotalDisplay = document.querySelector(".labor-total-value");
        this.finalTotalDisplay = document.querySelector(".final-total-value");
    }

    connectListeners() {
        this.addRowBtn = document.querySelector(".btn-add-row");
        this.deleteRowBtn = document.querySelector(".btn-delete-row");
        this.addMotRowBtn = document.querySelector(".btn-mot-row");

        this.addMotRowBtn.addEventListener("click", this.addNewRowHandler.bind(this, true));
        this.addRowBtn.addEventListener("click", this.addNewRowHandler.bind(this, false));
        this.deleteRowBtn.addEventListener("click", this.deleteRowHandler.bind(this));
    }

    calcTypeTotal(ifLabourAmount, updateAll = false) {
        let amountType, totalAmountType;
        if (!updateAll) {
            amountType = ifLabourAmount === true ? ["labourAmount"] : ["partAmount"];
        }
        else {
            amountType = ["labourAmount", "partAmount"];
        }

        for (let i = 0; i < amountType.length; i++) {
            totalAmountType = this.rowArray.reduce((preVal, curVal) => {
                if (curVal[amountType[i]]) {
                    return preVal + curVal[amountType[i]]
                }
                else {
                    return preVal + 0
                }
            }, 0)

            amountType[i] === "labourAmount" ? this.totalLaborAmount = totalAmountType
                : this.totalPartAmount = totalAmountType;
        }
        this.calcFinalTotal();
    }

    calcFinalTotal() {
        this.finalTotalAmount = this.totalLaborAmount + this.totalPartAmount
        this.updateTotalsDisplay();
    }

    calcVat(amount) {
        if (this.isInput === true) {
            const finalAmount = amount * this.invoiceSettings.vatPercent;
            this.isInput = false;
            return finalAmount;
        }
        else {
            return amount
        }
    }

    updateTotalsDisplay() {
        this.PartsTotalDisplay.textContent = `£${this.totalPartAmount.toFixed(2)}`;
        this.LaborTotalDisplay.textContent = `£${this.totalLaborAmount.toFixed(2)}`;
        this.finalTotalDisplay.textContent = `£${this.finalTotalAmount.toFixed(2)}`;
    }

    addNewRowHandler(mot) {
        const newRow = new Row(this);
        this.rowArray.push(newRow);

        if (mot) {
            const motAmount = this.invoiceSettings.motAmount;
            newRow.updateAmount(+motAmount, false);
            newRow.itemPartsInput.value = motAmount;
            newRow.descTextArea.value = "MOT";
        }
    }

    deleteRowHandler() {
        this.rowArray[this.rowArray.length - 1].rowEl.remove();
        this.rowArray.pop();
        this.calcTypeTotal(null, true);
    }

    clearInvoiceData() {
        this.tBody.innerHTML = '';
        this.rowArray = [];
        this.totalLaborAmount = 0;
        this.totalPartAmount = 0;
        this.finalTotalAmount = 0;
        this.updateTotalsDisplay();
        // add one row

    }
}
