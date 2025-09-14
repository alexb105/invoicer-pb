// Invoice Settings Module
export class InvoiceSettings {
    constructor() {
        this.instanceSettingsValues;
        this.getDomEls();
        this.connectSettingListeners();
        this.applySettings(true);
    }

    getDomEls() {
        this.settingWidget = document.querySelector(".invoice-settings");
        this.vatSettingInput = document.querySelector(".vat-setting");
        this.motSettingInput = document.querySelector(".mot-setting");
        this.globalSaveBtn = document.getElementById("global-settings-save");
        this.instanceSaveBtn = document.getElementById("instance-settings-save");
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
