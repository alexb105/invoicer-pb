// Invoice App



const AppState = {
    selectedCustomer: null,
    selectedInvoiceId: null
}

class Init {
    constructor() {
        loadBusinessInfo();
        const customerDb = new CustomerDB();
        const invoiceSettings = new InvoiceSettings();
        const invoiceTable = new InvoiceTable(invoiceSettings);
        const customerBook = new CustomerBook(invoiceTable, customerDb);
        new InvoiceDoc(invoiceTable, customerBook, invoiceSettings);
        new InvoiceFinderPanel(customerDb, invoiceTable);
        new SaveCustomerInvoice(customerDb, invoiceTable);
    }
}

function loadBusinessInfo(){
    let businessInfo;

    businessInfo = localStorage.getItem("businessInfo");
    if (businessInfo) {
        businessInfo = JSON.parse(businessInfo);

        
    }



    localStorage.setItem("businessInfo", JSON.stringify(businessInfo));
    document.querySelector("[data-invoice-header-title]").textContent = businessInfo.invoiceTitle;
    document.querySelector("[data-invoice-mobile]").textContent = businessInfo.mobile;
    document.querySelector("[data-invoice-address]").textContent = businessInfo.address;
}

class InvoiceSettings {
    constructor() {
        this.instanceSettingsValues;
        this.getDomEls();
        this.connectSettingListeners();
        this.applySettings(true);
    }

    getDomEls() {
        this.settingWidget = document.querySelector("[data-invoice-settings]");
        this.vatSettingInput = document.querySelector("[data-vat-setting]");
        this.motSettingInput = document.querySelector("[data-mot-setting]");
        this.globalSaveBtn = document.querySelector("[data-global-settings-save]");
        this.instanceSaveBtn = document.querySelector("[data-instance-settings-save]");
    }

    connectSettingListeners() {
        this.globalSaveBtn.addEventListener("click", () => {
            //save changes to local storage
            localStorage.setItem("invoiceSettings", JSON.stringify(this.getInputSettingValues()));
            this.applySettings(true);
        });

        this.instanceSaveBtn.addEventListener("click", () => {
            // apply changes to current instance
            this.instanceSettingsValues = this.getInputSettingValues();
            this.applySettings(false);
        });
    }

    getInputSettingValues() {
        const settingValues = {
            vatPercent: this.vatSettingInput.value,
            motAmount: this.motSettingInput.value
        }

        return settingValues
    }

    applySettings(isGlobal) {
        let settings;
        if (isGlobal) {
            settings = JSON.parse(localStorage.getItem("invoiceSettings"));
            if (!settings) {
                settings = { vatPercent: 1.2, motAmount: 45.50 }
            }
        }
        else {
            settings = this.instanceSettingsValues;
        }

        this.motAmount = settings.motAmount;
        this.vatPercent = settings.vatPercent;

        this.vatSettingInput.value = settings.vatPercent;
        this.motSettingInput.value = settings.motAmount;
    }
}

class InvoiceDoc {
    constructor(invoiceTable, customerBook, invoiceSettings) {
        this.invoiceSettings = invoiceSettings;
        this.customerBook = customerBook;
        this.invoiceTable = invoiceTable;
        this.canUpdate = true;
        this.hideEls;
        this.dateDisplay = document.querySelector("[data-date]");
        // this.setInvoiceNum();
        this.setDate();
        this.connectListeners();
    }


    setDate() {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        this.dateDisplay.textContent = `${day}/${month}/${year}`;
    }

    connectListeners() {
        this.btnFinish = document.querySelector("[data-btn-finish]");
        this.printBtn = document.querySelector("[data-btn-print]");

        this.btnFinish.addEventListener("click", this.finishHandler.bind(this));
        this.printBtn.addEventListener("click", this.print.bind(this));
    }

    finishHandler() {
        // this.setInvoiceNum(this.canUpdate);
        this.strechLastRow();
    }

    print() {
        document.querySelector('[data-A4]').classList.remove('A4-box-shadow');
        this.printBtn.classList.add("hide");
        this.btnFinish.classList.add("hide");
        this.invoiceSettings.settingWidget.classList.add("hide");
        this.invoiceTable.addMotRowBtn.classList.add("hide");
        this.invoiceTable.addRowBtn.classList.add("hide");
        this.invoiceTable.deleteRowBtn.classList.add("hide");
        this.customerBook.customerBookEl.classList.add("hide");
        document.querySelector('[data-btn-save-invoice]').classList.add('hide');
        document.querySelector('[data-btn-open-finder-invoice-panel]').classList.add('hide');

        window.print();
        document.querySelector('[data-A4]').classList.add('A4-box-shadow');
        document.querySelector('[data-btn-save-invoice]').classList.remove('hide');
        document.querySelector('[data-btn-open-finder-invoice-panel]').classList.remove('hide');
        this.printBtn.classList.remove("hide");
        this.btnFinish.classList.remove("hide");
        this.invoiceSettings.settingWidget.classList.remove("hide");
        this.invoiceTable.addMotRowBtn.classList.remove("hide");
        this.invoiceTable.addRowBtn.classList.remove("hide");
        this.invoiceTable.deleteRowBtn.classList.remove("hide");
        this.customerBook.customerBookEl.classList.remove("hide");
    }

