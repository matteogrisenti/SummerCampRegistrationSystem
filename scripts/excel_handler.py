"""
Excel file handling utilities.
Reads and writes Excel files with multiple sheets.
"""

import pandas as pd
from pathlib import Path
from typing import Dict
import config


def read_registrations(file_path: str) -> pd.DataFrame:
    """
    Read the main registration data from Excel file.
    
    Args:
        file_path: Path to the Excel file
        
    Returns:
        DataFrame containing registration data
        
    Raises:
        FileNotFoundError: If the Excel file doesn't exist
        ValueError: If the source sheet is not found
    """
    file_path = '../' + file_path  # Adjust path to parent directory
    if not Path(file_path).exists():
        raise FileNotFoundError(f"Excel file not found: {file_path}")
    
    try:
        df = pd.read_excel(file_path, sheet_name=config.SOURCE_SHEET)
        print(f"✓ Loaded {len(df)} registrations from {config.SOURCE_SHEET}")
        return df
    except ValueError as e:
        raise ValueError(
            f"Sheet '{config.SOURCE_SHEET}' not found in Excel file.\n"
            f"SOLUTION: check the SOURCE_SHEET field in config.py\n"
            f"Available sheets: {pd.ExcelFile(file_path).sheet_names}"
        ) from e


def write_results_to_excel(
    file_path: str,
    invalid_df: pd.DataFrame,
    siblings_df: pd.DataFrame
) -> None:
    """
    Write processing results to new sheets in the same Excel file.
    Preserves the original data sheet.
    
    Args:
        file_path: Path to the Excel file
        invalid_df: DataFrame with invalid registrations
        siblings_df: DataFrame with sibling groups
    """
    file_path = '../' + file_path  # Adjust path to parent directory
    # Read existing data to preserve it
    with pd.ExcelFile(file_path) as xls:
        existing_sheets = {
            sheet: pd.read_excel(xls, sheet_name=sheet) 
            for sheet in xls.sheet_names
        }
    
    # Add new sheets
    existing_sheets[config.INVALID_SHEET] = invalid_df
    existing_sheets[config.SIBLINGS_SHEET] = siblings_df
    
    # Write all sheets back
    with pd.ExcelWriter(file_path, engine='openpyxl', mode='w') as writer:
        for sheet_name, df in existing_sheets.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    print(f"✓ Results written to {file_path}")
    print(f"  - {config.INVALID_SHEET}: {len(invalid_df)} entries")
    print(f"  - {config.SIBLINGS_SHEET}: {len(siblings_df)} groups")


def get_column_mapping(df: pd.DataFrame) -> Dict[str, str]:
    """
    Map config column names to actual column names in the DataFrame.
    Helps handle variations in column naming.
    
    Args:
        df: DataFrame to check columns
        
    Returns:
        Dictionary mapping config keys to actual column names
    """
    actual_columns = df.columns.tolist()
    mapping = {}
    
    for key, expected_name in config.COLUMNS.items():
        if expected_name in actual_columns:
            mapping[key] = expected_name
        else:
            # Try to find similar column name
            similar = [col for col in actual_columns if expected_name.lower() in col.lower()]
            if similar:
                mapping[key] = similar[0]
                print(f"⚠ Using '{similar[0]}' for {key} (expected '{expected_name}')")
            else:
                print(f"⚠ Column '{expected_name}' not found for {key}")
                mapping[key] = None
    
    return mapping