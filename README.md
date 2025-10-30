# Expense Tracker

A modern, responsive Progressive Web App (PWA) for tracking daily expenses and income. Built with vanilla JavaScript, HTML5, and CSS3.

## Features

- **💰 Balance Tracking**: Real-time calculation of total balance, income, and expenses
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🔄 PWA Support**: Install as a native app with offline functionality
- **💾 Local Storage**: Data persists locally in your browser
- **⚡ Fast & Lightweight**: No external dependencies, loads instantly
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations
- **↩️ Undo Feature**: Accidentally deleted a transaction? Undo it within 5 seconds
- **🔄 Reset Option**: Clear all transactions with confirmation dialog

## Screenshots

The app features a clean, card-based design with:
- Balance summary cards showing total balance, income, and expenses
- Easy-to-use transaction form with income/expense toggle
- Transaction history with delete and undo functionality

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software or dependencies required

### Installation

1. **Clone or download** this repository to your local machine
2. **Open** `index.html` in your web browser
3. **Optional**: Install as a PWA by clicking the install button in your browser

### Usage

1. **Add Transactions**:
   - Enter a transaction title
   - Select "Income" or "Expense"
   - Enter the amount (always positive)
   - Click "Add Transaction"

2. **View Summary**:
   - Total balance is calculated automatically
   - Income and expenses are displayed separately
   - All values update in real-time

3. **Manage Transactions**:
   - View all transactions in the history panel
   - Delete unwanted transactions
   - Use the undo feature if you delete by mistake
   - Reset all data using the "Reset" button

## Technical Details

### Architecture

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: Browser LocalStorage API
- **PWA**: Service Worker for offline functionality
- **Styling**: Custom CSS with CSS Grid and Flexbox

### File Structure

```
expense-tracker-app-main/
├── index.html          # Main HTML file
├── app.js             # Application logic
├── styles.css         # Styling and animations
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker for offline support
├── icons/             # App icons for PWA
│   ├── Favicon.png
│   ├── icon-192.png
│   └── icon-512.png
└── README.md          # This file
```

### Key Features Implementation

- **Data Persistence**: Uses `localStorage` with error handling
- **Currency Formatting**: Utilizes `Intl.NumberFormat` for proper currency display
- **Animations**: CSS animations for smooth user interactions
- **Accessibility**: ARIA labels and semantic HTML
- **Form Validation**: Client-side validation with user-friendly error messages

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

This is a standalone project, but feel free to:
1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

Potential features for future versions:
- Categories for transactions
- Date filtering and search
- Data export functionality
- Multiple currency support
- Charts and analytics
- Cloud sync capabilities

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure JavaScript is enabled in your browser
3. Try clearing browser cache and localStorage
4. Use a supported browser version

---

**Made with ❤️ using vanilla JavaScript**
