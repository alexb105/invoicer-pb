import { AIChat } from './AIChat.js';

// AI Chat Panel Module for handling UI interactions
export class AIChatPanel {
    constructor() {
        this.aiChat = new AIChat();
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

        // Clear input
        this.inputField.value = '';

        // Add user message to chat
        this.addMessage('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Process query with AI
            const response = await this.aiChat.processQuery(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response
            this.addMessage('ai', response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.removeTypingIndicator();
            this.addMessage('ai', "I'm sorry, I encountered an error while processing your request. Please try again.");
        }
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
    }

    // Method to clear chat history
    clearChat() {
        this.messagesContainer.innerHTML = `
            <div class="ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <p>Hello! I'm your AI Invoice Assistant. I can help you analyze your invoice data, find specific information, and answer questions about your customers and their service history. What would you like to know?</p>
                </div>
            </div>
        `;
        this.aiChat.chatHistory = [];
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
        
        const newKey = prompt(
            `OpenAI API Key Settings\n\nCurrent key: ${maskedKey}\n\nEnter your OpenAI API key (get one from https://platform.openai.com/api-keys):`,
            currentKey
        );
        
        if (newKey !== null) {
            if (newKey.trim()) {
                this.aiChat.setApiKey(newKey.trim());
                this.addMessage('ai', '✅ API key updated successfully! You can now use the AI chat feature.');
            } else {
                this.aiChat.setApiKey('');
                this.addMessage('ai', '⚠️ API key cleared. Please set a valid API key to use the AI chat feature.');
            }
        }
    }
}
