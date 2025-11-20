"""
Registration validation logic.
Checks for missing data, invalid formats, and duplicates.
"""

import pandas as pd
from email_validator import validate_email, EmailNotValidError
from typing import List, Dict
import config


def validate_registrations(df: pd.DataFrame, column_map: Dict[str, str]) -> pd.DataFrame:
    """
    Validate all registrations and identify invalid ones.
    
    Args:
        df: DataFrame with registration data
        column_map: Mapping of config keys to actual column names
        
    Returns:
        DataFrame containing only invalid registrations with reasons
    """
    invalid_records = []
    
    for idx, row in df.iterrows():
        issues = []
        
        # Check required fields
        issues.extend(_check_required_fields(row, column_map))
        
        # Validate email format
        email_issue = _validate_email_format(row, column_map)
        if email_issue:
            issues.append(email_issue)
        
        # Validate age range
        age_issue = _validate_age(row, column_map)
        if age_issue:
            issues.append(age_issue)
        
        # Check for duplicate entries
        duplicate_issue = _check_duplicates(df, row, idx, column_map)
        if duplicate_issue:
            issues.append(duplicate_issue)
        
        if issues:
            record = row.to_dict()
            record['Validation_Issues'] = ' | '.join(issues)
            record['Row_Number'] = idx + 2  # +2 for Excel (1-indexed + header)
            invalid_records.append(record)
    
    if invalid_records:
        invalid_df = pd.DataFrame(invalid_records)
        # Reorder columns to show issues first
        cols = ['Row_Number', 'Validation_Issues'] + [c for c in invalid_df.columns if c not in ['Row_Number', 'Validation_Issues']]
        return invalid_df[cols]
    else:
        # Return empty DataFrame with expected structure
        return pd.DataFrame(columns=['Row_Number', 'Validation_Issues'])


def _check_required_fields(row: pd.Series, column_map: Dict[str, str]) -> List[str]:
    """Check if all required fields are filled."""
    issues = []
    
    for field in config.REQUIRED_FIELDS:
        col_name = column_map.get(field)
        if col_name and (pd.isna(row[col_name]) or str(row[col_name]).strip() == ''):
            issues.append(f"Missing {field.replace('_', ' ')}")
    
    return issues


def _validate_email_format(row: pd.Series, column_map: Dict[str, str]) -> str:
    """Validate email format using email-validator library."""
    email_col = column_map.get('parent_email')
    
    if not email_col or pd.isna(row[email_col]):
        return None
    
    email = str(row[email_col]).strip()
    
    try:
        # Validate and normalize email
        valid = validate_email(email, check_deliverability=False)
        return None
    except EmailNotValidError as e:
        return f"Invalid email format: {str(e)}"


def _validate_age(row: pd.Series, column_map: Dict[str, str]) -> str:
    """Validate child age is within acceptable range."""
    age_col = column_map.get('child_age')
    
    if not age_col or pd.isna(row[age_col]):
        return None
    
    try:
        age = int(row[age_col])
        
        if config.MIN_AGE and age < config.MIN_AGE:
            return f"Age {age} below minimum ({config.MIN_AGE})"
        
        if config.MAX_AGE and age > config.MAX_AGE:
            return f"Age {age} above maximum ({config.MAX_AGE})"
        
    except (ValueError, TypeError):
        return f"Invalid age value: {row[age_col]}"
    
    return None


def _check_duplicates(
    df: pd.DataFrame, 
    row: pd.Series, 
    current_idx: int,
    column_map: Dict[str, str]
) -> str:
    """Check if this registration is a duplicate based on child name and parent email."""
    child_col = column_map.get('child_name')
    email_col = column_map.get('parent_email')
    
    if not child_col or not email_col:
        return None
    
    if pd.isna(row[child_col]) or pd.isna(row[email_col]):
        return None
    
    child_name = str(row[child_col]).strip().lower()
    parent_email = str(row[email_col]).strip().lower()
    
    # Check for exact matches in earlier rows
    for idx in range(current_idx):
        other_row = df.iloc[idx]
        
        if pd.isna(other_row[child_col]) or pd.isna(other_row[email_col]):
            continue
        
        other_child = str(other_row[child_col]).strip().lower()
        other_email = str(other_row[email_col]).strip().lower()
        
        if child_name == other_child and parent_email == other_email:
            return f"Duplicate of row {idx + 2}"
    
    return None