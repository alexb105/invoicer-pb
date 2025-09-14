// Analytics Module - Monthly Profit Breakdown
export class Analytics {
    constructor(customerDb) {
        this.customerDb = customerDb;
        this.analyticsData = null;
        this.init();
    }

    init() {
        this.calculateAnalytics();
    }

    // Calculate monthly profit breakdown from all invoice data
    calculateAnalytics() {
        const allInvoices = this.getAllInvoices();
        this.analyticsData = this.processInvoicesByMonth(allInvoices);
        return this.analyticsData;
    }

    // Extract all invoices from customer database
    getAllInvoices() {
        const allInvoices = [];
        
        this.customerDb.dB.forEach(customer => {
            if (customer.cars && Array.isArray(customer.cars)) {
                customer.cars.forEach(car => {
                    if (car.invoices && Array.isArray(car.invoices)) {
                        car.invoices.forEach(invoice => {
                            // Add customer and car info to invoice for context
                            allInvoices.push({
                                ...invoice,
                                customerName: customer.name,
                                carReg: car.reg,
                                carMake: car.car
                            });
                        });
                    }
                });
            }
        });
        return allInvoices;
    }

    // Process invoices and group by month
    processInvoicesByMonth(invoices) {
        const monthlyData = {};
        let totalProfit = 0;
        let totalInvoices = 0;

        invoices.forEach(invoice => {
            const date = this.parseDate(invoice.date);
            
            if (!date) {
                return; // Skip invalid dates
            }

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    monthName,
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    totalLabour: 0,
                    totalParts: 0,
                    finalTotal: 0,
                    invoiceCount: 0,
                    invoices: []
                };
            }

            // Add invoice data to month
            monthlyData[monthKey].totalLabour += invoice.totals.totalLabour || 0;
            monthlyData[monthKey].totalParts += invoice.totals.totalParts || 0;
            monthlyData[monthKey].finalTotal += invoice.totals.finalTotal || 0;
            monthlyData[monthKey].invoiceCount += 1;
            monthlyData[monthKey].invoices.push(invoice);

            totalProfit += invoice.totals.finalTotal || 0;
            totalInvoices += 1;
        });

        // Convert to array and sort by date (newest first)
        const sortedMonths = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

        // Calculate separate totals for parts and labour
        let totalParts = 0;
        let totalLabour = 0;
        
        sortedMonths.forEach(month => {
            totalParts += month.totalParts;
            totalLabour += month.totalLabour;
        });

        return {
            monthlyBreakdown: sortedMonths,
            summary: {
                totalProfit,
                totalParts,
                totalLabour,
                totalInvoices,
                averageInvoiceValue: totalInvoices > 0 ? totalProfit / totalInvoices : 0,
                averagePartsValue: totalInvoices > 0 ? totalParts / totalInvoices : 0,
                averageLabourValue: totalInvoices > 0 ? totalLabour / totalInvoices : 0,
                monthsWithData: sortedMonths.length
            }
        };
    }

    // Parse date string (handles DD/MM/YYYY and MM/DD/YYYY formats)
    parseDate(dateString) {
        if (!dateString) return null;
        
        // Handle DD/MM/YYYY or MM/DD/YYYY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const part1 = parseInt(parts[0]);
            const part2 = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            // Determine if it's DD/MM/YYYY or MM/DD/YYYY
            // If first part > 12, it's definitely DD/MM/YYYY
            // If second part > 12, it's definitely MM/DD/YYYY
            // Otherwise, we'll assume DD/MM/YYYY (more common in UK/Europe)
            let day, month;
            
            if (part1 > 12) {
                // Definitely DD/MM/YYYY
                day = part1;
                month = part2 - 1; // JavaScript months are 0-indexed
            } else if (part2 > 12) {
                // Definitely MM/DD/YYYY
                month = part1 - 1; // JavaScript months are 0-indexed
                day = part2;
            } else {
                // Ambiguous case - assume DD/MM/YYYY (UK format)
                day = part1;
                month = part2 - 1; // JavaScript months are 0-indexed
            }
            
            // Validate date
            if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year > 1900) {
                return new Date(year, month, day);
            }
        }
        
        // Try parsing as ISO date or other formats
        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Get analytics data (recalculate if needed)
    getAnalyticsData() {
        if (!this.analyticsData) {
            this.calculateAnalytics();
        }
        return this.analyticsData;
    }

    // Get analytics data filtered by year
    getAnalyticsDataByYear(year) {
        const allData = this.getAnalyticsData();
        const filteredMonths = allData.monthlyBreakdown.filter(month => month.year === year);
        
        // Recalculate summary for filtered data
        let totalProfit = 0;
        let totalParts = 0;
        let totalLabour = 0;
        let totalInvoices = 0;
        
        filteredMonths.forEach(month => {
            totalProfit += month.finalTotal;
            totalParts += month.totalParts;
            totalLabour += month.totalLabour;
            totalInvoices += month.invoiceCount;
        });

        return {
            monthlyBreakdown: filteredMonths,
            summary: {
                totalProfit,
                totalParts,
                totalLabour,
                totalInvoices,
                averageInvoiceValue: totalInvoices > 0 ? totalProfit / totalInvoices : 0,
                averagePartsValue: totalInvoices > 0 ? totalParts / totalInvoices : 0,
                averageLabourValue: totalInvoices > 0 ? totalLabour / totalInvoices : 0,
                monthsWithData: filteredMonths.length
            }
        };
    }

    // Get monthly breakdown for display
    getMonthlyBreakdown() {
        const data = this.getAnalyticsData();
        return data.monthlyBreakdown;
    }

    // Get summary statistics
    getSummary() {
        const data = this.getAnalyticsData();
        return data.summary;
    }

    // Get profit trend (comparing consecutive months)
    getProfitTrend() {
        const monthlyData = this.getMonthlyBreakdown();
        const trends = [];

        for (let i = 0; i < monthlyData.length - 1; i++) {
            const currentMonth = monthlyData[i];
            const previousMonth = monthlyData[i + 1];
            
            const change = currentMonth.finalTotal - previousMonth.finalTotal;
            const percentageChange = previousMonth.finalTotal > 0 
                ? (change / previousMonth.finalTotal) * 100 
                : 0;

            trends.push({
                month: currentMonth.monthName,
                change,
                percentageChange,
                direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
            });
        }

        return trends;
    }

    // Refresh analytics data (useful when new invoices are added)
    refresh() {
        this.analyticsData = null;
        return this.calculateAnalytics();
    }
}
