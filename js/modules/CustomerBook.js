import { AppState } from './AppState.js';
import { generateRandomString } from './utils.js';

// Customer Book Module
export class CustomerBook {


    constructor(invoiceTable, customerDb, customerSelectionManager) {
        this.invoiceTable = invoiceTable;
        this.customerSelectionManager = customerSelectionManager;
        this.customerBookEl = document.querySelector(".customer-book");
        this.customerDb = customerDb;
        this.customerList = document.querySelector(".customer-list");
        this.customerItemList = this.customerList.getElementsByClassName("customer-item");
        this.searchListInput = document.querySelector("#search-list");
        this.carItemTemplate = document.querySelector(".TEMPLATE-vechile-details");
        this.currentCustomerIndex;
        
        // Modal elements
        this.modalBackdrop = document.querySelector("#customer-book-modal-backdrop");
        this.openModalBtn = document.querySelector("#btn-open-customer-book");
        this.closeModalBtn = document.querySelector("#close-customer-book-modal");
        
        this.customerFormConnections();
        this.customerBookDetailsConnections();
        this.updateOptionsPanelConnections();
        this.warningPanelConnections();
        this.buildCustomerList();
        this.connectListeners();
        this.connectModalListeners();
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
            Array.from(this.customerItemList).forEach(cust => {
                const customerName = cust.querySelector('.customer-name');
                if (customerName && customerName.textContent.toLowerCase().includes(this.searchListInput.value.toLowerCase())) {
                    cust.classList.remove("hide");
                } else {
                    cust.classList.add("hide");
                }
            });
        })
    }

    connectModalListeners() {
        // Open modal
        this.openModalBtn.addEventListener("click", () => {
            this.modalBackdrop.classList.remove("hide");
        });

        // Close modal
        this.closeModalBtn.addEventListener("click", () => {
            this.modalBackdrop.classList.add("hide");
        });

        // Close modal when clicking backdrop
        this.modalBackdrop.addEventListener("click", (e) => {
            if (e.target === this.modalBackdrop) {
                this.modalBackdrop.classList.add("hide");
            }
        });

        // Close modal with Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !this.modalBackdrop.classList.contains("hide")) {
                this.modalBackdrop.classList.add("hide");
            }
        });
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
            const newCustomer = this.constructCustomerObj();
            this.customerDb.addNewCustomer();
            this.constructCustomerEl(newCustomer, this.customerDb.dB.length - 1);
            this.hideSelectedEl(e.target, "book-panel");
            this.clearFormInputs(this.customerFormInputs);

            // Set customer selection using the manager
            this.customerSelectionManager.onCustomerSelected(newCustomer);

            this.invoiceTable.carDetailsInput[0].value = newCustomer.cars[0].car;
            this.invoiceTable.carDetailsInput[2].value = newCustomer.cars[0].reg;
            const mobileNumber = newCustomer.mobiles && newCustomer.mobiles.length > 0 ? newCustomer.mobiles[0] : 'No mobile';
            this.invoiceTable.customerDetailsInput.value = `${newCustomer.name}                            ${newCustomer.address}                                Mobile:${mobileNumber}`;

            this.flashCustomerInputs();
            // Initialize invoice table for the new customer
            this.invoiceTable.initializeForCustomer();
            // Close the modal after adding customer and filling details
            this.modalBackdrop.classList.add("hide");
        }

        // Handle customer item clicks (including clicks on child elements)
        const customerItem = e.target.closest('.customer-item');
        if (customerItem) {
            // Remove selected class from all customer items
            Array.from(this.customerItemList).forEach(item => {
                item.classList.remove("selected");
            });
            
            // Add selected class to clicked item
            customerItem.classList.add("selected");
            
            this.customerBookDetails.classList.remove("hide");
            this.currentCustomerIndex = customerItem.dataset.index;
            const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
            this.displayCustomerInfo();
        }

        // Select for Invoice button removed - customers select by clicking on cars

        if (e.target.classList[0] === "update-btn") {
            this.updateOptionPanel.classList.remove("hide")
        }

        if (e.target.classList[0] === "add-mobile-btn") {
            // Check if customer already has a mobile number
            const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
            if (selectedCustomer.mobiles && selectedCustomer.mobiles.length > 0) {
                // Customer already has a mobile, show update form instead
                this.showSlectedForm("customer-mobile-form", this.updateFormDb.mobile);
                // Pre-fill the form with existing mobile number
                const mobileInput = this.updateFormDb.mobile.querySelector('input');
                if (mobileInput) {
                    mobileInput.value = selectedCustomer.mobiles[0];
                }
            } else {
                // Customer has no mobile, show add form
                this.showSlectedForm("customer-mobile-form", this.updateFormDb.mobile);
            }
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

        // Handle vehicle edit button click
        if (e.target.classList.contains("vechile-edit-btn")) {
            e.stopPropagation(); // Prevent triggering the vehicle selection
            const vehicleHolder = e.target.closest(".vechile-details-item-holder");
            const carIndex = vehicleHolder.dataset.index;
            this.editVehicle(carIndex);
            return;
        }

        // Handle vehicle delete button click
        if (e.target.classList.contains("vechile-delete-btn")) {
            e.stopPropagation(); // Prevent triggering the vehicle selection
            const vehicleHolder = e.target.closest(".vechile-details-item-holder");
            const carIndex = vehicleHolder.dataset.index;
            this.deleteVehicle(carIndex);
            return;
        }

        // Handle mobile edit button click
        if (e.target.classList.contains("mobile-edit-btn")) {
            e.stopPropagation(); // Prevent triggering the mobile selection
            const mobileHolder = e.target.closest(".customer-mobile-number");
            const mobileIndex = mobileHolder.dataset.index;
            this.editMobile(mobileIndex);
            return;
        }

        // Handle mobile delete button click
        if (e.target.classList.contains("mobile-delete-btn")) {
            e.stopPropagation(); // Prevent triggering the mobile selection
            const mobileHolder = e.target.closest(".customer-mobile-number");
            const mobileIndex = mobileHolder.dataset.index;
            this.deleteMobile(mobileIndex);
            return;
        }

        // run this block when user clicks on the vechile details item (but not the buttons)
        if (e.target.classList[0] === "vechile-details-item-holder"
            || e.target.classList[0] === "vechile-reg-value"
            || e.target.classList[0] === "vechile-name-value"
            || e.target.classList[0] === "vechile-detail-type"
            || e.target.classList[0] === "vechile-info") {

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

            // Get the selected customer
            const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
            
            // Set customer selection using the manager
            this.customerSelectionManager.onCustomerSelected(selectedCustomer);

            // Fill car details
            this.invoiceTable.carDetailsInput[0].value = selectedCustomer.cars[carIndex].car;
            this.invoiceTable.carDetailsInput[2].value = selectedCustomer.cars[carIndex].reg;

            // Fill customer details automatically (name, address, and first mobile)
            const mobileNumber = selectedCustomer.mobiles && selectedCustomer.mobiles.length > 0 ? selectedCustomer.mobiles[0] : 'No mobile';
            this.invoiceTable.customerDetailsInput.value = `${selectedCustomer.name}                            ${selectedCustomer.address}                                Mobile:${mobileNumber}`;

            this.flashCustomerInputs();
            // Initialize invoice table for the selected customer
            this.invoiceTable.initializeForCustomer();

            // Close the modal after filling details
            this.modalBackdrop.classList.add("hide");

        }

        // Mobile number click handler removed - mobile numbers are no longer clickable
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
        // Double-click functionality removed - now using edit/delete buttons
        // Keeping this method for potential future use or mobile number deletion
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
            // Replace the mobile number instead of adding a new one
            this.customerDb.dB[this.currentCustomerIndex].mobiles = [inputs[0].value];
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
            const customerItem = Array.from(this.customerItemList)[this.currentCustomerIndex];
            const customerName = customerItem.querySelector('.customer-name');
            if (customerName) {
                customerName.textContent = inputs[0].value;
            }
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
        
        // Create customer name element
        const customerName = document.createElement("span");
        customerName.className = "customer-name";
        customerName.textContent = customerObj.name;
        
        // Calculate total invoices for this customer
        const totalInvoices = this.getCustomerTotalInvoices(customerObj);
        
        // Create loyalty indicator
        const loyaltyIndicator = document.createElement("span");
        loyaltyIndicator.className = "loyalty-indicator";
        loyaltyIndicator.textContent = this.getLoyaltyText(totalInvoices);
        loyaltyIndicator.title = `${totalInvoices} invoice${totalInvoices !== 1 ? 's' : ''} total`;
        
        // Append name and loyalty indicator to customer item
        customerItem.appendChild(customerName);
        customerItem.appendChild(loyaltyIndicator);
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
        const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
        this.customerBookName.textContent = selectedCustomer.name;
        this.customerAddressValue.textContent = selectedCustomer.address;

        // Only show the first mobile number (limit to one)
        if (selectedCustomer.mobiles && selectedCustomer.mobiles.length > 0 && selectedCustomer.mobiles[0]) {
            const mobileEl = document.createElement("li");
            mobileEl.className = "customer-mobile-number";
            mobileEl.dataset.index = 0;
            
            // Create mobile info container
            const mobileInfo = document.createElement("div");
            mobileInfo.className = "mobile-info";
            mobileInfo.textContent = `Mobile: ${selectedCustomer.mobiles[0]}`;
            
            // Create mobile actions container
            const mobileActions = document.createElement("div");
            mobileActions.className = "mobile-actions";
            
            // Create edit button
            const editBtn = document.createElement("button");
            editBtn.className = "mobile-edit-btn";
            editBtn.title = "Edit Mobile";
            editBtn.textContent = "✏️";
            
            // Create delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "mobile-delete-btn";
            deleteBtn.title = "Delete Mobile";
            deleteBtn.textContent = "🗑️";
            
            // Append buttons to actions container
            mobileActions.appendChild(editBtn);
            mobileActions.appendChild(deleteBtn);
            
            // Append info and actions to mobile element
            mobileEl.appendChild(mobileInfo);
            mobileEl.appendChild(mobileActions);
            
            this.customerMobileList.appendChild(mobileEl);
        }

        selectedCustomer.cars.forEach((car, index) => {
            const carTemp = document.importNode(this.carItemTemplate.content, true);
            this.customerVechielList.appendChild(carTemp);
            const carItemEl = this.customerVechielList.lastElementChild;
            carItemEl.dataset.index = index;

            carItemEl.querySelector(".vechile-name-value").textContent = car.car;
            carItemEl.querySelector(".vechile-reg-value").textContent = car.reg;
        });
    }

    editVehicle(carIndex) {
        const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
        const car = selectedCustomer.cars[carIndex];
        const newCarName = prompt("Edit vehicle name:", car.car);
        const newCarReg = prompt("Edit vehicle registration:", car.reg);
        
        if (newCarName !== null && newCarReg !== null) {
            selectedCustomer.cars[carIndex].car = newCarName;
            selectedCustomer.cars[carIndex].reg = newCarReg;
            this.customerDb.updateDb();
            
            // Refresh the display
            this.clearCustomerDetailsPanel();
            this.displayCustomerInfo();
        }
    }

    deleteVehicle(carIndex) {
        const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
        const car = selectedCustomer.cars[carIndex];
        const confirmDelete = confirm(`Are you sure you want to delete vehicle: ${car.car} (${car.reg})?`);
        
        if (confirmDelete) {
            selectedCustomer.cars.splice(carIndex, 1);
            this.customerDb.updateDb();
            
            // Refresh the display
            this.clearCustomerDetailsPanel();
            this.displayCustomerInfo();
        }
    }

    editMobile(mobileIndex) {
        const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
        const mobile = selectedCustomer.mobiles[0]; // Always use first mobile
        const newMobile = prompt("Edit mobile number:", mobile);
        
        if (newMobile !== null && newMobile.trim() !== "") {
            selectedCustomer.mobiles[0] = newMobile.trim();
            this.customerDb.updateDb();
            
            // Refresh the display
            this.clearCustomerDetailsPanel();
            this.displayCustomerInfo();
        }
    }

    deleteMobile(mobileIndex) {
        const selectedCustomer = this.customerDb.dB[this.currentCustomerIndex];
        const mobile = selectedCustomer.mobiles[0]; // Always use first mobile
        const confirmDelete = confirm(`Are you sure you want to delete mobile number: ${mobile}?`);
        
        if (confirmDelete) {
            selectedCustomer.mobiles = []; // Clear the mobile array
            this.customerDb.updateDb();
            
            // Refresh the display
            this.clearCustomerDetailsPanel();
            this.displayCustomerInfo();
        }
    }

    getCustomerTotalInvoices(customerObj) {
        let totalInvoices = 0;
        if (customerObj.cars && Array.isArray(customerObj.cars)) {
            customerObj.cars.forEach(car => {
                if (car.invoices && Array.isArray(car.invoices)) {
                    totalInvoices += car.invoices.length;
                }
            });
        }
        return totalInvoices;
    }

    getLoyaltyText(invoiceCount) {
        if (invoiceCount === 0) {
            return "🆕"; // New customer
        } else if (invoiceCount >= 1 && invoiceCount <= 2) {
            return "⭐"; // 1-2 invoices
        } else if (invoiceCount >= 3 && invoiceCount <= 5) {
            return "⭐⭐"; // 3-5 invoices
        } else if (invoiceCount >= 6 && invoiceCount <= 10) {
            return "⭐⭐⭐"; // 6-10 invoices
        } else {
            return "👑"; // 10+ invoices - VIP
        }
    }
}