    strechLastRow() {
        const pageLimit = document.querySelector("[data-page-limit]");
        const lastTr = this.invoiceTable.tBody.lastElementChild;
        const textArea = lastTr.querySelector("[data-item-descr-value]");
        const textAreaTopPos = lastTr.getBoundingClientRect().top;
        const pageLimitTop = pageLimit.getBoundingClientRect().top;
        const textAreaHeight = pageLimitTop - textAreaTopPos - 140;
        textArea.style.height = `${textAreaHeight}px`;
    }
}

class InvoiceTable {
    constructor(InvoiceSettings) {
        this.invoiceSettings = InvoiceSettings;
        this.tBody = document.querySelector("[data-tbody]");
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
        this.customerDetailsInput = document.querySelector("[data-customer-details-input]");
        this.carDetailsInput = document.querySelectorAll("[data-info-val]");
    }

    tableTotalsConnections() {
        this.PartsTotalDisplay = document.querySelector("[data-parts-total-value]");
        this.LaborTotalDisplay = document.querySelector("[data-labor-total-value]");
        this.finalTotalDisplay = document.querySelector("[data-final-total-value]");
    }

    connectListeners() {
        this.addRowBtn = document.querySelector("[data-btn-add-row]");
        this.deleteRowBtn = document.querySelector("[data-btn-delete-row]");
        this.addMotRowBtn = document.querySelector("[data-btn-mot-row]");

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

class Row {
    constructor(invoiceTableObj) {
        this.invoiceTable = invoiceTableObj;
        this.partAmount;
        this.labourAmount;
        this.rowEl = this.constructRowEl();
        this.connectListeners();
    }

    constructRowEl() {
        const tempRowEl = document.querySelector("[data-TEMPLATE-input-row]");
        const fragRowEl = document.importNode(tempRowEl.content, true);
        this.invoiceTable.tBody.appendChild(fragRowEl);

        const rowEl = this.invoiceTable.tBody.lastElementChild;
        return rowEl
    }

    connectListeners() {
        this.descTextArea = this.rowEl.querySelector("[data-item-descr-value]");
        this.qtyTextArea = this.rowEl.querySelector("[data-item-numb-value]");
        this.itemPartsInput = this.rowEl.querySelector("[data-item-parts-value]");
        this.itemLaborInput = this.rowEl.querySelector("[data-item-labor-value]");


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

//##########################################--Customer Book--############################################

class CustomerBook {


    constructor(invoiceTable, customerDb) {
        this.invoiceTable = invoiceTable;
        this.customerBookEl = document.querySelector("[data-customer-book]");
        this.customerDb = customerDb;
        this.customerList = document.querySelector("[data-customer-list]");
        this.customerItemList = this.customerList.getElementsByClassName("customer-item");
        this.searchListInput = document.querySelector("#search-list");
        this.carItemTemplate = document.querySelector(".TEMPLATE-vechile-details");
        this.currentCustomerIndex;
        this.customerFormConnections();
        this.customerBookDetailsConnections();
        this.updateOptionsPanelConnections();
        this.warningPanelConnections();
        this.buildCustomerList();
        this.connectListeners();
    }

    customerFormConnections() {
        this.newCustomerFormPanel = document.querySelector(".customer-form-panel");
        this.customerFormInputs = this.newCustomerFormPanel.getElementsByClassName("customer-book-form-input");
    }

    customerBookDetailsConnections() {
        this.customerBookDetails = document.querySelector(".customer-book-details");
        this.customerBookName = this.customerBookDetails.firstElementChild;
        this.customerMobileList = this.customerBookDetails.querySelector(".customer-mobiles-list");
        this.customerAddressValue = this.customerBookDetails.querySelector(".customer-address-value");
        this.customerVechielList = this.customerBookDetails.querySelector(".customer-book-vechile-details");
    }

    updateOptionsPanelConnections() {
        this.updateOptionPanel = document.querySelector(".customer-update-detail-panel");
        this.updateFormDb = {
            mobile: document.querySelector(".customer-mobile-form"),
            car: document.querySelector(".customer-car-form"),
            name: document.querySelector(".customer-update-name-form")
        }
        this.currentOption;
    }

    warningPanelConnections() {
        this.warningPanel = document.querySelector(".customer-book-warning-panel");
        this.warningHeading = this.warningPanel.querySelector(".warning-heading");
        this.warningInfo = this.warningPanel.querySelector(".warning-info");
        this.comfirmBtn = this.warningPanel.querySelector(".comfirm-btn")
    }

    connectListeners() {
        this.customerBookEl.addEventListener("click", this.gobalClickEventHandler.bind(this));
        this.customerBookEl.addEventListener("dblclick", this.gobalDblClickEventHandler.bind(this));
        this.searchListInput.addEventListener("input", () => {
            Array.from(this.customerItemList).find(cust => {
                if (cust.textContent.toLowerCase().includes(this.searchListInput.value.toLowerCase())) {
                    cust.classList.remove("hide");
                } else {
                    cust.classList.add("hide");
                }
            });
        })
    }

    gobalClickEventHandler(e) {

        let newCustomerObj;

        if (e.target.classList[0] === "add-new-customer-btn") {
            this.newCustomerFormPanel.classList.remove("hide");
        }

        if (e.target.classList[0] === "back-btn") {
            const currentEl = this.hideSelectedEl(e.target, "book-panel");

            if (currentEl.classList[1] === "customer-book-details") {
                this.clearCustomerDetailsPanel();
            }
        }

        if (e.target.classList[0] === "add-customer-btn") {
            const isFormValid = this.valadation();
            if (!isFormValid) {
                this.configureWarningPanel({
                    head: "Please Fix!",
                    body: "You are Missing information in the form",
                    btn: true
                })
                return
            }

            // create new customer object
            AppState.selectedCustomer = this.constructCustomerObj();
            this.customerDb.addNewCustomer();
            this.constructCustomerEl(AppState.selectedCustomer, this.customerDb.dB.length - 1);
            this.hideSelectedEl(e.target, "book-panel");
            this.clearFormInputs(this.customerFormInputs);

            this.invoiceTable.carDetailsInput[0].value = AppState.selectedCustomer.cars[0].car;
            this.invoiceTable.carDetailsInput[2].value = AppState.selectedCustomer.cars[0].reg;
            this.invoiceTable.customerDetailsInput.value = `${AppState.selectedCustomer.name}                            ${AppState.selectedCustomer.address}                                Mobile:${AppState.selectedCustomer.mobiles[0]}`;

            this.flashCustomerInputs();
        }

        if (e.target.classList[0] === "customer-item") {
            this.customerBookDetails.classList.remove("hide");
            this.currentCustomerIndex = e.target.dataset.index;
            AppState.selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
            this.displayCustomerInfo();
        }

        if (e.target.classList[0] === "update-btn") {
            this.updateOptionPanel.classList.remove("hide")
        }

        if (e.target.classList[0] === "add-mobile-btn") {
            this.showSlectedForm("customer-mobile-form", this.updateFormDb.mobile)
        }
        else if (e.target.classList[0] === "add-car-btn") {
            this.showSlectedForm("customer-car-form", this.updateFormDb.car)
        }
        else if (e.target.classList[0] === "update-name-btn") {
            this.showSlectedForm("customer-update-name-form", this.updateFormDb.name)
        }

        if (e.target.classList[0] === "submit-update-form") {
            this.updateCustomerData();
            this.hideSelectedEl(e.target, "book-panel");
        }

        if (e.target.classList[0] === "delete-btn") {
            const customerItemEl = this.customerItemList[this.currentCustomerIndex];
            this.elToDelete = customerItemEl;
            this.configureWarningPanel({
                head: "Are you sure?",
                body: "Once deleted it will be completely removed",
                btn: "Delete"
            });
        }

        if (e.target.classList[0] === "comfirm-btn" && e.target.textContent === "Delete") {
            this.deleteData(e);
        }

        // run this block when user clicks on the vechile details item 
        if (e.target.classList[0] === "vechile-details-item-holder"
            || e.target.classList[0] === "vechile-reg-value"
            || e.target.classList[0] === "vechile-name-value"
            || e.target.classList[0] === "vechile-detail-type") {

            let carIndex = e.target.dataset.index;
            let vechilelDetailHolderEl = e.target

            if (!carIndex) {
                while (vechilelDetailHolderEl) {
                    const index = vechilelDetailHolderEl.dataset.index;

                    if (index !== undefined && (index === '0' || parseInt(index))) {
                        break;
                    }

                    vechilelDetailHolderEl = vechilelDetailHolderEl.parentElement;
                }
            }

            carIndex = vechilelDetailHolderEl.dataset.index

            this.invoiceTable.carDetailsInput[0].value = AppState.selectedCustomer.cars[carIndex].car;
            this.invoiceTable.carDetailsInput[2].value = AppState.selectedCustomer.cars[carIndex].reg;

            this.flashCustomerInputs();
            this.invoiceTable.clearInvoiceData();
            this.invoiceTable.addNewRowHandler(false);
            AppState.selectedInvoiceId = generateRandomString();

        }

        if (e.target.classList[0] === "customer-mobile-number") {
            const mobileIndex = e.target.dataset.index;
            this.invoiceTable.customerDetailsInput.value = `${AppState.selectedCustomer.name}                            ${AppState.selectedCustomer.address}                                Mobile:${AppState.selectedCustomer.mobiles[mobileIndex]}`;

            // customerObj = this.customerDb.dB[this.currentCustomerIndex];
            this.flashCustomerInputs();
        }
    }

    flashCustomerInputs() {


        const flashInput = (input) => {
            input.classList.add("flash");
            setTimeout(() => {
                input.classList.remove("flash");
            }, 500);
        };

        flashInput(this.invoiceTable.customerDetailsInput);
        this.invoiceTable.carDetailsInput.forEach(input => flashInput(input));
    }

    deleteData(e) {
        const elToDeleteIndex = this.elToDelete.dataset.index;
        let listType;
        if (this.elToDelete.classList[0] === "customer-item") {
            listType = this.customerList;
            this.customerDb.dB.splice(this.currentCustomerIndex, 1);
            this.clearCustomerDetailsPanel();
            this.hideSelectedEl(this.customerBookDetails, "book-panel");
        }
        else if (this.elToDelete.classList[0] === "vechile-details-item-holder") {
            listType = this.customerVechielList;
            this.customerDb.dB[this.currentCustomerIndex].cars.splice(elToDeleteIndex, 1);
        }
        else if (this.elToDelete.classList[0] === "customer-mobile-number") {
            listType = this.customerMobileList;
            this.customerDb.dB[this.currentCustomerIndex].mobiles.splice(elToDeleteIndex, 1);
        }
        this.customerDb.updateDb();
        this.hideSelectedEl(e.target, "book-panel");
        this.elToDelete.remove();
        this.updateListIndex(listType);
    }

    configureWarningPanel(config) {
        this.warningHeading.textContent = config.head;
        this.warningInfo.textContent = config.body;
        this.comfirmBtn.classList.remove("hide");
        this.warningPanel.classList.remove("hide");
        if (config.btn !== true) {
            this.comfirmBtn.textContent = config.btn;
            return
        }
        this.comfirmBtn.classList.add("hide");
    }

    gobalDblClickEventHandler(e) {
        if (e.target.classList[0] === "vechile-details-item-holder"
            || e.target.classList[0] === "vechile-reg-value"
            || e.target.classList[0] === "vechile-detail-type") {
            const carDetailsEl = this.hideSelectedEl(e.target, "vechile-details-item-holder", false);
            this.elToDelete = carDetailsEl;
            this.configureWarningPanel({
                head: "Are you sure?",
                body: "Once deleted it will be completely removed",
                btn: "Delete"
            });
        }

        if (e.target.classList[0] === "customer-mobile-number") {
            this.elToDelete = e.target;
            this.configureWarningPanel({
                head: "Are you sure?",
                body: "Once deleted it will be completely removed",
                btn: "Delete"
            });
        }
    }

    clearFormInputs(formInputs) {
        Array.from(formInputs).forEach((input) => {
            input.value = "";
        });
    }

    clearCustomerDetailsPanel() {
        Array.from(this.customerMobileList.children).forEach(mobileEl => {
            mobileEl.remove();
        });

        Array.from(this.customerVechielList.children).forEach(carEl => {
            carEl.remove();
        });
    }

    updateCustomerData() {
        const inputs = this.currentOption.querySelectorAll("input");
        if (this.currentOption.classList[0] === "customer-mobile-form") {
            this.customerDb.dB[this.currentCustomerIndex].mobiles.push(inputs[0].value);
        }
        else if (this.currentOption.classList[0] === "customer-car-form") {
            const carObj = {
                reg: inputs[1].value,
                car: inputs[0].value
            }
            this.customerDb.dB[this.currentCustomerIndex].cars.push(carObj)
        }
        else if (this.currentOption.classList[0] === "customer-update-name-form") {
            this.customerDb.dB[this.currentCustomerIndex].name = inputs[0].value;
            Array.from(this.customerItemList)[this.currentCustomerIndex].textContent = inputs[0].value;
        }
        this.clearFormInputs(inputs);
        this.customerDb.updateDb();
        this.clearCustomerDetailsPanel();
        this.displayCustomerInfo();
    }

    showSlectedForm(formClassName, formEl) {
        Object.keys(this.updateFormDb).forEach((key) => {
            if (this.updateFormDb[key].classList[0] === formClassName) {
                this.updateFormDb[key].classList.remove("hide");
                this.currentOption = formEl;
            }
            else {
                this.updateFormDb[key].classList.add("hide");
            }
        });
    }

    hideSelectedEl(targetEl, className, hide = true) {
        let target = targetEl;
        let CurrentEl = targetEl;
        for (let i = 0; i < 10; i++) {
            if (CurrentEl.classList[0] !== className) {
                if (target.parentElement.classList[0]) {
                    CurrentEl = CurrentEl.parentElement;
                }
            }
            else {
                if (hide) {
                    CurrentEl.classList.add("hide");
                }
            }
        }
        return CurrentEl
    }

    constructCustomerEl(customerObj, index) {
        const customerItem = document.createElement("li");
        customerItem.className = "customer-item";
        customerItem.textContent = customerObj.name;
        customerItem.dataset.index = index;
        this.customerList.appendChild(customerItem);
    }

    constructCustomerObj() {
        return {
            name: this.customerFormInputs[0].value,
            mobiles: [this.customerFormInputs[1].value],
            address: this.customerFormInputs[2].value,
            cars: [{
                reg: this.customerFormInputs[3].value,
                car: this.customerFormInputs[4].value
            }]
        }
    }

    valadation() {
        if (this.customerFormInputs[0].value.trim() === ""
            || this.customerFormInputs[1].value.trim() === ""
            || this.customerFormInputs[2].value.trim() === ""
            || this.customerFormInputs[3].value.trim() === ""
            || this.customerFormInputs[4].value.trim() === "") {
            return false
        }
        else {
            return true
        }
    }

    buildCustomerList() {
        if (this.customerDb.dB.length === 0) {
            return
        }

        this.customerDb.dB.forEach((custObj, index) => {
            this.constructCustomerEl(custObj, index);
        });
    }

    updateListIndex(listType) {
        Array.from(listType.children).forEach((item, index) => {
            item.dataset.index = index;
        })
    }

    displayCustomerInfo() {
        this.customerBookName.textContent = AppState.selectedCustomer.name;
        this.customerAddressValue.textContent = AppState.selectedCustomer.address;

        AppState.selectedCustomer.mobiles.forEach((mobile, index) => {
            if (mobile) {
                const mobileEl = document.createElement("li");
                mobileEl.className = "customer-mobile-number";
                mobileEl.textContent = `Mobile: ${mobile}`;
                mobileEl.dataset.index = index;
                this.customerMobileList.appendChild(mobileEl);
            }
        });

        AppState.selectedCustomer.cars.forEach((car, index) => {
            const carTemp = document.importNode(this.carItemTemplate.content, true);
            this.customerVechielList.appendChild(carTemp);
            const carItemEl = this.customerVechielList.lastElementChild;
            carItemEl.dataset.index = index;

            carItemEl.firstElementChild.querySelector(".vechile-name-value").textContent = car.car;
            carItemEl.lastElementChild.querySelector(".vechile-reg-value").textContent = car.reg;
        });
    }
}

//##########################################--customer invoice list panel --############################################




class SaveCustomerInvoice {

    constructor(customerDb, invoiceTable) {
        this.invoiceTable = invoiceTable;
        this.customerDb = customerDb;
        this.saveCustomerInvoiceBtn = document.querySelector('[data-btn-save-invoice]');
        this.connectListeners();
    }

    connectListeners() {

        this.saveCustomerInvoiceBtn.addEventListener("click", (e) => {

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
        const carDetails = Array.from(document.querySelectorAll("[data-info-val]")).map(input => input.value);

        const tableRows = Array.from(document.querySelectorAll("[data-tbody] tr")).map(row => {
            return {
                qty: row.querySelector("[data-item-numb-value]").value,
                description: row.querySelector("[data-item-descr-value]").value,
                parts: row.querySelector("[data-item-parts-value]").value,
                labor: row.querySelector("[data-item-labor-value]").value
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
            date: document.querySelector("data-date").textContent
        };
        // console.log(invoiceData);
        return invoiceData;
        // addInvoiceDataToDb(invoiceData)
    }

}

class InvoiceFinderPanel {

    // clear customer list when input filed is empty
    // click customer item and load up the customer invoce panel

    constructor(customerDb, invoiceTable) {

        this.invoiceTable = invoiceTable;
        this.customerDb = customerDb;
        this.searchType = 'name';
        this.searchTerm = '';
        this.selectedCar;
        this.currentPanel = ''

        this.invoiceFinderPanelBackdrop = document.querySelector('#invoice-finder-panel-backdrop');
        this.invoiceFinderPanel = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-panel');
        this.searchTypeDropdown = this.invoiceFinderPanelBackdrop.querySelector('#search-type-dropdown');
        this.closeFinderPanel = this.invoiceFinderPanelBackdrop.querySelector('#close-finder-pannel-btn');
        this.customerSearchInput = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-search');
        this.customerListContainer = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-list');
        this.invoiceSearchPanel = this.invoiceFinderPanelBackdrop.querySelector('#invoice-search-panel');
        this.invoiceCustomerPanel = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel');
        this.invoiceListContainer = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-invoice-list');
        this.invoicePanelBackBtn = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-back');
        this.openFinderPanel = document.querySelector('[data-btn-open-finder-invoice-panel]');
        this.regSelectInput = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-reg-dropdown');

        this.yearSelectInput = this.invoiceFinderPanelBackdrop.querySelector('[data-id="invoice-finder-customer-panel-year-dropdown"]');

        this.connectListeners();

    }

    connectListeners() {

        this.closeFinderPanel.addEventListener('click', () => {
            this.invoiceFinderPanel.setAttribute('hidden', 'true');
            this.invoiceFinderPanelBackdrop.setAttribute('hidden', 'true');
        });

        this.openFinderPanel.addEventListener('click', () => {
            this.invoiceFinderPanelBackdrop.removeAttribute('hidden');
            this.invoiceFinderPanel.removeAttribute('hidden');

            if (this.currentPanel === 'invoice-finder-customer-panel') {
                this.buildSelectOptions();
                this.buildInvoiceList(this.selectedYear);
            }
        });

        this.searchTypeDropdown.addEventListener('change', (value) => {
            this.searchType = value.target.value;
        });

        this.customerSearchInput.addEventListener('input', (event) => {
            this.searchTerm = event.target.value.toLowerCase();

            const filteredCustomers = this.filterCustomers(this.searchTerm);

            if (this.searchTerm === '') {
                this.clearList();
                this.customerListContainer.style.padding = '0px';

            }
            else {
                this.customerListContainer.style.padding = '14px';
                this.buildCustomerList(filteredCustomers);
            }

        });

        this.invoicePanelBackBtn.addEventListener('click', this.goBack.bind(this));


        this.regSelectInput.addEventListener('change', (e) => {
            const selectedReg = e.target.value;
            this.invoiceListContainer.innerHTML = '';
            this.invoiceListContainer.style.padding = '0px';
            this.selectedCar = AppState.selectedCustomer.cars.find(car => car.reg === selectedReg);

            this.buildInvoiceList(this.selectedYear);
        })

        this.yearSelectInput.addEventListener('change', (e) => {


            this.selectedYear = e.target.value;

            this.invoiceListContainer.innerHTML = '';
            this.invoiceListContainer.style.padding = '0px';

            this.buildInvoiceList(this.selectedYear);
        });
    }

    goBack() {
        this.invoiceCustomerPanel.setAttribute('hidden', 'true');
        this.invoiceSearchPanel.removeAttribute('hidden');
        this.currentPanel = '';
    }


    filterCustomers() {
        return this.customerDb.dB.filter(customer => {
            // console.log(item[this.searchType].toLowerCase().includes(this.searchTerm));
            if (this.searchType === 'name') {
                if (customer.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                    // console.log(customer);
                    return customer;
                }
            }
            else if (this.searchType === 'reg') {

                return customer.cars.find((car) => {
                    if (car.reg.toLowerCase().includes(this.searchTerm)) {
                        return customer;
                    }
                });
            }
        });
    }

    buildCustomerList(filteredCustomers) {

        this.clearList();

        if (filteredCustomers.length === 0) { this.customerListContainer.style.padding = '0px'; }

        filteredCustomers.forEach((customer) => {

            // create customer list item
            let customerHtml = document.querySelector(".TEMPLATE-invoice-finder-item")
                .content.cloneNode(true)
                .querySelector('.invoice-finder-item');
            const openCustomerBtn = customerHtml.querySelector('.invoice-finder-item-open-btn');

            if (this.searchType === 'name') {
                customer.cars.forEach((car) => {
                    customerHtml.querySelector('.invoice-finder-item-info').textContent = `Name: ${customer.name} Reg: ${car.reg}`;
                    // customerHtml.innerHTML += `<p>Name: ${customer.name}</p> <p class="invoice-finder-item-car">Reg: ${car.reg}</p>`;

                });

                openCustomerBtn.addEventListener('click', () => {
                    this.currentPanel = 'invoice-finder-customer-panel';
                    this.openCustomerPanel(customer);
                    AppState.selectedCustomer = customer;
                });
                this.customerListContainer.appendChild(customerHtml);
            }
            else if (this.searchType === 'reg') {
                const car = customer.cars.filter(car => {
                    if (car.reg.toLowerCase().startsWith(this.searchTerm.toLowerCase())) {
                        return customer;
                    }
                });

                if (!!car.length) {
                    customerHtml.querySelector('.invoice-finder-item-info').textContent = `NAME: ${customer.name} REG: ${car[0].reg}`;
                    // customerHtml.innerHTML += `<p>Name: ${customer.name}</p> <p class="invoice-finder-item-car">Reg: ${car[0].reg}</p>`;

                    openCustomerBtn.addEventListener('click', () => this.openCustomerPanel(customer));
                    this.customerListContainer.appendChild(customerHtml);
                }
            }
        });
    }

    openCustomerPanel(customer) {
        AppState.selectedCustomer = customer;

        this.invoiceSearchPanel.setAttribute('hidden', 'true');
        this.invoiceCustomerPanel.removeAttribute('hidden');

        this.customerNameEl = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-name');
        this.customerMobileEl = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-mobile');

        this.customerNameEl.textContent = AppState.selectedCustomer.name;
        this.customerMobileEl.innerHTML = AppState.selectedCustomer.mobiles.map(mobile => `${mobile} ${AppState.selectedCustomer.mobiles.length > 1 ? ', ' : ''}`).join('');

        if (AppState.selectedCustomer.cars) {

            // builds list options inside select
            this.buildSelectOptions();
            this.buildInvoiceList('All');

        }
    }

    buildSelectOptions() {

        this.regSelectInput.innerHTML = '';

        AppState.selectedCustomer.cars.forEach((car, index) => {
            if (!index) {
                this.selectedCar = car;
                this.buildSelectYearOptions(car);
            }

            this.regSelectInput.insertAdjacentHTML('beforeend', `<option value="${car.reg}">${car.reg.toUpperCase()}</option>`);
        });
    }

    buildSelectYearOptions(car) {

        if (!car.invoices) return;

        const uniqueYears = ['All', ...new Set(car.invoices.map(inv => inv.date.split('/')[2]))];
        this.yearSelectInput.innerHTML = '';

        uniqueYears.forEach(year => {
            this.yearSelectInput.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
        });
    }

    buildInvoiceList(selectedYear = 'All',) {
        this.invoiceListContainer.innerHTML = '';
        this.invoiceListContainer.style.padding = '0px';
        let invoices = [];



        invoices = AppState.selectedCustomer.cars.find(car => car.reg === this.selectedCar.reg).invoices;
        if (selectedYear !== 'All' && invoices) {
            invoices = this.selectedCar.invoices.filter(inv => inv.date.split('/')[2] === this.selectedYear);
        }


        if (invoices) {
            this.invoiceListContainer.style.padding = '14px';

            invoices.slice().reverse().forEach(invoice => {

                this.invoiceListContainer.insertAdjacentHTML('beforeend', `<div class='invoice-finder-item' id=${invoice.invoiceId}> <p >Date: ${invoice.date}</P> <P>Total Parts: ${invoice.totals.totalParts.toFixed(2)}</p>  <p>Total Labour: ${invoice.totals.totalLabour.toFixed(2)}</p> <p>Final Total: ${invoice.totals.finalTotal.toFixed(2)}</p> </div>`)
                // view invoice button and functioanaliy 
                const viewInvoiceBtn = document.createElement('button');
                viewInvoiceBtn.textContent = 'View Invoice';
                viewInvoiceBtn.addEventListener('click', () => {
                    this.currentPanel = 'invoice-finder-customer-panel';
                    this.renderInvoiceToTable(invoice);
                    // Update the date display
                    const dateDisplay = document.querySelector("[data-date]");
                    dateDisplay.textContent = invoice.date;
                });

                document.getElementById(invoice.invoiceId).appendChild(viewInvoiceBtn);

                // delete invoice button and functionality
                const deleteInvoiceBtn = document.createElement('button');
                deleteInvoiceBtn.textContent = 'Delete Invoice';
                deleteInvoiceBtn.style.backgroundColor = 'red';
                deleteInvoiceBtn.style.float = 'right';
                deleteInvoiceBtn.addEventListener('click', () => {

                    const index = invoices.findIndex(inv => inv.invoiceId === invoice.invoiceId);
                    invoices.splice(index, 1);
                    this.customerDb.updateDb();
                    document.getElementById(invoice.invoiceId).remove();
                });
                document.getElementById(invoice.invoiceId).appendChild(deleteInvoiceBtn);
            });
        }

    }

    renderInvoiceToTable(invoice) {
        AppState.selectedInvoiceId = invoice.invoiceId;

        // Clear existing table rows
        this.invoiceTable.clearInvoiceData();


        // Populate table with invoice data
        invoice.tableRows.forEach(rowData => {
            const newRow = new Row(this.invoiceTable);
            newRow.qtyTextArea.value = rowData.qty || '';
            newRow.descTextArea.value = rowData.description;
            newRow.itemPartsInput.value = rowData.parts;
            newRow.itemLaborInput.value = rowData.labor;
            newRow.updateAmount(+rowData.parts, false);
            newRow.updateAmount(+rowData.labor, true);
            this.invoiceTable.rowArray.push(newRow);
        });

        // Update totals display
        this.invoiceTable.calcTypeTotal(null, true);

        // Update input fields in invoice-info-container
        const customerDetailsInput = document.querySelector("[data-customer-details-input]");
        const carDetailsInputs = document.querySelectorAll("[data-info-val]");

        customerDetailsInput.value = `${AppState.selectedCustomer.name}\n${AppState.selectedCustomer.address}\nMobile:${AppState.selectedCustomer.mobiles[0]}`;

        if (this.selectedCar) {
            carDetailsInputs[0].value = this.selectedCar.car || '';
            carDetailsInputs[1].value = invoice.mileage || '';
            carDetailsInputs[2].value = this.selectedCar.reg || '';
        }
    }


    clearList() {
        this.customerListContainer.innerHTML = '';
        this.invoiceListContainer.style.padding = '0px';
    }
}


class CustomerDB {

    constructor() {
        this.dB = this.getCustomerDB();
    }

    getCustomerDB() {
        if (!localStorage.getItem("customerDB")) {
            localStorage.setItem("customerDB", JSON.stringify([]));
        }
        return JSON.parse(localStorage.getItem("customerDB"));
    }

    addCustomerInvoice(invoiceData) {

        let customerCar;

        this.dB.forEach(customer => {

            // find the customer in the customer book
            if (customer.name === AppState.selectedCustomer.name
                && customer.mobiles[0] === AppState.selectedCustomer.mobiles[0]) {

                customer.cars.find(car => {
                    if (car.reg === invoiceData.reg) {
                        customerCar = car
                    }
                });
            }
        });


        if (!customerCar) {
            prompt("Customer car not found. failed to save");
            return;
        }


        if (customerCar && customerCar.invoices) {
            // check if the invoice already exists for this car
            const invoiceIndex = customerCar.invoices.findIndex(invoice => invoice.invoiceId === AppState.selectedInvoiceId);


            if (invoiceIndex !== -1) {
                customerCar.invoices[invoiceIndex] = invoiceData;
            }
            else {

                customerCar.invoices.push(invoiceData);
            }

        }
        else {
            customerCar.invoices = [invoiceData];
        }

        this.updateDb();

    }

    addNewCustomer() {
        this.dB.push(AppState.selectedCustomer);
        this.updateDb();
    }

    updateDb() {
        localStorage.setItem("customerDB", JSON.stringify(this.dB))
    }
}



new Init();

// bugs
// when a field is left black in invoice settings the blank field is appied causing errors


// feature to add
// add total income for the month  by adding all final total bills disply in table






function generateRandomString() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

















// #search-list
// .TEMPLATE-vechile-details
// .customer-form-panel
// .customer-book-form-input
// .customer-book-details
// .customer-mobiles-list
// .customer-address-value
// .customer-book-vechile-details
// .customer-update-detail-panel
// .customer-mobile-form
// .customer-car-form
// .customer-update-name-form
// .customer-book-warning-panel
// .warning-heading
// .warning-info
// .comfirm-btn
// .add-new-customer-btn
// .back-btn
// .add-customer-btn
// .customer-item
// .update-btn
// .add-mobile-btn
// .add-car-btn
// .update-name-btn
// .submit-update-form
// .delete-btn
// .vechile-details-item-holder
// .vechile-reg-value
// .vechile-name-value
// .vechile-detail-type
// .customer-mobile-number
// .invoice-finder-item
// .invoice-finder-item-info
// .invoice-finder-item-open-btn
// #invoice-finder-panel-backdrop
// #invoice-finder-panel
// #search-type-dropdown
// #close-finder-pannel-btn
// #invoice-finder-customer-search
// #invoice-finder-customer-list
// #invoice-search-panel
// #invoice-finder-customer-panel
// #invoice-finder-invoice-list
// #invoice-finder-customer-panel-back
// #invoice-finder-customer-panel-reg-dropdown
// [data-id="invoice-finder-customer-panel-year-dropdown"]
// .TEMPLATE-invoice-finder-item
// #invoice-finder-customer-panel-name
// #invoice-finder-customer-panel-mobile








