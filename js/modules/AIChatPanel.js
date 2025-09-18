import { AIChat } from './AIChat.js';

// AI Chat Panel Module for handling UI interactions
export class AIChatPanel {
    constructor(customerDb = null) {
        this.aiChat = new AIChat(customerDb);
        this.isVisible = false;
        
        // Get DOM elements
        this.backdrop = document.getElementById('ai-chat-panel-backdrop');
        this.panel = document.getElementById('ai-chat-panel');
        this.messagesContainer = document.getElementById('ai-chat-messages');
        this.inputField = document.getElementById('ai-chat-input');
        this.sendButton = document.getElementById('ai-chat-send-btn');
        this.closeButton = document.getElementById('close-ai-chat-panel');
        this.suggestionButtons = document.querySelectorAll('.suggestion-btn');
        this.settingsButton = document.getElementById('ai-chat-settings-btn');
        
        this.connectEventListeners();
    }

    connectEventListeners() {
        // Close button
        this.closeButton.addEventListener('click', () => {
            this.hide();
        });

        // Backdrop click to close
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.hide();
            }
        });

        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in input field
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Suggestion buttons
        this.suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const suggestion = button.getAttribute('data-suggestion');
                this.inputField.value = suggestion;
                this.sendMessage();
            });
        });

        // Settings button
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.showApiKeySettings();
            });
        }
    }

    show() {
        this.backdrop.classList.remove('hide');
        this.isVisible = true;
        this.inputField.focus();
    }

    hide() {
        this.backdrop.classList.add('hide');
        this.isVisible = false;
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        // Check if AI is currently processing
        if (this.aiChat.isCurrentlyProcessing()) {
            this.addMessage('ai', "⏳ Please wait for the current query to complete before sending another one.");
            return;
        }

        // Clear input and disable send button
        this.inputField.value = '';
        this.sendButton.disabled = true;
        this.inputField.disabled = true;

        // Add user message to chat
        this.addMessage('user', message);

        // Show enhanced typing indicator
        this.showEnhancedTypingIndicator();

        try {
            // Process query with AI
            const response = await this.aiChat.processQuery(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response with enhanced formatting
            this.addMessage('ai', response);
            
            // Update suggestions based on the conversation
            this.updateContextualSuggestions(message, response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.removeTypingIndicator();
            this.addMessage('ai', "❌ I encountered an error while processing your request. Please check your API key and try again.");
        } finally {
            // Re-enable input controls
            this.sendButton.disabled = false;
            this.inputField.disabled = false;
            this.inputField.focus();
        }
    }

    // Enhanced typing indicator with more feedback
    showEnhancedTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message ai-typing';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content ai-typing';
        
        const statusText = document.createElement('div');
        statusText.className = 'typing-status';
        statusText.textContent = 'Analyzing your data...';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'typing-dots-container';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'ai-typing-dot';
            dotsContainer.appendChild(dot);
        }
        
        typingContent.appendChild(statusText);
        typingContent.appendChild(dotsContainer);
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingContent);
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();

        // Update status text periodically
        let statusIndex = 0;
        const statusMessages = [
            'Analyzing your data...',
            'Processing with AI...',
            'Generating insights...',
            'Almost ready...'
        ];
        
        this.statusInterval = setInterval(() => {
            statusIndex = (statusIndex + 1) % statusMessages.length;
            if (statusText) {
                statusText.textContent = statusMessages[statusIndex];
            }
        }, 2000);
    }

    // Update contextual suggestions based on conversation
    updateContextualSuggestions(userMessage, aiResponse) {
        const lowerMessage = userMessage.toLowerCase();
        const lowerResponse = aiResponse.toLowerCase();
        
        let newSuggestions = [];
        
        if (lowerMessage.includes('customer') || lowerResponse.includes('customer')) {
            newSuggestions = [
                'Show me my top 5 customers by revenue',
                'Which customers haven\'t visited recently?',
                'List customers with multiple cars'
            ];
        } else if (lowerMessage.includes('mot') || lowerResponse.includes('mot')) {
            newSuggestions = [
                'Show me all MOT services this month',
                'Which cars need MOT renewals?',
                'What\'s my MOT revenue this year?'
            ];
        } else if (lowerMessage.includes('revenue') || lowerMessage.includes('money')) {
            newSuggestions = [
                'What\'s my average invoice value?',
                'Show me this month\'s revenue breakdown',
                'Which services are most profitable?'
            ];
        } else {
            // Default suggestions
            newSuggestions = [
                'What did I do for this current invoice?',
                'Show me recent customer activity',
                'What are my most common services?'
            ];
        }
        
        // Update the suggestions UI
        this.updateSuggestionsUI(newSuggestions);
    }

    // Update suggestions UI
    updateSuggestionsUI(suggestions) {
        const suggestionsContainer = document.querySelector('.ai-chat-suggestions');
        if (!suggestionsContainer) return;
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-btn';
            button.textContent = suggestion;
            button.addEventListener('click', () => {
                this.inputField.value = suggestion;
                this.sendMessage();
            });
            suggestionsContainer.appendChild(button);
        });
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type === 'user' ? 'user-message' : ''}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Format content with better styling
        const formattedContent = this.formatMessageContent(content);
        messageContent.innerHTML = formattedContent;
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
        
        this.messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom with smooth animation
        this.messagesContainer.scrollTo({
            top: this.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    formatMessageContent(content) {
        // Convert markdown-like formatting to HTML
        let formatted = content
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        // Convert bullet points to proper lists
        const lines = formatted.split('<br>');
        let inList = false;
        let result = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('•') || line.startsWith('-')) {
                if (!inList) {
                    result += '<ul>';
                    inList = true;
                }
                result += `<li>${line.substring(1).trim()}</li>`;
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                result += line + '<br>';
            }
        }
        
        if (inList) {
            result += '</ul>';
        }
        
        return result;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message ai-typing';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content ai-typing';
        
        const dot1 = document.createElement('div');
        dot1.className = 'ai-typing-dot';
        const dot2 = document.createElement('div');
        dot2.className = 'ai-typing-dot';
        const dot3 = document.createElement('div');
        dot3.className = 'ai-typing-dot';
        
        typingContent.appendChild(dot1);
        typingContent.appendChild(dot2);
        typingContent.appendChild(dot3);
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingContent);
        
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Clear status interval if it exists
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    // Add scroll to bottom helper
    scrollToBottom() {
        this.messagesContainer.scrollTo({
            top: this.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Method to clear chat history
    clearChat() {
        this.messagesContainer.innerHTML = `
            <div class="ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <p>Hello! I'm your AI Invoice Assistant. I can help you analyze your invoice data, find specific information, and answer questions about your customers and their service history.</p>
                    <p><strong>Try asking me:</strong></p>
                    <ul>
                        <li>"What did I do for this current invoice?"</li>
                        <li>"Show me my top customers by revenue"</li>
                        <li>"Which customers have BMW cars?"</li>
                        <li>"What's my total revenue this month?"</li>
                    </ul>
                </div>
            </div>
        `;
        this.aiChat.clearHistory();
        
        // Reset suggestions to default
        this.updateSuggestionsUI([
            'What did I do for this current invoice?',
            'Show me my top customers',
            'What are my most common services?'
        ]);
    }

    // Method to add a new suggestion button dynamically
    addSuggestion(suggestionText) {
        const suggestionBtn = document.createElement('button');
        suggestionBtn.className = 'suggestion-btn';
        suggestionBtn.textContent = suggestionText;
        suggestionBtn.setAttribute('data-suggestion', suggestionText);
        
        suggestionBtn.addEventListener('click', () => {
            this.inputField.value = suggestionText;
            this.sendMessage();
        });
        
        const suggestionsContainer = document.querySelector('.ai-chat-suggestions');
        suggestionsContainer.appendChild(suggestionBtn);
    }

    // Method to update suggestions based on context
    updateSuggestions(context) {
        const suggestionsContainer = document.querySelector('.ai-chat-suggestions');
        suggestionsContainer.innerHTML = '';
        
        const suggestions = this.getContextualSuggestions(context);
        suggestions.forEach(suggestion => {
            this.addSuggestion(suggestion);
        });
    }

    getContextualSuggestions(context) {
        // Return different suggestions based on the current context
        switch (context) {
            case 'current_invoice':
                return [
                    'What did I do for this current invoice?',
                    'What services are in this invoice?',
                    'What\'s the total cost breakdown?'
                ];
            case 'customer_analysis':
                return [
                    'Show me all BMW customers',
                    'Which customers have the most invoices?',
                    'List all customers with multiple cars'
                ];
            case 'financial_analysis':
                return [
                    'What\'s my total revenue?',
                    'Show me the most expensive invoices',
                    'What\'s my average invoice value?'
                ];
            case 'service_analysis':
                return [
                    'Show me all MOT services',
                    'What services do I perform most?',
                    'List all brake work invoices'
                ];
            default:
                return [
                    'What did I do for this current invoice?',
                    'Show me all customers with BMW cars',
                    'What are the most expensive invoices this year?',
                    'Which customers have the most invoices?',
                    'Show me all MOT services'
                ];
        }
    }

    // Show API key settings dialog
    showApiKeySettings() {
        const currentKey = this.aiChat.apiKey || '';
        const maskedKey = currentKey ? currentKey.substring(0, 8) + '...' : 'Not set';
        
        const systemStatus = this.aiChat.getSystemStatus();
        
        const dialogMessage = `🔑 OpenAI API Key Settings

Current Status: ${currentKey ? '✅ Set' : '❌ Not Set'}
Current Key: ${maskedKey}
Customer Data: ${systemStatus.customerCount} customers loaded

📋 Instructions:
1. Visit https://platform.openai.com/api-keys
2. Create a new API key if you don't have one
3. Copy the key (starts with 'sk-')
4. Paste it below

⚠️ Keep your API key secure and never share it!

Enter your OpenAI API key:`;
        
        const newKey = prompt(dialogMessage, currentKey);
        
        if (newKey !== null) {
            if (newKey.trim()) {
                const trimmedKey = newKey.trim();
                
                // Basic validation
                if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 40) {
                    this.addMessage('ai', '❌ Invalid API key format. OpenAI keys should start with "sk-" and be at least 40 characters long. Please check and try again.');
                    return;
                }
                
                this.aiChat.setApiKey(trimmedKey);
                this.addMessage('ai', `✅ API key updated successfully! 
                
🎯 System Status:
• API Key: ✅ Valid format
• Customer Data: ${systemStatus.customerCount} customers loaded
• Cache: Ready for fast responses

You can now ask me questions about your invoice data!`);
            } else {
                this.aiChat.setApiKey('');
                this.addMessage('ai', '⚠️ API key cleared. You\'ll need to set a valid API key to use the AI chat feature.');
            }
        }
    }

    // Add system diagnostic method
    showSystemDiagnostics() {
        const status = this.aiChat.getSystemStatus();
        const diagnosticMessage = `🔧 AI System Diagnostics

📊 Current Status:
• API Key: ${status.hasApiKey ? '✅ Set' : '❌ Not Set'}
• Processing: ${status.isProcessing ? '⏳ Active' : '✅ Ready'}
• Chat History: ${status.historyLength} messages
• Cache Size: ${status.cacheSize} entries
• Customer Data: ${status.customerCount} customers
• Data Hash: ${status.lastDataHash || 'Not generated'}

💡 Performance Tips:
• Clear chat history if responses seem slow
• Restart the app if data doesn't sync
• Check API key if getting authentication errors

${status.hasApiKey ? '✅ System ready for queries!' : '⚠️ Please set your API key to continue'}`;

        this.addMessage('ai', diagnosticMessage);
    }

    // Add manual data refresh method
    async refreshDataConnection() {
        try {
            // Force refresh the customer database
            if (this.aiChat.customerDb && typeof this.aiChat.customerDb.waitForLoad === 'function') {
                await this.aiChat.customerDb.waitForLoad();
            }
            
            // Clear cache to force fresh analysis
            this.aiChat.cachedAnalysis.clear();
            
            const status = this.aiChat.getSystemStatus();
            this.addMessage('ai', `🔄 Data Connection Refreshed!

📊 Updated Status:
• Customer Data: ${status.customerCount} customers loaded
• Cache: Cleared and ready for fresh analysis
• System: ${status.hasApiKey ? '✅ Ready' : '⚠️ API key needed'}

Try asking your question again!`);
            
        } catch (error) {
            console.error('Error refreshing data connection:', error);
            this.addMessage('ai', '❌ Error refreshing data connection. Please try reloading the page.');
        }
    }

}
