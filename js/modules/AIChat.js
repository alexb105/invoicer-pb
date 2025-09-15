import { CustomerDB } from './CustomerDB.js';

// AI Chat Module for Invoice Data Analysis with ChatGPT Integration
export class AIChat {
    constructor() {
        this.customerDb = new CustomerDB();
        this.chatHistory = [];
        this.apiKey = this.getStoredApiKey();
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // Get API key from localStorage only (no prompt)
    getStoredApiKey() {
        return localStorage.getItem('openai_api_key');
    }

    // Get API key from localStorage or prompt user (only when needed)
    getApiKey() {
        let apiKey = this.getStoredApiKey();
        if (!apiKey) {
            apiKey = prompt('Please enter your OpenAI API key:');
            if (apiKey) {
                localStorage.setItem('openai_api_key', apiKey);
                this.apiKey = apiKey;
            }
        }
        return apiKey;
    }

    // Set API key manually
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
    }

    // Main method to process user queries and generate responses using ChatGPT
    async processQuery(query) {
        try {
            // Get API key when needed (will prompt if not set)
            const apiKey = this.getApiKey();
            if (!apiKey) {
                return "Please set your OpenAI API key to use the AI chat feature. Click the settings button to configure it.";
            }

            // Add user message to history
            this.chatHistory.push({ role: 'user', content: query });
            
            // First, try to get a comprehensive answer by analyzing the data locally
            const localAnalysis = this.analyzeQueryLocally(query);
            
            // If we have a good local analysis, use it as context for ChatGPT
            const systemMessage = localAnalysis 
                ? `You are an AI assistant for an automotive repair shop's invoice management system. 

LOCAL ANALYSIS RESULTS (REAL DATA FROM THE SYSTEM):
${localAnalysis}

USER QUESTION: ${query}

CRITICAL INSTRUCTIONS:
- ONLY use the data provided in the LOCAL ANALYSIS RESULTS above
- DO NOT make up, invent, or fabricate any customer names, phone numbers, emails, or other details
- If the data doesn't contain specific information, say "This information is not available in the current data"
- DO NOT add fictional contact details, addresses, or personal information
- Only provide insights and recommendations based on the actual data provided
- Format the response clearly with bullet points, numbers, or tables
- Be conversational but professional
- If the local analysis doesn't fully answer the question, explain what additional data would be helpful`
                : `You are an AI assistant for an automotive repair shop's invoice management system. 

USER QUESTION: ${query}

INSTRUCTIONS:
- The user is asking about their invoice/customer data
- DO NOT make up any customer names, contact details, or other information
- Provide helpful guidance on what types of analysis would be useful
- Suggest specific questions they could ask about their data
- Be conversational but professional
- Focus on automotive repair shop business insights`;

            // Prepare messages for ChatGPT
            const messages = [
                {
                    role: "system",
                    content: systemMessage
                },
                ...this.chatHistory.slice(-3) // Keep last 3 messages for context
            ];

            // Call ChatGPT API
            const response = await this.callChatGPTAPI(messages, apiKey);
            
            // Add AI response to history
            this.chatHistory.push({ role: 'assistant', content: response });
            
            return response;
        } catch (error) {
            console.error('Error processing query:', error);
            if (error.message.includes('API key')) {
                return "There's an issue with your OpenAI API key. Please check your API key in the settings.";
            }
            if (error.message.includes('context length')) {
                return "The query is too complex for the current setup. Please try asking more specific questions about your data.";
            }
            return "I'm sorry, I encountered an error while processing your request. Please try again.";
        }
    }

