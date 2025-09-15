// Invoice Document Module
export class InvoiceDoc {
    constructor(invoiceTable, customerBook, invoiceSettings, customerSelectionManager) {
        this.invoiceSettings = invoiceSettings;
        this.customerBook = customerBook;
        this.invoiceTable = invoiceTable;
        this.customerSelectionManager = customerSelectionManager;
        this.canUpdate = true;
        this.hideEls;
        this.invoiceInput = document.querySelector(".invoice-input");
        this.dateDisplay = document.querySelector(".date");
        // this.setInvoiceNum();
        this.setDate();
        this.connectListeners();
    }

    // setInvoiceNum(update = false) {
    //     let currentNum;
    //     if(update === false){
    //         currentNum = 0
    //     }
    //     else{
    //         currentNum = +this.invoiceInput.value + 1;
    //         this.canUpdate = false;
    //     }

    //     if (localStorage.getItem("invoiceNum") && !update) {
    //         currentNum = localStorage.getItem("invoiceNum");
    //     }
    //     else {
    //         localStorage.setItem("invoiceNum", currentNum)
    //     }

    //     this.invoiceInput.value = currentNum
    // }

    setDate() {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        this.dateDisplay.textContent = `${day}/${month}/${year}`;
    }

    connectListeners() {
        this.btnFinish = document.querySelector(".btn-finish");
        this.printBtn = document.querySelector(".btn-print");

        this.btnFinish.addEventListener("click", this.finishHandler.bind(this));
        this.printBtn.addEventListener("click", this.print.bind(this));
    }

    finishHandler() {
        // this.setInvoiceNum(this.canUpdate);
        this.strechLastRow();
    }

    print() {
        // Validate customer selection before printing
        if (!this.customerSelectionManager.validateCustomerSelection('printing invoice')) {
            return;
        }

        document.querySelector('.A4').classList.remove('A4-box-shadow');
        this.printBtn.classList.add("hide");
        this.btnFinish.classList.add("hide");
        this.invoiceSettings.settingWidget.classList.add("hide");
        this.invoiceTable.addMotRowBtn.classList.add("hide");
        this.invoiceTable.addRowBtn.classList.add("hide");
        this.invoiceTable.deleteRowBtn.classList.add("hide");
        document.querySelector('#btn-open-customer-book').classList.add("hide");
        document.querySelector('#btn-save-invoice').classList.add('hide');
        document.querySelector('#btn-open-finder-invoice-panel').classList.add('hide');

        window.print();
        document.querySelector('.A4').classList.add('A4-box-shadow');
        document.querySelector('#btn-save-invoice').classList.remove('hide');
        document.querySelector('#btn-open-finder-invoice-panel').classList.remove('hide');
        this.printBtn.classList.remove("hide");
        this.btnFinish.classList.remove("hide");
        this.invoiceSettings.settingWidget.classList.remove("hide");
        this.invoiceTable.addMotRowBtn.classList.remove("hide");
        this.invoiceTable.addRowBtn.classList.remove("hide");
        this.invoiceTable.deleteRowBtn.classList.remove("hide");
        document.querySelector('#btn-open-customer-book').classList.remove("hide");
    }

    strechLastRow() {
        const pageLimit = document.querySelector(".page-limit");
        const lastTr = this.invoiceTable.tBody.lastElementChild;
        const textArea = lastTr.querySelector(".item-descr-value");
        const textAreaTopPos = lastTr.getBoundingClientRect().top;
        const pageLimitTop = pageLimit.getBoundingClientRect().top;
        const textAreaHeight = pageLimitTop - textAreaTopPos - 140;
        textArea.style.height = `${textAreaHeight}px`;
    }
}
