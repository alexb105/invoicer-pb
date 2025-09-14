// Row Module
export class Row {
    constructor(invoiceTableObj) {
        this.invoiceTable = invoiceTableObj;
        this.partAmount;
        this.labourAmount;
        this.rowEl = this.constructRowEl();
        this.connectListeners();
    }

    constructRowEl() {
        const tempRowEl = document.querySelector(".TEMPLATE-input-row");
        const fragRowEl = document.importNode(tempRowEl.content, true);
        this.invoiceTable.tBody.appendChild(fragRowEl);

        const rowEl = this.invoiceTable.tBody.lastElementChild;
        return rowEl
    }

    connectListeners() {
        this.descTextArea = this.rowEl.querySelector(".item-descr-value");
        this.qtyTextArea = this.rowEl.querySelector(".item-numb-value");
        this.itemPartsInput = this.rowEl.querySelector(".item-parts-value");
        this.itemLaborInput = this.rowEl.querySelector(".item-labor-value");


        this.descTextArea.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });

        this.itemPartsInput.addEventListener("focusout", (e) => {
            const valid = this.validateNumberInput(+e.target.value, this.itemPartsInput.parentElement);
            if (!valid) {
                return
            }
            const amountWithVat = this.invoiceTable.calcVat(+e.target.value);

            e.target.value = amountWithVat === 0 ? "" : amountWithVat.toFixed(2);;
            this.updateAmount(amountWithVat, false);
        });

        this.itemPartsInput.addEventListener("input", () => {
            this.invoiceTable.isInput = true;
        })

        this.itemLaborInput.addEventListener("focusout", (e) => {
            const valid = this.validateNumberInput(+e.target.value, this.itemLaborInput.parentElement);
            if (!valid) {
                return
            }

            if (e.target.value !== "") {
                let inputNum = +e.target.value;
                e.target.value = inputNum.toFixed(2);
            }

            this.updateAmount(+e.target.value, true);
        });
    }

    validateNumberInput(num, inputBox) {

        if (num || num === 0) {
            inputBox.classList.remove("numberError");
            return true
        }
        else if (!num) {
            inputBox.classList.add("numberError");
            return false

        }


    }

    updateAmount(amountInputAmount, ifLabourAmount) {
        if (ifLabourAmount) {
            this.labourAmount = amountInputAmount
        }
        else {
            this.partAmount = amountInputAmount
        }
        this.invoiceTable.calcTypeTotal(ifLabourAmount);
    }
}
