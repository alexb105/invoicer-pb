// Utility functions
export function generateRandomString() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function loadBusinessInfo() {
    let businessInfo;

    businessInfo = localStorage.getItem("businessInfo");
    if (businessInfo) {
        businessInfo = JSON.parse(businessInfo);

        
    }
    else {
        businessInfo = {"invoiceTitle":"","mobile":"","address":""}
    }



    localStorage.setItem("businessInfo", JSON.stringify(businessInfo));
    document.querySelector("[data-invoice-header-title]").textContent = businessInfo.invoiceTitle;
    document.querySelector("[data-invoice-mobile]").textContent = businessInfo.mobile;
    document.querySelector("[data-invoice-address]").textContent = businessInfo.address;
}