    // Call ChatGPT API
    async callChatGPTAPI(messages, apiKey) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Get optimized invoice data summary for ChatGPT context (reduced size)
    getInvoiceDataSummary() {
        const customers = this.customerDb.dB;
        
        // Calculate summary statistics
        let totalCustomers = customers.length;
        let totalInvoices = 0;
        let totalRevenue = 0;
        let carBrands = {};
        let serviceTypes = {};
        let recentInvoices = [];
        let topCustomers = [];

        customers.forEach(customer => {
            let customerInvoiceCount = 0;
            let customerRevenue = 0;
            
            customer.cars.forEach(car => {
                // Count car brands
                if (car.car) {
                    const brand = this.extractCarBrand(car.car.toLowerCase());
                    if (brand) {
                        carBrands[brand] = (carBrands[brand] || 0) + 1;
                    }
                }
                
                if (car.invoices) {
                    customerInvoiceCount += car.invoices.length;
                    
                    car.invoices.forEach(invoice => {
                        totalInvoices++;
                        totalRevenue += invoice.totals.finalTotal;
                        customerRevenue += invoice.totals.finalTotal;
                        
                        // Collect recent invoices (simplified)
                        recentInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            reg: car.reg,
                            date: invoice.date,
                            total: invoice.totals.finalTotal
                        });
                        
                        // Analyze service types (simplified)
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                const desc = row.description.toLowerCase();
                                if (desc.includes('mot')) {
                                    serviceTypes['MOT'] = (serviceTypes['MOT'] || 0) + 1;
                                } else if (desc.includes('service')) {
                                    serviceTypes['Service'] = (serviceTypes['Service'] || 0) + 1;
                                } else if (desc.includes('brake')) {
                                    serviceTypes['Brake Work'] = (serviceTypes['Brake Work'] || 0) + 1;
                                } else if (desc.includes('oil')) {
                                    serviceTypes['Oil Change'] = (serviceTypes['Oil Change'] || 0) + 1;
                                } else if (desc.includes('tyre') || desc.includes('tire')) {
                                    serviceTypes['Tyre Work'] = (serviceTypes['Tyre Work'] || 0) + 1;
                                } else if (desc.trim()) {
                                    serviceTypes['Other Repairs'] = (serviceTypes['Other Repairs'] || 0) + 1;
                                }
                            }
                        });
                    });
                }
            });
            
            // Track top customers
            if (customerInvoiceCount > 0) {
                topCustomers.push({
                    name: customer.name,
                    invoiceCount: customerInvoiceCount,
                    revenue: customerRevenue,
                    carCount: customer.cars.length
                });
            }
        });

        // Sort and limit arrays (reduced limits)
        recentInvoices.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
        topCustomers.sort((a, b) => b.revenue - a.revenue);

        // Return much smaller dataset
        return {
            summary: {
                totalCustomers,
                totalInvoices,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                averageInvoiceValue: totalInvoices > 0 ? parseFloat((totalRevenue / totalInvoices).toFixed(2)) : 0
            },
            carBrands,
            serviceTypes,
            topCustomers: topCustomers.slice(0, 5), // Reduced from 10
            recentInvoices: recentInvoices.slice(0, 10), // Reduced from 20
            // Simplified customer list - only include customers with invoices
            customersWithInvoices: customers
                .filter(customer => customer.cars.some(car => car.invoices && car.invoices.length > 0))
                .slice(0, 20) // Limit to 20 customers
                .map(customer => ({
                    name: customer.name,
                    carCount: customer.cars.length,
                    totalInvoices: customer.cars.reduce((sum, car) => sum + (car.invoices ? car.invoices.length : 0), 0),
                    cars: customer.cars.map(car => ({
                        reg: car.reg,
                        car: car.car,
                        invoiceCount: car.invoices ? car.invoices.length : 0
                    }))
                }))
        };
    }

    // Extract car brand from car name
    extractCarBrand(carName) {
        const brands = ['bmw', 'mercedes', 'ford', 'toyota', 'honda', 'nissan', 'audi', 'volkswagen', 'vauxhall', 'peugeot', 'citroen', 'skoda', 'kia', 'hyundai', 'mazda', 'mini', 'lexus', 'jaguar', 'land rover', 'range rover'];
        for (const brand of brands) {
            if (carName.includes(brand)) {
                return brand;
            }
        }
        return null;
    }

    // Clear chat history
    clearHistory() {
        this.chatHistory = [];
    }

    // Check if API key is set
    hasApiKey() {
        return !!this.apiKey;
    }

    // Comprehensive local analysis of ALL data based on query
    analyzeQueryLocally(query) {
        const lowerQuery = query.toLowerCase();
        const customers = this.customerDb.dB;
        
        // Smart pattern recognition for complex queries
        if (this.isComplexQuery(lowerQuery)) {
            return this.analyzeComplexQuery(customers, query);
        }
        
        // Current invoice queries - check if asking about current invoice being worked on
        if (lowerQuery.includes('current') || lowerQuery.includes('this invoice') || 
            lowerQuery.includes('what did i do') || lowerQuery.includes('what work') ||
            lowerQuery.includes('what services') || lowerQuery.includes('invoice table')) {
            return this.analyzeCurrentInvoice();
        }
        
        // Recent customer queries
        if (lowerQuery.includes('last customer') || lowerQuery.includes('recent customer') || 
            lowerQuery.includes('most recent') || lowerQuery.includes('latest customer') ||
            lowerQuery.includes('last invoice')) {
            return this.analyzeMostRecentCustomer(customers);
        }
        
        // Date-related queries
        if (lowerQuery.includes('today') || lowerQuery.includes('invoice') && 
            (lowerQuery.includes('date') || lowerQuery.includes('from') || 
             lowerQuery.includes('on') || /\d{2}\/\d{2}\/\d{4}/.test(query))) {
            return this.analyzeInvoicesByDate(customers, query);
        }
        
        // Name-related queries
        if (lowerQuery.includes('name') || lowerQuery.includes('names') || 
            lowerQuery.includes('who') || lowerQuery.includes('customers')) {
            return this.analyzeCustomerNames(customers);
        }
        
        // Customer-related queries
        if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
            const carBrand = this.extractCarBrand(lowerQuery);
            if (carBrand) {
                return this.analyzeCustomersByBrand(customers, carBrand);
            }
            if (lowerQuery.includes('most') && lowerQuery.includes('invoice')) {
                return this.analyzeTopCustomers(customers);
            }
            return this.analyzeAllCustomers(customers);
        }
        
        // Financial queries
        if (lowerQuery.includes('revenue') || lowerQuery.includes('total') || lowerQuery.includes('money') || 
            lowerQuery.includes('expensive') || lowerQuery.includes('highest')) {
            return this.analyzeFinancialData(customers);
        }
        
        // Service queries
        if (lowerQuery.includes('service') || lowerQuery.includes('mot') || lowerQuery.includes('repair')) {
            return this.analyzeServices(customers);
        }
        
        // Invoice queries
        if (lowerQuery.includes('invoice')) {
            return this.analyzeInvoices(customers);
        }
        
        // General analysis - provide comprehensive overview
        return this.analyzeGeneralData(customers);
    }

    // Detect complex queries that need advanced analysis
    isComplexQuery(query) {
        const complexPatterns = [
            'compare', 'versus', 'vs', 'difference', 'better', 'best',
            'trend', 'pattern', 'increase', 'decrease', 'growth',
            'recommend', 'suggest', 'should', 'advice', 'insight',
            'predict', 'forecast', 'likely', 'probability',
            'relationship', 'correlation', 'connection',
            'efficiency', 'productivity', 'performance',
            'opportunity', 'potential', 'risk', 'concern'
        ];
        
        return complexPatterns.some(pattern => query.includes(pattern));
    }

    // Advanced analysis for complex queries
    analyzeComplexQuery(customers, query) {
        const lowerQuery = query.toLowerCase();
        
        // Trend analysis
        if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('growth')) {
            return this.analyzeTrends(customers);
        }
        
        // Comparison analysis
        if (lowerQuery.includes('compare') || lowerQuery.includes('versus') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
            return this.analyzeComparisons(customers, query);
        }
        
        // Recommendation analysis
        if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('advice') || lowerQuery.includes('should')) {
            return this.analyzeRecommendations(customers);
        }
        
        // Predictive analysis
        if (lowerQuery.includes('predict') || lowerQuery.includes('forecast') || lowerQuery.includes('likely')) {
            return this.analyzePredictions(customers);
        }
        
        // Performance analysis
        if (lowerQuery.includes('performance') || lowerQuery.includes('efficiency') || lowerQuery.includes('productivity')) {
            return this.analyzePerformance(customers);
        }
        
        // Opportunity analysis
        if (lowerQuery.includes('opportunity') || lowerQuery.includes('potential') || lowerQuery.includes('risk')) {
            return this.analyzeOpportunities(customers);
        }
        
        // Default to comprehensive analysis for complex queries
        return this.analyzeComprehensiveBusinessIntelligence(customers);
    }

    // Analyze current invoice being worked on in the invoice table
    analyzeCurrentInvoice() {
        try {
            // Get the current invoice table data
            const tableRows = document.querySelectorAll('tbody tr');
            const invoiceRows = [];
            
            tableRows.forEach(row => {
                const qty = row.querySelector('.item-numb-value')?.value || '';
                const description = row.querySelector('.item-descr-value')?.value || '';
                const parts = row.querySelector('.item-parts-value')?.value || '';
                const labor = row.querySelector('.item-labor-value')?.value || '';
                
                // Only include rows with actual content
                if (description.trim() || parts.trim() || labor.trim()) {
                    invoiceRows.push({
                        qty: qty.trim(),
                        description: description.trim(),
                        parts: parts.trim(),
                        labor: labor.trim()
                    });
                }
            });
            
            if (invoiceRows.length === 0) {
                return `CURRENT INVOICE ANALYSIS:
No work items found in the current invoice table. The invoice appears to be empty or not started yet.

To add work items:
1. Use the "Add New Row" button to add service items
2. Use the "MOT" button to add a standard MOT entry
3. Fill in descriptions, parts costs, and labor costs
4. Then ask me again about the current invoice!`;
            }
            
            // Get totals
            const partsTotal = document.querySelector('.parts-total-value')?.textContent || '0.00';
            const laborTotal = document.querySelector('.labor-total-value')?.textContent || '0.00';
            const finalTotal = document.querySelector('.final-total-value')?.textContent || '0.00';
            
            // Get customer and vehicle info
            const customerDetails = document.querySelector('.customer-details-input')?.value || '';
            const vehicleInfo = document.querySelectorAll('.info-val');
            const vehicle = vehicleInfo[0]?.value || '';
            const mileage = vehicleInfo[1]?.value || '';
            const reg = vehicleInfo[2]?.value || '';
            const date = document.querySelector('.date')?.textContent || '';
            
            // Analyze service types
            const serviceTypes = {};
            let totalParts = 0;
            let totalLabor = 0;
            
            invoiceRows.forEach(row => {
                if (row.parts) totalParts += parseFloat(row.parts) || 0;
                if (row.labor) totalLabor += parseFloat(row.labor) || 0;
                
                if (row.description) {
                    const desc = row.description.toLowerCase();
                    if (desc.includes('mot')) {
                        serviceTypes['MOT'] = (serviceTypes['MOT'] || 0) + 1;
                    } else if (desc.includes('service')) {
                        serviceTypes['Service'] = (serviceTypes['Service'] || 0) + 1;
                    } else if (desc.includes('brake')) {
                        serviceTypes['Brake Work'] = (serviceTypes['Brake Work'] || 0) + 1;
                    } else if (desc.includes('oil')) {
                        serviceTypes['Oil Change'] = (serviceTypes['Oil Change'] || 0) + 1;
                    } else if (desc.includes('tyre') || desc.includes('tire')) {
                        serviceTypes['Tyre Work'] = (serviceTypes['Tyre Work'] || 0) + 1;
                    } else if (desc.includes('exhaust')) {
                        serviceTypes['Exhaust Work'] = (serviceTypes['Exhaust Work'] || 0) + 1;
                    } else if (desc.includes('suspension')) {
                        serviceTypes['Suspension Work'] = (serviceTypes['Suspension Work'] || 0) + 1;
                    } else if (desc.trim()) {
                        serviceTypes['Other Repairs'] = (serviceTypes['Other Repairs'] || 0) + 1;
                    }
                }
            });
            
            return `CURRENT INVOICE ANALYSIS:
Date: ${date}
Customer: ${customerDetails.split('\n')[0] || 'Not specified'}
Vehicle: ${vehicle} (${reg})
Mileage: ${mileage}

WORK PERFORMED:
${invoiceRows.map((row, i) => {
    let item = `${i + 1}. ${row.description}`;
    if (row.qty) item += ` (Qty: ${row.qty})`;
    if (row.parts) item += ` - Parts: £${row.parts}`;
    if (row.labor) item += ` - Labor: £${row.labor}`;
    return item;
}).join('\n')}

SERVICE BREAKDOWN:
${Object.entries(serviceTypes).map(([service, count]) => 
    `• ${service}: ${count} item(s)`
).join('\n')}

COST BREAKDOWN:
• Total Parts: £${partsTotal}
• Total Labor: £${laborTotal}
• Final Total: £${finalTotal}

INVOICE STATUS: ${invoiceRows.length} work items completed`;
            
        } catch (error) {
            console.error('Error analyzing current invoice:', error);
            return `CURRENT INVOICE ANALYSIS:
Unable to read the current invoice table. Please make sure you have an invoice open and try again.

If you're working on a new invoice:
1. Select a customer from the Customer Book
2. Add work items using the "Add New Row" or "MOT" buttons
3. Fill in the descriptions and costs
4. Then ask me about the current invoice!`;
        }
    }

    // Analyze most recent customer based on actual invoice dates
    analyzeMostRecentCustomer(customers) {
        const allInvoices = [];
        
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        allInvoices.push({
                            customer: customer.name,
                            address: customer.address,
                            mobiles: customer.mobiles,
                            car: car.car,
                            reg: car.reg,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                    });
                }
            });
        });
        
        if (allInvoices.length === 0) {
            return `RECENT CUSTOMER ANALYSIS:
No invoices found in the system. No recent customer data available.`;
        }
        
        // Sort by date (most recent first)
        allInvoices.sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateB - dateA;
        });
        
        const mostRecent = allInvoices[0];
        
        // Count total visits for this customer
        const customerInvoices = allInvoices.filter(inv => inv.customer === mostRecent.customer);
        const totalRevenue = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        return `MOST RECENT CUSTOMER ANALYSIS:
Customer Name: ${mostRecent.customer}
Address: ${mostRecent.address}
Mobile Numbers: ${mostRecent.mobiles.join(', ')}
Vehicle: ${mostRecent.car} (Registration: ${mostRecent.reg})
Date of Last Visit: ${mostRecent.date}
Last Invoice Total: £${parseFloat(mostRecent.total.toFixed(2))}

CUSTOMER HISTORY:
Total Visits: ${customerInvoices.length}
Total Revenue: £${parseFloat(totalRevenue.toFixed(2))}
Average Invoice Value: £${customerInvoices.length > 0 ? parseFloat((totalRevenue / customerInvoices.length).toFixed(2)) : 0}

RECENT SERVICES:
${mostRecent.services.map(service => `• ${service}`).join('\n')}

NOTE: This is based on the most recent invoice date in your system.`;
    }

    // Analyze invoices by specific date
    analyzeInvoicesByDate(customers, query) {
        const allInvoices = [];
        
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            reg: car.reg,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d),
                            invoiceId: invoice.id || 'Unknown' // Add invoice ID if available
                        });
                    });
                }
            });
        });
        
        if (allInvoices.length === 0) {
            return `DATE ANALYSIS:
No invoices found in the system.`;
        }
        
        // Extract date from query - improved date detection
        let targetDate = null;
        const dateMatch = query.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) {
            targetDate = dateMatch[1];
        } else if (query.toLowerCase().includes('today')) {
            // Get today's date in DD/MM/YYYY format
            const today = new Date();
            const day = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear();
            targetDate = `${day}/${month}/${year}`;
            
            // Also check if there are any dates that might be "today" in different formats
            console.log('Looking for today:', targetDate);
            console.log('Available dates:', [...new Set(allInvoices.map(inv => inv.date))]);
        }
        
        if (!targetDate) {
            // Show all available dates with invoice counts
            const dateCounts = {};
            allInvoices.forEach(inv => {
                dateCounts[inv.date] = (dateCounts[inv.date] || 0) + 1;
            });
            
            const availableDates = Object.entries(dateCounts)
                .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
                .map(([date, count]) => `${date} (${count} invoice${count > 1 ? 's' : ''})`)
                .join(', ');
            
            return `DATE ANALYSIS:
Please specify a date in DD/MM/YYYY format or ask about "today's invoices".

Available dates in your system:
${availableDates}`;
        }
        
        // Find invoices for the target date - exact match
        const dateInvoices = allInvoices.filter(invoice => invoice.date === targetDate);
        
        if (dateInvoices.length === 0) {
            // Show all available dates with invoice counts
            const dateCounts = {};
            allInvoices.forEach(inv => {
                dateCounts[inv.date] = (dateCounts[inv.date] || 0) + 1;
            });
            
            const availableDates = Object.entries(dateCounts)
                .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
                .map(([date, count]) => `${date} (${count} invoice${count > 1 ? 's' : ''})`)
                .join(', ');
            
            // Check if this was a "today" query
            const isTodayQuery = query.toLowerCase().includes('today');
            const todayMessage = isTodayQuery ? 
                `\n\nNOTE: Today's date is ${targetDate}. If you have invoices for today but they're not showing up, they might be saved with a different date format.` : '';
            
            return `DATE ANALYSIS:
No invoices found for ${targetDate}.${todayMessage}

Available dates in your system:
${availableDates}

TIP: You can ask about any of these specific dates, for example:
"Show me invoices from [date]" or "How many invoices on [date]"`;
        }
        
        const totalRevenue = dateInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const uniqueCustomers = [...new Set(dateInvoices.map(inv => inv.customer))];
        
        // Group by customer to show multiple invoices per customer
        const customerGroups = {};
        dateInvoices.forEach(invoice => {
            if (!customerGroups[invoice.customer]) {
                customerGroups[invoice.customer] = [];
            }
            customerGroups[invoice.customer].push(invoice);
        });
        
        return `INVOICES FOR ${targetDate}:
Total Invoices: ${dateInvoices.length}
Total Revenue: £${parseFloat(totalRevenue.toFixed(2))}
Unique Customers: ${uniqueCustomers.length}

DETAILED BREAKDOWN:
${Object.entries(customerGroups).map(([customer, invoices]) => `
${customer} (${invoices.length} invoice${invoices.length > 1 ? 's' : ''}):
${invoices.map((invoice, index) => 
    `  ${index + 1}. ${invoice.car} (${invoice.reg}) - £${parseFloat(invoice.total.toFixed(2))}
     Services: ${invoice.services.join(', ') || 'No services listed'}`
).join('\n')}
`).join('')}

SUMMARY:
• Average invoice value: £${parseFloat((totalRevenue / dateInvoices.length).toFixed(2))}
• Most active customer: ${uniqueCustomers.length > 0 ? uniqueCustomers[0] : 'N/A'}
• Total services performed: ${dateInvoices.reduce((sum, inv) => sum + inv.services.length, 0)}`;
    }

    // Analyze customer names and provide comprehensive customer information
    analyzeCustomerNames(customers) {
        if (!customers || customers.length === 0) {
            return `CUSTOMER NAMES ANALYSIS:
No customers found in the system.`;
        }

        const allInvoices = [];
        const customerStats = {};
        
        // Collect all invoice data and customer statistics
        customers.forEach(customer => {
            let totalSpent = 0;
            let totalInvoices = 0;
            let lastVisit = null;
            let vehicles = [];
            
            customer.cars.forEach(car => {
                vehicles.push(`${car.car} (${car.reg})`);
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        totalSpent += invoice.totals.finalTotal;
                        totalInvoices++;
                        allInvoices.push({
                            customer: customer.name,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            vehicle: `${car.car} (${car.reg})`
                        });
                        
                        if (!lastVisit || new Date(invoice.date.split('/').reverse().join('-')) > new Date(lastVisit.split('/').reverse().join('-'))) {
                            lastVisit = invoice.date;
                        }
                    });
                }
            });
            
            customerStats[customer.name] = {
                address: customer.address,
                mobiles: customer.mobiles,
                vehicles: vehicles,
                totalSpent: totalSpent,
                totalInvoices: totalInvoices,
                lastVisit: lastVisit,
                averageInvoice: totalInvoices > 0 ? totalSpent / totalInvoices : 0
            };
        });

        // Sort customers by total spent (most valuable first)
        const sortedCustomers = Object.entries(customerStats)
            .sort(([,a], [,b]) => b.totalSpent - a.totalSpent);

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCustomers = sortedCustomers.filter(([name, stats]) => {
            if (!stats.lastVisit) return false;
            const lastVisitDate = new Date(stats.lastVisit.split('/').reverse().join('-'));
            return lastVisitDate >= thirtyDaysAgo;
        });

        return `CUSTOMER NAMES & ANALYSIS:
Total Customers: ${customers.length}
Active Customers (with invoices): ${sortedCustomers.length}

TOP CUSTOMERS BY VALUE:
${sortedCustomers.slice(0, 5).map(([name, stats], index) => `
${index + 1}. ${name}
   • Total Spent: £${parseFloat(stats.totalSpent.toFixed(2))}
   • Total Invoices: ${stats.totalInvoices}
   • Average Invoice: £${parseFloat(stats.averageInvoice.toFixed(2))}
   • Last Visit: ${stats.lastVisit || 'Never'}
   • Vehicles: ${stats.vehicles.join(', ')}
   • Contact: ${stats.mobiles.join(', ')}
   • Address: ${stats.address}
