# AI Chat Feature for Invoice Manager (ChatGPT Integration)

## Overview

The AI Chat feature is an intelligent assistant powered by ChatGPT that can analyze your invoice data and answer questions about customers, services, and financial information. It provides natural language interaction with your invoice database using OpenAI's advanced language model.

## Features

### 🤖 ChatGPT-Powered Intelligence
- Advanced natural language understanding via OpenAI GPT-3.5-turbo
- Context-aware responses with full invoice data analysis
- Intelligent business insights and recommendations
- Real-time API integration with OpenAI

### 📊 Data Analysis Capabilities
- Customer analysis by car brand
- Invoice value analysis
- Service type breakdown
- Financial summaries
- MOT service tracking

### 💬 Interactive Chat Interface
- Modern chat UI with message bubbles
- Typing indicators and smooth animations
- Suggestion buttons for quick queries
- API key management with settings button
- Responsive design for all devices

## How to Use

### 1. Setting Up Your API Key
- **First time setup**: You'll be prompted to enter your OpenAI API key
- **Get API key**: Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Manage key**: Click the ⚙️ settings button in the chat panel to update your API key
- **Security**: Your API key is stored locally in your browser

### 2. Accessing the AI Chat
- Click the "🤖 AI Chat" button in the top navigation bar
- The chat panel will open in a modal overlay

### 3. Asking Questions
You can ask questions in natural language, such as:

**Customer Queries:**
- "Show me all customers with BMW cars"
- "Which customers have the most invoices?"
- "List all customers with multiple cars"

**Invoice Queries:**
- "What are the most expensive invoices?"
- "Show me invoices from 2024"
- "What's my total revenue this year?"

**Service Queries:**
- "Show me all MOT services"
- "What services do I perform most?"
- "List all brake work invoices"

**Financial Queries:**
- "What's my total revenue?"
- "What's my average invoice value?"
- "Show me monthly revenue breakdown"

### 4. Using Suggestions
- Click on suggestion buttons for quick queries
- Suggestions adapt based on context
- Use as starting points for more specific questions

## API Key Setup

### Getting Your OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-`)

### Setting Up in the App
1. Open the AI Chat panel
2. Click the ⚙️ settings button
3. Paste your API key when prompted
4. The key is stored securely in your browser's localStorage

### Cost Information
- Uses OpenAI's GPT-3.5-turbo model
- Typical cost: ~$0.002 per 1K tokens
- Average query costs less than $0.01
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## Technical Implementation

### Architecture
The AI Chat feature consists of two main modules:

1. **AIChat.js** - ChatGPT API integration and data processing
2. **AIChatPanel.js** - UI management and user interactions

### Data Processing
- Scans through all customer and invoice data
- Sends comprehensive data context to ChatGPT API
- Receives intelligent, formatted responses from OpenAI
- Maintains conversation history for context

### ChatGPT Integration
- Uses OpenAI GPT-3.5-turbo model for intelligent responses
- Sends comprehensive invoice data as context to ChatGPT
- Maintains conversation history for better context understanding
- Handles API errors gracefully with user-friendly messages
- Supports natural language queries without predefined patterns

## Example Queries and Responses

### Customer Analysis
**Query:** "Show me all BMW customers"
**Response:**
```
I found 3 customer(s) with BMW cars:

1. **Charles Web**
   - Car: BMW 3 Series
   - Registration: S300WEB
   - Invoices: 1

2. **Neil**
   - Car: BMW 635 convertible
   - Registration: N90NRD
   - Invoices: 0
```

### Financial Analysis
**Query:** "What's my total revenue?"
**Response:**
```
Financial Summary:

- Total Revenue: £2,847.50
- Total Invoices: 12
- Average Invoice Value: £237.29
- Estimated Monthly Average: £237.29
```

### Service Analysis
**Query:** "Show me all MOT services"
**Response:**
```
I found 4 MOT service(s):

1. **Charles Web** - BMW 3 Series
   - Date: 31/3/2025
   - Total: £417.22
   - Registration: S300WEB

2. **Tom Web** - Ford Focus
   - Date: 28/3/2025
   - Total: £325.18
   - Registration: EO60ZHE
```

## Customization

### Adding New Query Types
To add support for new query types:

1. Add intent detection in `analyzeIntent()` method
2. Create data extraction method in `getRelevantData()`
3. Add response generation method in `generateResponse()`

### Styling
The chat interface uses CSS classes that can be customized:
- `.ai-chat-modal` - Main chat container
- `.ai-message` / `.user-message` - Message styling
- `.message-content` - Message bubble styling
- `.suggestion-btn` - Suggestion button styling

## Browser Compatibility
- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+

## Performance Considerations
- Data processing is done client-side
- Large datasets may impact response time
- Consider implementing pagination for very large customer bases

## Future Enhancements
- Machine learning for better query understanding
- Voice input support
- Export chat conversations
- Advanced filtering options
- Integration with external AI services

## Troubleshooting

### Common Issues
1. **No response from AI**
   - Check browser console for errors
   - Ensure customer data is loaded
   - Verify query is in supported format

2. **Incorrect data in responses**
   - Check customer database integrity
   - Verify invoice data structure
   - Clear browser cache if needed

3. **UI not displaying correctly**
   - Check CSS file is loaded
   - Verify HTML structure
   - Test in different browsers

### Debug Mode
Enable debug logging by opening browser console and checking for error messages during AI chat interactions.

## Support
For issues or feature requests related to the AI Chat feature, please check the main application documentation or contact the development team.
