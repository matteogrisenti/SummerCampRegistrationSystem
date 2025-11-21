# 🏕️ Summer Camp Registration System

A simple, maintainable system for processing camp registrations collected via Google Forms.

## 📋 Overview

This system allows you to:
- Collect registrations via Google Forms
- Export data to Excel and process it:
  - ✅ Validate all registrations
  - 🔍 Detect invalid entries
  - 👨‍👩‍👧 Find sibling groups
  - 💾 Add results as new sheets in the Excel file
- View results in a clean web dashboard


## 🏗️ System Architecture
```
Google Form → Google Sheets → Export Excel → Dashboard
```
1. **Collection**: Parents fill out Google Form
2. **Export**: Download responses as Excel file
3. **Process**: Upload the Exel file thorugh the Dashboard
4. **View**: Visualize in the dashboard to see results

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher (for dashboard)
- A Google Form with responses exported as Excel

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd camp-registration-system

# Install Python dependencies
pip install -r requirements.txt

# Setup dashboard
cd dashboard
npm install
cd ..
```

### 2. Configure Column Names

Edit `scripts/config.py` to match your Google Form column names:

```python
COLUMNS = {
    'timestamp': 'Timestamp',
    'child_name': 'Child Full Name',
    'child_age': 'Child Age',
    'parent_name': 'Parent/Guardian Name',
    'parent_email': 'Parent Email',
    'phone': 'Phone Number',
    'allergies': 'Allergies/Medical Info',
    'emergency_contact': 'Emergency Contact',
}
```

### 3. Start Backend Server
```bash
python start_backend.py
```

### 4. Start Dashboard
```bash
cd dashboard
npm run dev
```

Open http://localhost:3000 and upload your processed Excel file.


## 🔧 Customization

### Adjust Validation Rules

Edit `scripts/config.py`:

```python
# Required fields
REQUIRED_FIELDS = [
    'child_name',
    'parent_name', 
    'parent_email',
    'phone'
]

# Age limits (set to None to disable)
MIN_AGE = 5
MAX_AGE = 16
```

### Add Custom Validators

Create a new function in `scripts/validators.py`:

```python
def _check_custom_rule(row: pd.Series, column_map: Dict[str, str]) -> str:
    """Your custom validation logic."""
    # Return error message string or None if valid
    pass
```

Then add it to the validation pipeline in `validate_registrations()`.

## 📁 Output Files

After processing, your Excel file will contain:

1. **Form Responses 1** (original data)
2. **Invalid_Registrations** (entries with issues)
3. **Possible_Siblings** (families with multiple children)

## 🎯 Future Extensions

This system is designed to be easily extended. Here are some ideas:

### Payment Tracking
```python
# scripts/payment_tracker.py
def track_payments(df, column_map):
    """Track which families have paid registration fees."""
    # Add payment status column
    # Generate payment reminders
    pass
```

### Waiting List Management
```python
# scripts/waiting_list.py
def manage_waiting_list(df, max_capacity):
    """Handle registrations beyond capacity."""
    # Sort by timestamp
    # Mark as waitlisted
    pass
```

### QR Code Badges
```python
# scripts/badge_generator.py
import qrcode

def generate_badges(df):
    """Create QR code badges for each child."""
    # Generate unique IDs
    # Create QR codes
    # Output printable PDFs
    pass
```

### Email Notifications
```python
# scripts/email_sender.py
def send_confirmations(df):
    """Send confirmation emails to parents."""
    # Use SMTP or email service API
    # Send personalized confirmations
    pass
```

## 🐛 Troubleshooting

### "Column not found" errors

Check that your column names in `config.py` match exactly with your Google Form. Column names are case-sensitive.

### Excel file not found

Ensure:
1. File is named exactly `registrations.xlsx`
2. File is in the `data/` folder
3. You're running the script from the repository root

### Dashboard shows no data

Make sure you:
1. Ran `python run_processing.py` first
2. Are uploading the processed Excel file (not the original)
3. The Excel file contains the expected sheet names

## 📝 Workflow Summary

**Weekly Update Process:**

```bash
# 1. Export latest data from Google Sheets
# 2. Replace data/registrations.xlsx
# 3. Run processing
python run_processing.py

# 4. View in dashboard
cd dashboard
npm run dev
# Upload the processed Excel file
```

## 🤝 Contributing

To add new features:

1. Create a new module in `scripts/`
2. Import and call from `processor.py`
3. Add configuration options to `config.py`
4. Update documentation

## 📄 License

This project is open source and available for parish use.

## 💬 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the code comments
3. Open an issue in the repository

---

Built with ❤️ for parish summer camps