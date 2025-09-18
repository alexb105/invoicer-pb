import { AppState } from './AppState.js';

// Customer Database Module
export class CustomerDB {

    constructor() {
        this.dB = [];
        this.isLoaded = false;
        this.loadCustomerData();
    }

    async loadCustomerData() {
        try {
            // First check if we have data in localStorage
            const localData = localStorage.getItem("customerDB");
            if (localData) {
                const parsedData = JSON.parse(localData);
                if (parsedData.length > 0) {
                    this.dB = parsedData;
                    this.isLoaded = true;
                    console.log('CustomerDB: Loaded', this.dB.length, 'customers from localStorage');
                    return;
                }
            }

            // If no localStorage data, try to load from JSON file
            console.log('CustomerDB: No localStorage data, attempting to load from JSON file...');
            const response = await fetch('./customer data for app.json');
            if (response.ok) {
                const jsonData = await response.json();
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    this.dB = jsonData;
                    this.isLoaded = true;
                    // Save to localStorage for future use
                    localStorage.setItem("customerDB", JSON.stringify(jsonData));
                    console.log('CustomerDB: Loaded', this.dB.length, 'customers from JSON file');
                    return;
                }
            }
            
            // If both fail, initialize with empty array
            console.warn('CustomerDB: Could not load customer data from localStorage or JSON file');
            this.dB = [];
            this.isLoaded = true;
            localStorage.setItem("customerDB", JSON.stringify([]));
            
        } catch (error) {
            console.error('CustomerDB: Error loading customer data:', error);
            this.dB = [];
            this.isLoaded = true;
            localStorage.setItem("customerDB", JSON.stringify([]));
        }
    }

    // Wait for data to be loaded
    async waitForLoad() {
        if (this.isLoaded) return;
        
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (this.isLoaded) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    getCustomerDB() {
        return this.dB;
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