`).join('')}

RECENT ACTIVITY (Last 30 Days):
${recentCustomers.length > 0 ? recentCustomers.map(([name, stats]) => 
    `• ${name} - Last visit: ${stats.lastVisit} (£${parseFloat(stats.totalSpent.toFixed(2))} total)`
).join('\n') : 'No recent activity in the last 30 days'}

CUSTOMER INSIGHTS:
• Most Valuable Customer: ${sortedCustomers[0] ? sortedCustomers[0][0] : 'N/A'}
• Most Frequent Customer: ${sortedCustomers.reduce((max, [name, stats]) => 
    stats.totalInvoices > max.totalInvoices ? {name, totalInvoices: stats.totalInvoices} : max, 
    {name: 'N/A', totalInvoices: 0}
).name}
• Total Customer Revenue: £${parseFloat(sortedCustomers.reduce((sum, [,stats]) => sum + stats.totalSpent, 0).toFixed(2))}
• Average Customer Value: £${sortedCustomers.length > 0 ? parseFloat((sortedCustomers.reduce((sum, [,stats]) => sum + stats.totalSpent, 0) / sortedCustomers.length).toFixed(2)) : 0}`;
    }

    // Analyze customers by specific car brand
    analyzeCustomersByBrand(customers, brand) {
        const brandCustomers = customers.filter(customer => 
            customer.cars.some(car => car.car && car.car.toLowerCase().includes(brand))
        );
        
        let totalInvoices = 0;
        let totalRevenue = 0;
        const customerDetails = [];
        
        brandCustomers.forEach(customer => {
            let customerInvoices = 0;
            let customerRevenue = 0;
            const customerCars = customer.cars.filter(car => car.car && car.car.toLowerCase().includes(brand));
            
            customerCars.forEach(car => {
                if (car.invoices) {
                    customerInvoices += car.invoices.length;
                    car.invoices.forEach(invoice => {
                        customerRevenue += invoice.totals.finalTotal;
                        totalRevenue += invoice.totals.finalTotal;
                    });
                }
            });
            
            totalInvoices += customerInvoices;
            
            customerDetails.push({
                name: customer.name,
                address: customer.address,
                cars: customerCars.map(car => ({
                    reg: car.reg,
                    car: car.car,
                    invoiceCount: car.invoices ? car.invoices.length : 0
                })),
                totalInvoices: customerInvoices,
                totalRevenue: parseFloat(customerRevenue.toFixed(2))
            });
        });
        
        return `BMW CUSTOMER ANALYSIS:
Total BMW Customers: ${brandCustomers.length}
Total BMW Invoices: ${totalInvoices}
Total BMW Revenue: £${parseFloat(totalRevenue.toFixed(2))}
Average Revenue per BMW Customer: £${brandCustomers.length > 0 ? parseFloat((totalRevenue / brandCustomers.length).toFixed(2)) : 0}

CUSTOMER DETAILS:
${customerDetails.map(c => 
    `• ${c.name} (${c.address}) - ${c.totalInvoices} invoices, £${c.totalRevenue} revenue
  Cars: ${c.cars.map(car => `${car.car} (${car.reg})`).join(', ')}`
).join('\n')}`;
    }

    // Analyze top customers by revenue/invoices
    analyzeTopCustomers(customers) {
        const customerStats = customers.map(customer => {
            let totalInvoices = 0;
            let totalRevenue = 0;
            
            customer.cars.forEach(car => {
                if (car.invoices) {
                    totalInvoices += car.invoices.length;
                    car.invoices.forEach(invoice => {
                        totalRevenue += invoice.totals.finalTotal;
                    });
                }
            });
            
            return {
                name: customer.name,
                totalInvoices,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                carCount: customer.cars.length
            };
        }).filter(c => c.totalInvoices > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        return `TOP CUSTOMERS ANALYSIS:
${customerStats.slice(0, 10).map((c, i) => 
    `${i + 1}. ${c.name} - £${c.totalRevenue} revenue, ${c.totalInvoices} invoices, ${c.carCount} cars`
).join('\n')}

SUMMARY:
Total Active Customers: ${customerStats.length}
Total Revenue: £${parseFloat(customerStats.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2))}
Average Revenue per Customer: £${customerStats.length > 0 ? parseFloat((customerStats.reduce((sum, c) => sum + c.totalRevenue, 0) / customerStats.length).toFixed(2)) : 0}`;
    }

    // Analyze all customers
    analyzeAllCustomers(customers) {
        const activeCustomers = customers.filter(customer => 
            customer.cars.some(car => car.invoices && car.invoices.length > 0)
        );
        
        const carBrands = {};
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.car) {
                    const brand = this.extractCarBrand(car.car.toLowerCase());
                    if (brand) {
                        carBrands[brand] = (carBrands[brand] || 0) + 1;
                    }
                }
            });
        });
        
        return `CUSTOMER OVERVIEW:
Total Customers: ${customers.length}
Active Customers (with invoices): ${activeCustomers.length}
Inactive Customers: ${customers.length - activeCustomers.length}

CAR BRAND DISTRIBUTION:
${Object.entries(carBrands).sort(([,a], [,b]) => b - a).map(([brand, count]) => 
    `• ${brand.toUpperCase()}: ${count} cars`
).join('\n')}`;
    }

    // Analyze financial data
    analyzeFinancialData(customers) {
        let totalRevenue = 0;
        let totalInvoices = 0;
        const invoiceValues = [];
        const monthlyRevenue = {};
        
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        totalInvoices++;
                        totalRevenue += invoice.totals.finalTotal;
                        invoiceValues.push(invoice.totals.finalTotal);
                        
                        // Extract month/year for monthly analysis
                        const dateParts = invoice.date.split('/');
                        if (dateParts.length === 3) {
                            const monthYear = `${dateParts[1]}/${dateParts[2]}`;
                            monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + invoice.totals.finalTotal;
                        }
                    });
                }
            });
        });
        
        invoiceValues.sort((a, b) => b - a);
        const topInvoices = invoiceValues.slice(0, 5);
        
        return `FINANCIAL ANALYSIS:
Total Revenue: £${parseFloat(totalRevenue.toFixed(2))}
Total Invoices: ${totalInvoices}
Average Invoice Value: £${totalInvoices > 0 ? parseFloat((totalRevenue / totalInvoices).toFixed(2)) : 0}
Highest Invoice: £${topInvoices[0] ? parseFloat(topInvoices[0].toFixed(2)) : 0}

TOP 5 INVOICES:
${topInvoices.map((value, i) => `${i + 1}. £${parseFloat(value.toFixed(2))}`).join('\n')}

MONTHLY REVENUE:
${Object.entries(monthlyRevenue).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6).map(([month, revenue]) => 
    `• ${month}: £${parseFloat(revenue.toFixed(2))}`
).join('\n')}`;
    }

    // Analyze services
    analyzeServices(customers) {
        const serviceTypes = {};
        const motServices = [];
        let totalServices = 0;
        
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                totalServices++;
                                const desc = row.description.toLowerCase();
                                if (desc.includes('mot')) {
                                    serviceTypes['MOT'] = (serviceTypes['MOT'] || 0) + 1;
                                    motServices.push({
                                        customer: customer.name,
                                        car: car.car,
                                        date: invoice.date,
                                        total: invoice.totals.finalTotal
                                    });
                                } else if (desc.includes('service')) {
                                    serviceTypes['Service'] = (serviceTypes['Service'] || 0) + 1;
                                } else if (desc.includes('brake')) {
                                    serviceTypes['Brake Work'] = (serviceTypes['Brake Work'] || 0) + 1;
                                } else if (desc.includes('oil')) {
                                    serviceTypes['Oil Change'] = (serviceTypes['Oil Change'] || 0) + 1;
                                } else if (desc.includes('tyre') || desc.includes('tire')) {
                                    serviceTypes['Tyre Work'] = (serviceTypes['Tyre Work'] || 0) + 1;
                                } else if (desc.trim()) {
                                    serviceTypes['Other Repairs'] = (serviceTypes['Other Repairs'] || 0) + 1;
                                }
                            }
                        });
                    });
                }
            });
        });
        
        return `SERVICE ANALYSIS:
Total Services Performed: ${totalServices}

SERVICE BREAKDOWN:
${Object.entries(serviceTypes).sort(([,a], [,b]) => b - a).map(([service, count]) => 
    `• ${service}: ${count} (${((count / totalServices) * 100).toFixed(1)}%)`
).join('\n')}

RECENT MOT SERVICES:
${motServices.slice(0, 5).map(mot => 
    `• ${mot.customer} - ${mot.car} (${mot.date}) - £${parseFloat(mot.total.toFixed(2))}`
).join('\n')}`;
    }

    // Analyze invoices
    analyzeInvoices(customers) {
        const allInvoices = [];
        let totalInvoices = 0;
        let totalRevenue = 0;
        
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        totalInvoices++;
                        totalRevenue += invoice.totals.finalTotal;
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            reg: car.reg,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                    });
                }
            });
        });
        
        allInvoices.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
        
        return `INVOICE ANALYSIS:
Total Invoices: ${totalInvoices}
Total Revenue: £${parseFloat(totalRevenue.toFixed(2))}
Average Invoice Value: £${totalInvoices > 0 ? parseFloat((totalRevenue / totalInvoices).toFixed(2)) : 0}

RECENT INVOICES:
${allInvoices.slice(0, 10).map(inv => 
    `• ${inv.customer} - ${inv.car} (${inv.date}) - £${parseFloat(inv.total.toFixed(2))}`
).join('\n')}`;
    }

    // General data analysis - comprehensive business intelligence
    analyzeGeneralData(customers) {
        if (!customers || customers.length === 0) {
            return `GENERAL BUSINESS OVERVIEW:
No data available in the system. Please add some customers and invoices to get started.`;
        }

        const allInvoices = [];
        const allServices = [];
        const monthlyRevenue = {};
        const serviceTypes = {};
        const carBrands = {};
        const customerStats = {};
        
        // Deep analysis of all data
        customers.forEach(customer => {
            let customerTotal = 0;
            let customerInvoices = 0;
            
            customer.cars.forEach(car => {
                // Track car brands
                if (car.car) {
                    const brand = car.car.split(' ')[0].toLowerCase();
                    carBrands[brand] = (carBrands[brand] || 0) + 1;
                }
                
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        customerTotal += invoice.totals.finalTotal;
                        customerInvoices++;
                        
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            reg: car.reg,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                        
                        // Track monthly revenue
                        const month = invoice.date.split('/')[1] + '/' + invoice.date.split('/')[2];
                        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + invoice.totals.finalTotal;
                        
                        // Track services
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                const service = row.description.toLowerCase();
                                allServices.push(service);
                                
                                // Categorize services
                                if (service.includes('mot')) {
                                    serviceTypes['MOT'] = (serviceTypes['MOT'] || 0) + 1;
                                } else if (service.includes('service')) {
                                    serviceTypes['Service'] = (serviceTypes['Service'] || 0) + 1;
                                } else if (service.includes('brake')) {
                                    serviceTypes['Brake Work'] = (serviceTypes['Brake Work'] || 0) + 1;
                                } else if (service.includes('oil')) {
                                    serviceTypes['Oil Change'] = (serviceTypes['Oil Change'] || 0) + 1;
                                } else if (service.includes('tyre') || service.includes('tire')) {
                                    serviceTypes['Tyre Work'] = (serviceTypes['Tyre Work'] || 0) + 1;
                                } else if (service.includes('exhaust')) {
                                    serviceTypes['Exhaust Work'] = (serviceTypes['Exhaust Work'] || 0) + 1;
                                } else if (service.includes('suspension')) {
                                    serviceTypes['Suspension Work'] = (serviceTypes['Suspension Work'] || 0) + 1;
                                } else if (service.trim()) {
                                    serviceTypes['Other Repairs'] = (serviceTypes['Other Repairs'] || 0) + 1;
                                }
                            }
                        });
                    });
                }
            });
            
            customerStats[customer.name] = {
                totalSpent: customerTotal,
                totalInvoices: customerInvoices,
                averageInvoice: customerInvoices > 0 ? customerTotal / customerInvoices : 0
            };
        });

        // Calculate key metrics
        const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const averageInvoiceValue = allInvoices.length > 0 ? totalRevenue / allInvoices.length : 0;
        const totalCustomers = customers.length;
        const activeCustomers = Object.keys(customerStats).length;
        const totalCars = customers.reduce((sum, customer) => sum + customer.cars.length, 0);
        
        // Find top performers
        const topCustomer = Object.entries(customerStats)
            .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)[0];
        const topMonth = Object.entries(monthlyRevenue)
            .sort(([,a], [,b]) => b - a)[0];
        const topService = Object.entries(serviceTypes)
            .sort(([,a], [,b]) => b - a)[0];
        const topBrand = Object.entries(carBrands)
            .sort(([,a], [,b]) => b - a)[0];

        // Recent activity analysis
        const recentInvoices = allInvoices
            .sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')))
            .slice(0, 5);

        return `COMPREHENSIVE BUSINESS INTELLIGENCE REPORT:

📊 KEY METRICS:
• Total Customers: ${totalCustomers} (${activeCustomers} active)
• Total Vehicles: ${totalCars}
• Total Invoices: ${allInvoices.length}
• Total Revenue: £${parseFloat(totalRevenue.toFixed(2))}
• Average Invoice Value: £${parseFloat(averageInvoiceValue.toFixed(2))}

🏆 TOP PERFORMERS:
• Most Valuable Customer: ${topCustomer ? `${topCustomer[0]} (£${parseFloat(topCustomer[1].totalSpent.toFixed(2))})` : 'N/A'}
• Best Month: ${topMonth ? `${topMonth[0]} (£${parseFloat(topMonth[1].toFixed(2))})` : 'N/A'}
• Most Popular Service: ${topService ? `${topService[0]} (${topService[1]} times)` : 'N/A'}
• Most Common Car Brand: ${topBrand ? `${topBrand[0].toUpperCase()} (${topBrand[1]} vehicles)` : 'N/A'}

🔧 SERVICE BREAKDOWN:
${Object.entries(serviceTypes)
    .sort(([,a], [,b]) => b - a)
    .map(([service, count]) => `• ${service}: ${count} times`)
    .join('\n')}

🚗 CAR BRAND DISTRIBUTION:
${Object.entries(carBrands)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([brand, count]) => `• ${brand.toUpperCase()}: ${count} vehicles`)
    .join('\n')}

📅 RECENT ACTIVITY (Last 5 Invoices):
${recentInvoices.map((inv, i) => 
    `${i + 1}. ${inv.customer} - ${inv.car} (${inv.reg}) - ${inv.date} - £${parseFloat(inv.total.toFixed(2))}`
).join('\n')}

💡 BUSINESS INSIGHTS:
• Customer Retention: ${activeCustomers > 0 ? parseFloat(((activeCustomers / totalCustomers) * 100).toFixed(1)) : 0}% of customers have invoices
• Revenue per Customer: £${activeCustomers > 0 ? parseFloat((totalRevenue / activeCustomers).toFixed(2)) : 0}
• Services per Invoice: ${allInvoices.length > 0 ? parseFloat((allServices.length / allInvoices.length).toFixed(1)) : 0}

Ask me specific questions about any of these metrics for deeper analysis!`;
    }

    // Advanced Trend Analysis
    analyzeTrends(customers) {
        const allInvoices = [];
        const monthlyData = {};
        const serviceTrends = {};
        const customerTrends = {};
        
        // Collect all invoice data
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                        
                        // Monthly trends
                        const month = invoice.date.split('/')[1] + '/' + invoice.date.split('/')[2];
                        if (!monthlyData[month]) {
                            monthlyData[month] = { revenue: 0, invoices: 0, customers: new Set() };
                        }
                        monthlyData[month].revenue += invoice.totals.finalTotal;
                        monthlyData[month].invoices += 1;
                        monthlyData[month].customers.add(customer.name);
                        
                        // Service trends
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                const service = row.description.toLowerCase();
                                if (!serviceTrends[service]) {
                                    serviceTrends[service] = { count: 0, revenue: 0 };
                                }
                                serviceTrends[service].count += 1;
                                serviceTrends[service].revenue += invoice.totals.finalTotal;
                            }
                        });
                        
                        // Customer trends
                        if (!customerTrends[customer.name]) {
                            customerTrends[customer.name] = { visits: 0, totalSpent: 0, lastVisit: null };
                        }
                        customerTrends[customer.name].visits += 1;
                        customerTrends[customer.name].totalSpent += invoice.totals.finalTotal;
                        customerTrends[customer.name].lastVisit = invoice.date;
                    });
                }
            });
        });
        
        // Sort months chronologically
        const sortedMonths = Object.entries(monthlyData)
            .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        
        // Calculate growth trends
        const revenueGrowth = this.calculateGrowthRate(sortedMonths.map(([,data]) => data.revenue));
        const invoiceGrowth = this.calculateGrowthRate(sortedMonths.map(([,data]) => data.invoices));
        
        // Top performing services
        const topServices = Object.entries(serviceTrends)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 5);
        
        // Customer loyalty analysis
        const loyalCustomers = Object.entries(customerTrends)
            .filter(([,data]) => data.visits >= 3)
            .sort(([,a], [,b]) => b.totalSpent - a.totalSpent);
        
        return `📈 BUSINESS TREND ANALYSIS:

MONTHLY PERFORMANCE:
${sortedMonths.map(([month, data]) => `
${month}: £${parseFloat(data.revenue.toFixed(2))} revenue, ${data.invoices} invoices, ${data.customers.size} customers
`).join('')}

GROWTH TRENDS:
• Revenue Growth: ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%
• Invoice Volume Growth: ${invoiceGrowth > 0 ? '+' : ''}${invoiceGrowth.toFixed(1)}%
• Average Monthly Revenue: £${parseFloat((sortedMonths.reduce((sum, [,data]) => sum + data.revenue, 0) / sortedMonths.length).toFixed(2))}

TOP PERFORMING SERVICES:
${topServices.map(([service, data]) => 
    `• ${service}: ${data.count} times, £${parseFloat(data.revenue.toFixed(2))} revenue`
).join('\n')}

CUSTOMER LOYALTY INSIGHTS:
• Loyal Customers (3+ visits): ${loyalCustomers.length}
• Average Customer Value: £${parseFloat((Object.values(customerTrends).reduce((sum, data) => sum + data.totalSpent, 0) / Object.keys(customerTrends).length).toFixed(2))}
• Customer Retention Rate: ${parseFloat(((loyalCustomers.length / Object.keys(customerTrends).length) * 100).toFixed(1))}%

BUSINESS INSIGHTS:
${revenueGrowth > 0 ? '📈 Your business is growing! Revenue is trending upward.' : '📉 Revenue is declining. Consider marketing strategies.'}
${invoiceGrowth > 0 ? '📈 Invoice volume is increasing - great for business growth!' : '📉 Invoice volume is decreasing - focus on customer acquisition.'}
${loyalCustomers.length > 0 ? `💎 You have ${loyalCustomers.length} loyal customers - excellent retention!` : '⚠️ Consider implementing customer retention strategies.'}`;
    }

    // Advanced Comparison Analysis
    analyzeComparisons(customers, query) {
        const allInvoices = [];
        const customerStats = {};
        const serviceStats = {};
        const monthlyStats = {};
        
        // Collect comprehensive data
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                        
                        // Customer comparisons
                        if (!customerStats[customer.name]) {
                            customerStats[customer.name] = { totalSpent: 0, visits: 0, avgInvoice: 0 };
                        }
                        customerStats[customer.name].totalSpent += invoice.totals.finalTotal;
                        customerStats[customer.name].visits += 1;
                        
                        // Service comparisons
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                const service = row.description.toLowerCase();
                                if (!serviceStats[service]) {
                                    serviceStats[service] = { count: 0, revenue: 0, avgPrice: 0 };
                                }
                                serviceStats[service].count += 1;
                                serviceStats[service].revenue += invoice.totals.finalTotal;
                            }
                        });
                        
                        // Monthly comparisons
                        const month = invoice.date.split('/')[1] + '/' + invoice.date.split('/')[2];
                        if (!monthlyStats[month]) {
                            monthlyStats[month] = { revenue: 0, invoices: 0 };
                        }
                        monthlyStats[month].revenue += invoice.totals.finalTotal;
                        monthlyStats[month].invoices += 1;
                    });
                }
            });
        });
        
        // Calculate averages
        Object.keys(customerStats).forEach(customer => {
            customerStats[customer].avgInvoice = customerStats[customer].totalSpent / customerStats[customer].visits;
        });
        
        Object.keys(serviceStats).forEach(service => {
            serviceStats[service].avgPrice = serviceStats[service].revenue / serviceStats[service].count;
        });
        
        // Top performers
        const topCustomers = Object.entries(customerStats)
            .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
            .slice(0, 3);
        
        const topServices = Object.entries(serviceStats)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 3);
        
        const topMonths = Object.entries(monthlyStats)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 3);
        
        return `🔍 COMPARATIVE ANALYSIS:

TOP CUSTOMERS COMPARISON:
${topCustomers.map(([customer, stats], index) => `
${index + 1}. ${customer}
   • Total Spent: £${parseFloat(stats.totalSpent.toFixed(2))}
   • Visits: ${stats.visits}
   • Average Invoice: £${parseFloat(stats.avgInvoice.toFixed(2))}
   • Value per Visit: £${parseFloat((stats.totalSpent / stats.visits).toFixed(2))}
