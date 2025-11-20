# Camp Registration System - Repository Structure

```graphql
camp-registration-system/
│
├── data/
│   ├── registrations.xlsx          # Main data file (exported from Google Sheets)
│   └── .gitkeep
│
├── scripts/
│   ├── __init__.py
│   ├── processor.py                # Main processing pipeline
│   ├── validators.py               # Validation logic
│   ├── sibling_detector.py         # Sibling detection logic
│   ├── excel_handler.py            # Excel read/write utilities
│   └── config.py                   # Configuration settings
│
├── dashboard/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RegistrationStats.jsx
│   │   │   ├── InvalidTable.jsx
│   │   │   └── SiblingsTable.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt                # Python dependencies
├── .gitignore
├── run_processing.py              # Main entry point for processing
└── README.md                      # Complete setup instructions
```

## Key Design Decisions

### Python for Processing
- **pandas**: Excellent Excel handling with openpyxl
- **email-validator**: Robust email validation
- **Clear separation**: Each module handles one responsibility

### React + Vite for Dashboard
- **Fast development**: Hot module replacement
- **Modern**: Uses latest React patterns
- **SheetJS**: Client-side Excel parsing
- **No backend needed**: Reads Excel directly in browser

### Extensibility Built-in
- Modular design allows easy addition of:
  - Payment tracking module
  - Waiting list management
  - QR code generation
  - Email notification system
  - Custom report generators