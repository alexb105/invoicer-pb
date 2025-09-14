// Analytics Panel Module - UI for displaying analytics
export class AnalyticsPanel {
    constructor(analytics) {
        this.analytics = analytics;
        this.isVisible = false;
        this.createPanel();
        this.connectListeners();
    }

    createPanel() {
        // Create the analytics panel HTML structure
        const panelHTML = `
            <div id="analytics-panel-backdrop" class="modal-backdrop hide">
                <div id="analytics-panel" class="customer-book-modal">
                    <div class="modal-header">
                        <h3>Analytics Dashboard</h3>
                        <button id="close-analytics-panel" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="analytics-content">
                        <div class="analytics-filters">
                            <div class="year-filter">
                                <label for="year-dropdown">📅 Filter by Year:</label>
                                <select id="year-dropdown" class="year-dropdown">
                                    <option value="all">All Years</option>
                                </select>
                            </div>
                        </div>
                        <div class="analytics-summary">
                            <div class="summary-card">
                                <h4>Total Profit</h4>
                                <div class="summary-value" id="total-profit">£0.00</div>
                            </div>
                            <div class="summary-card">
                                <h4>Total Parts</h4>
                                <div class="summary-value parts-value" id="total-parts">£0.00</div>
                            </div>
                            <div class="summary-card">
                                <h4>Total Labour</h4>
                                <div class="summary-value labour-value" id="total-labour">£0.00</div>
                            </div>
                            <div class="summary-card">
                                <h4>Total Invoices</h4>
                                <div class="summary-value" id="total-invoices">0</div>
                            </div>
                            <div class="summary-card">
                                <h4>Average Invoice</h4>
                                <div class="summary-value" id="average-invoice">£0.00</div>
                            </div>
                            <div class="summary-card">
                                <h4>Active Months</h4>
                                <div class="summary-value" id="active-months">0</div>
                            </div>
                        </div>
                        
                        <div class="analytics-section">
                            <h4>📈 Monthly Breakdown</h4>
                            <div class="monthly-breakdown" id="monthly-breakdown">
                                <!-- Monthly data will be populated here -->
                            </div>
                        </div>

                        <div class="analytics-section">
                            <h4>📊 Profit Trends</h4>
                            <div class="profit-trends" id="profit-trends">
                                <!-- Trend data will be populated here -->
                            </div>
                        </div>

                        <div class="analytics-actions">
                            <button id="refresh-analytics" class="analytics-btn">🔄 Refresh Data</button>
                            <button id="export-analytics" class="analytics-btn">📤 Export Report</button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert the panel into the body
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        
        // Store references to elements
        this.panelBackdrop = document.getElementById('analytics-panel-backdrop');
        this.panel = document.getElementById('analytics-panel');
        this.closeBtn = document.getElementById('close-analytics-panel');
        this.refreshBtn = document.getElementById('refresh-analytics');
        this.exportBtn = document.getElementById('export-analytics');
        this.yearDropdown = document.getElementById('year-dropdown');
    }

    connectListeners() {
        // Close panel
        this.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Close panel when clicking backdrop
        this.panelBackdrop.addEventListener('click', (e) => {
            if (e.target === this.panelBackdrop) {
                this.hide();
            }
        });

        // Close panel with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Refresh analytics
        this.refreshBtn.addEventListener('click', () => {
            this.refresh();
        });

        // Export analytics
        this.exportBtn.addEventListener('click', () => {
            this.exportReport();
        });

        // Year filter
        this.yearDropdown.addEventListener('change', () => {
            this.filterByYear();
        });
    }

    show() {
        this.panelBackdrop.classList.remove('hide');
        this.isVisible = true;
        this.populateYearDropdown();
        this.updateDisplay();
    }

    hide() {
        this.panelBackdrop.classList.add('hide');
        this.isVisible = false;
    }

    populateYearDropdown() {
        const analyticsData = this.analytics.getAnalyticsData();
        const years = new Set();
        
        // Extract all unique years from the data
        analyticsData.monthlyBreakdown.forEach(month => {
            years.add(month.year);
        });
        
        // Clear existing options except "All Years"
        this.yearDropdown.innerHTML = '<option value="all">All Years</option>';
        
        // Add year options (sorted descending)
        Array.from(years).sort((a, b) => b - a).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearDropdown.appendChild(option);
        });
    }

    filterByYear() {
        const selectedYear = this.yearDropdown.value;
        let analyticsData;
        
        if (selectedYear === 'all') {
            analyticsData = this.analytics.getAnalyticsData();
        } else {
            analyticsData = this.analytics.getAnalyticsDataByYear(parseInt(selectedYear));
        }
        
        this.updateSummary(analyticsData.summary);
        this.updateMonthlyBreakdown(analyticsData.monthlyBreakdown);
        this.updateProfitTrends();
    }

    updateDisplay() {
        const analyticsData = this.analytics.getAnalyticsData();
        this.updateSummary(analyticsData.summary);
        this.updateMonthlyBreakdown(analyticsData.monthlyBreakdown);
        this.updateProfitTrends();
    }

    updateSummary(summary) {
        document.getElementById('total-profit').textContent = `£${summary.totalProfit.toFixed(2)}`;
        document.getElementById('total-parts').textContent = `£${summary.totalParts.toFixed(2)}`;
        document.getElementById('total-labour').textContent = `£${summary.totalLabour.toFixed(2)}`;
        document.getElementById('total-invoices').textContent = summary.totalInvoices;
        document.getElementById('average-invoice').textContent = `£${summary.averageInvoiceValue.toFixed(2)}`;
        document.getElementById('active-months').textContent = summary.monthsWithData;
    }

    updateMonthlyBreakdown(monthlyData) {
        const container = document.getElementById('monthly-breakdown');
        
        if (monthlyData.length === 0) {
            container.innerHTML = '<p class="no-data">No invoice data available</p>';
            return;
        }

        const breakdownHTML = monthlyData.map(month => {
            const profitChange = this.getProfitChangeIndicator(month);
            return `
                <div class="month-card">
                    <div class="month-header">
                        <h5>${month.monthName}</h5>
                        <span class="profit-indicator ${profitChange.class}">${profitChange.icon}</span>
                    </div>
                    <div class="month-stats">
                        <div class="stat-item total-profit">
                            <span class="stat-label">Total Profit:</span>
                            <span class="stat-value">£${month.finalTotal.toFixed(2)}</span>
                        </div>
                        <div class="stat-item parts-breakdown">
                            <span class="stat-label">🔧 Parts:</span>
                            <span class="stat-value parts-value">£${month.totalParts.toFixed(2)}</span>
                        </div>
                        <div class="stat-item labour-breakdown">
                            <span class="stat-label">⚡ Labour:</span>
                            <span class="stat-value labour-value">£${month.totalLabour.toFixed(2)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">📄 Invoices:</span>
                            <span class="stat-value">${month.invoiceCount}</span>
                        </div>
                    </div>
                    <div class="month-details">
                        <button class="view-details-btn" data-month="${month.monthName}">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = breakdownHTML;

        // Add click listeners to detail buttons
        container.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const monthName = e.target.dataset.month;
                this.showMonthDetails(monthName, monthlyData);
            });
        });
    }

    updateProfitTrends() {
        const trends = this.analytics.getProfitTrend();
        const container = document.getElementById('profit-trends');
        
        if (trends.length === 0) {
            container.innerHTML = '<p class="no-data">Not enough data for trend analysis</p>';
            return;
        }

        const trendsHTML = trends.map(trend => {
            const changeClass = trend.direction === 'up' ? 'trend-up' : 
                               trend.direction === 'down' ? 'trend-down' : 'trend-stable';
            const changeIcon = trend.direction === 'up' ? '📈' : 
                              trend.direction === 'down' ? '📉' : '➡️';
            
            return `
                <div class="trend-item ${changeClass}">
                    <div class="trend-month">${trend.month}</div>
                    <div class="trend-change">
                        <span class="trend-icon">${changeIcon}</span>
                        <span class="trend-amount">£${Math.abs(trend.change).toFixed(2)}</span>
                        <span class="trend-percentage">(${trend.percentageChange.toFixed(1)}%)</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = trendsHTML;
    }

    getProfitChangeIndicator(month) {
        // This is a simplified version - in a real app you'd compare with previous month
        const avgProfit = month.finalTotal / month.invoiceCount;
        
        if (avgProfit > 200) {
            return { class: 'excellent', icon: '🚀' };
        } else if (avgProfit > 100) {
            return { class: 'good', icon: '📈' };
        } else if (avgProfit > 50) {
            return { class: 'average', icon: '📊' };
        } else {
            return { class: 'low', icon: '📉' };
        }
    }

    showMonthDetails(monthName, monthlyData) {
        const month = monthlyData.find(m => m.monthName === monthName);
        if (!month) return;

        const detailsHTML = `
            <div class="month-details-modal">
                <h4>${monthName} Details</h4>
                <div class="invoice-list">
                    ${month.invoices.map(invoice => `
                        <div class="invoice-item">
                            <div class="invoice-info">
                                <strong>${invoice.customerName}</strong> - ${invoice.carMake} (${invoice.carReg})
                            </div>
                            <div class="invoice-amount">£${invoice.totals.finalTotal.toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="close-details-btn">Close</button>
            </div>
        `;

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'month-details-backdrop';
        modal.innerHTML = detailsHTML;
        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-details-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    refresh() {
        this.analytics.refresh();
        this.updateDisplay();
        
        // Show refresh feedback
        this.refreshBtn.textContent = '✅ Refreshed';
        setTimeout(() => {
            this.refreshBtn.textContent = '🔄 Refresh Data';
        }, 2000);
    }

    exportReport() {
        const selectedYear = this.yearDropdown.value;
        let analyticsData;
        
        if (selectedYear === 'all') {
            analyticsData = this.analytics.getAnalyticsData();
        } else {
            analyticsData = this.analytics.getAnalyticsDataByYear(parseInt(selectedYear));
        }
        
        const report = this.generateReport(analyticsData, selectedYear);
        
        // Create and download file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const yearSuffix = selectedYear === 'all' ? 'all-years' : selectedYear;
        a.download = `analytics-report-${yearSuffix}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateReport(analyticsData, selectedYear = 'all') {
        const { summary, monthlyBreakdown } = analyticsData;
        
        let report = 'INVOICE ANALYTICS REPORT\n';
        report += '========================\n';
        if (selectedYear !== 'all') {
            report += `Year: ${selectedYear}\n`;
        } else {
            report += 'All Years\n';
        }
        report += '\n';
        
        report += 'SUMMARY:\n';
        report += `Total Profit: £${summary.totalProfit.toFixed(2)}\n`;
        report += `Total Parts: £${summary.totalParts.toFixed(2)}\n`;
        report += `Total Labour: £${summary.totalLabour.toFixed(2)}\n`;
        report += `Total Invoices: ${summary.totalInvoices}\n`;
        report += `Average Invoice Value: £${summary.averageInvoiceValue.toFixed(2)}\n`;
        report += `Average Parts Value: £${summary.averagePartsValue.toFixed(2)}\n`;
        report += `Average Labour Value: £${summary.averageLabourValue.toFixed(2)}\n`;
        report += `Months with Data: ${summary.monthsWithData}\n\n`;
        
        report += 'MONTHLY BREAKDOWN:\n';
        report += '==================\n';
        
        monthlyBreakdown.forEach(month => {
            report += `\n${month.monthName}:\n`;
            report += `  Total Profit: £${month.finalTotal.toFixed(2)}\n`;
            report += `  Labour: £${month.totalLabour.toFixed(2)}\n`;
            report += `  Parts: £${month.totalParts.toFixed(2)}\n`;
            report += `  Invoices: ${month.invoiceCount}\n`;
        });
        
        report += `\n\nReport generated on: ${new Date().toLocaleString()}\n`;
        
        return report;
    }
}