`).join('')}

TOP SERVICES COMPARISON:
${topServices.map(([service, stats], index) => `
${index + 1}. ${service}
   • Total Revenue: £${parseFloat(stats.revenue.toFixed(2))}
   • Times Performed: ${stats.count}
   • Average Price: £${parseFloat(stats.avgPrice.toFixed(2))}
   • Revenue per Service: £${parseFloat((stats.revenue / stats.count).toFixed(2))}
`).join('')}

MONTHLY PERFORMANCE COMPARISON:
${topMonths.map(([month, stats], index) => `
${index + 1}. ${month}
   • Revenue: £${parseFloat(stats.revenue.toFixed(2))}
   • Invoices: ${stats.invoices}
   • Average Invoice Value: £${parseFloat((stats.revenue / stats.invoices).toFixed(2))}
`).join('')}

KEY INSIGHTS:
• Best Customer: ${topCustomers[0] ? topCustomers[0][0] : 'N/A'} (£${topCustomers[0] ? parseFloat(topCustomers[0][1].totalSpent.toFixed(2)) : 0})
• Most Profitable Service: ${topServices[0] ? topServices[0][0] : 'N/A'} (£${topServices[0] ? parseFloat(topServices[0][1].revenue.toFixed(2)) : 0})
• Best Month: ${topMonths[0] ? topMonths[0][0] : 'N/A'} (£${topMonths[0] ? parseFloat(topMonths[0][1].revenue.toFixed(2)) : 0})
• Customer Value Range: £${parseFloat(Math.min(...Object.values(customerStats).map(s => s.totalSpent)).toFixed(2))} - £${parseFloat(Math.max(...Object.values(customerStats).map(s => s.totalSpent)).toFixed(2))}`;
    }

    // Advanced Recommendation Analysis
    analyzeRecommendations(customers) {
        const allInvoices = [];
        const customerAnalysis = {};
        const serviceAnalysis = {};
        const seasonalAnalysis = {};
        
        // Collect data
        customers.forEach(customer => {
            customer.cars.forEach(car => {
                if (car.invoices) {
                    car.invoices.forEach(invoice => {
                        allInvoices.push({
                            customer: customer.name,
                            car: car.car,
                            date: invoice.date,
                            total: invoice.totals.finalTotal,
                            services: invoice.tableRows.map(row => row.description).filter(d => d)
                        });
                        
                        // Customer analysis
                        if (!customerAnalysis[customer.name]) {
                            customerAnalysis[customer.name] = { visits: 0, totalSpent: 0, lastVisit: null, services: [] };
                        }
                        customerAnalysis[customer.name].visits += 1;
                        customerAnalysis[customer.name].totalSpent += invoice.totals.finalTotal;
                        customerAnalysis[customer.name].lastVisit = invoice.date;
                        customerAnalysis[customer.name].services.push(...invoice.tableRows.map(row => row.description).filter(d => d));
                        
                        // Service analysis
                        invoice.tableRows.forEach(row => {
                            if (row.description) {
                                const service = row.description.toLowerCase();
                                if (!serviceAnalysis[service]) {
                                    serviceAnalysis[service] = { count: 0, revenue: 0, customers: new Set() };
                                }
                                serviceAnalysis[service].count += 1;
                                serviceAnalysis[service].revenue += invoice.totals.finalTotal;
                                serviceAnalysis[service].customers.add(customer.name);
                            }
                        });
                        
                        // Seasonal analysis
                        const month = parseInt(invoice.date.split('/')[1]);
                        const season = this.getSeason(month);
                        if (!seasonalAnalysis[season]) {
                            seasonalAnalysis[season] = { revenue: 0, invoices: 0 };
                        }
                        seasonalAnalysis[season].revenue += invoice.totals.finalTotal;
                        seasonalAnalysis[season].invoices += 1;
                    });
                }
            });
        });
        
        // Generate recommendations
        const recommendations = [];
        
        // Customer retention recommendations
        const atRiskCustomers = Object.entries(customerAnalysis)
            .filter(([,data]) => {
                const daysSinceLastVisit = this.daysSinceDate(data.lastVisit);
                return daysSinceLastVisit > 90 && data.visits >= 2;
            });
        
        if (atRiskCustomers.length > 0) {
            recommendations.push(`🔄 CUSTOMER RETENTION: ${atRiskCustomers.length} customers haven't visited in 90+ days. Consider reaching out with special offers.`);
        }
        
        // Service expansion recommendations
        const popularServices = Object.entries(serviceAnalysis)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 3);
        
        if (popularServices.length > 0) {
            recommendations.push(`💡 SERVICE EXPANSION: Focus on ${popularServices[0][0]} - it's your most profitable service (£${parseFloat(popularServices[0][1].revenue.toFixed(2))} revenue).`);
        }
        
        // Seasonal recommendations
        const bestSeason = Object.entries(seasonalAnalysis)
            .sort(([,a], [,b]) => b.revenue - a.revenue)[0];
        
        if (bestSeason) {
            recommendations.push(`📅 SEASONAL STRATEGY: ${bestSeason[0]} is your best season (£${parseFloat(bestSeason[1].revenue.toFixed(2))} revenue). Plan promotions for other seasons.`);
        }
        
        // Pricing recommendations
        const avgInvoiceValue = allInvoices.reduce((sum, inv) => sum + inv.total, 0) / allInvoices.length;
        if (avgInvoiceValue < 100) {
            recommendations.push(`💰 PRICING: Average invoice value is £${parseFloat(avgInvoiceValue.toFixed(2))}. Consider upselling additional services.`);
        }
        
        return `🎯 SMART RECOMMENDATIONS:

${recommendations.join('\n\n')}

CUSTOMER INSIGHTS:
• Total Customers: ${Object.keys(customerAnalysis).length}
• Average Visits per Customer: ${parseFloat((Object.values(customerAnalysis).reduce((sum, data) => sum + data.visits, 0) / Object.keys(customerAnalysis).length).toFixed(1))}
• Customer Lifetime Value: £${parseFloat((Object.values(customerAnalysis).reduce((sum, data) => sum + data.totalSpent, 0) / Object.keys(customerAnalysis).length).toFixed(2))}

SERVICE INSIGHTS:
• Most Popular Service: ${popularServices[0] ? popularServices[0][0] : 'N/A'}
• Service Diversity: ${Object.keys(serviceAnalysis).length} different services offered
• Average Service Revenue: £${parseFloat((Object.values(serviceAnalysis).reduce((sum, data) => sum + data.revenue, 0) / Object.keys(serviceAnalysis).length).toFixed(2))}

BUSINESS GROWTH OPPORTUNITIES:
• Focus on high-value customers (top 20% generate 80% of revenue)
• Implement customer loyalty program
• Cross-sell complementary services
• Optimize pricing for underperforming services
• Develop seasonal service packages`;
    }

    // Helper methods for advanced analysis
    calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        const first = values[0];
        const last = values[values.length - 1];
        return ((last - first) / first) * 100;
    }

    getSeason(month) {
        if (month >= 3 && month <= 5) return 'Spring';
        if (month >= 6 && month <= 8) return 'Summer';
        if (month >= 9 && month <= 11) return 'Autumn';
        return 'Winter';
    }

    daysSinceDate(dateString) {
        const date = new Date(dateString.split('/').reverse().join('-'));
        const today = new Date();
        const diffTime = Math.abs(today - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Comprehensive Business Intelligence Analysis
    analyzeComprehensiveBusinessIntelligence(customers) {
        // This would combine all the advanced analyses
        return this.analyzeGeneralData(customers) + '\n\n' + this.analyzeTrends(customers);
    }
}