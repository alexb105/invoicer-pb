import { AppState } from './AppState.js';

// Customer Database Module
export class CustomerDB {

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
