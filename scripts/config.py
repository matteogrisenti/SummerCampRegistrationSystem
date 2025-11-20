"""
Configuration settings for the registration processing system.
"""

# File paths
DATA_FOLDER = "data"
INPUT_FILE = "registrations_test.xlsx"
OUTPUT_FILE = "registrations_test.xlsx"  # Same file, adds sheets

# Sheet names
SOURCE_SHEET = "Registrations"  # Default Google Forms sheet name
INVALID_SHEET = "Invalid_Registrations"
SIBLINGS_SHEET = "Possible_Siblings"

# Column names (adjust these to match your Google Form)
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

# Validation rules
REQUIRED_FIELDS = [
    'child_name',
    'parent_name', 
    'parent_email',
    'phone'
]

# Age limits (optional - set to None to disable)
MIN_AGE = 5
MAX_AGE = 16