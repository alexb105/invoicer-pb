import { AppState } from './AppState.js';
import { Row } from './Row.js';

// Invoice Finder Panel Module
export class InvoiceFinderPanel {

    // clear customer list when input filed is empty
    // click customer item and load up the customer invoce panel

    constructor(customerDb, invoiceTable, customerSelectionManager) {

        this.invoiceTable = invoiceTable;
        this.customerDb = customerDb;
        this.customerSelectionManager = customerSelectionManager;
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
        this.openFinderPanel = document.querySelector('#btn-open-finder-invoice-panel');
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
                    this.customerSelectionManager.onCustomerSelected(customer);
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

                    openCustomerBtn.addEventListener('click', () => this.openCustomerPanel(customer, car[0].reg));
                    this.customerListContainer.appendChild(customerHtml);
                }
            }
        });
    }

    openCustomerPanel(customer, selectedReg = null) {
        this.customerSelectionManager.onCustomerSelected(customer);

        this.invoiceSearchPanel.setAttribute('hidden', 'true');
        this.invoiceCustomerPanel.removeAttribute('hidden');

        this.customerNameEl = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-name');
        this.customerMobileEl = this.invoiceFinderPanelBackdrop.querySelector('#invoice-finder-customer-panel-mobile');

        this.customerNameEl.textContent = customer.name;
        this.customerMobileEl.innerHTML = customer.mobiles.map(mobile => `${mobile} ${customer.mobiles.length > 1 ? ', ' : ''}`).join('');

        if (customer.cars) {

            // builds list options inside select
            this.buildSelectOptions(selectedReg);
            this.buildInvoiceList('All');

        }
    }

    buildSelectOptions(selectedReg = null) {

        this.regSelectInput.innerHTML = '';

        AppState.selectedCustomer.cars.forEach((car, index) => {
            // If selectedReg is provided, select that car; otherwise select the first car
            if ((selectedReg && car.reg === selectedReg) || (!selectedReg && !index)) {
                this.selectedCar = car;
                this.buildSelectYearOptions(car);
            }

            // Create option element and set selected attribute if this is the car to select
            const isSelected = (selectedReg && car.reg === selectedReg) || (!selectedReg && !index);
            this.regSelectInput.insertAdjacentHTML('beforeend', `<option value="${car.reg}" ${isSelected ? 'selected' : ''}>${car.reg.toUpperCase()}</option>`);
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
            invoices = this.selectedCar.invoices.filter(inv => inv.date.split('/')[2] === selectedYear);
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
                    const dateDisplay = document.querySelector(".date");
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
        const customerDetailsInput = document.querySelector(".customer-details-input");
        const carDetailsInputs = document.querySelectorAll(".info-val");

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
