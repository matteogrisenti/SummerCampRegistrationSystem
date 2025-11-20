"""
Main processing pipeline for registration data.
Orchestrates validation and sibling detection.
"""

import pandas as pd
from typing import Dict
from pathlib import Path
import config
from excel_handler import read_registrations, write_results_to_excel, get_column_mapping
from validators import validate_registrations
from sibling_detector import detect_siblings, get_sibling_statistics


def process_registrations(input_path: str, output_path: str = None) -> Dict:
    """
    Complete processing pipeline for camp registrations.
    
    Args:
        input_path: Path to input Excel file
        output_path: Path to output Excel file (defaults to same as input)
        
    Returns:
        Dictionary with processing summary
    """
    if output_path is None:
        output_path = input_path
    
    print("=" * 60)
    print("PARISH CAMP REGISTRATION PROCESSOR")
    print("=" * 60)
    
    # Step 1: Load data
    try:
        print("\n[1/4] Loading registration data...")
        df = read_registrations(input_path)
        total_registrations = len(df)
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    # Step 2: Map columns
    print("\n[2/4] Mapping columns...")
    column_map = get_column_mapping(df)
    
    # Step 3: Validate registrations
    print("\n[3/4] Validating registrations...")
    invalid_df = validate_registrations(df, column_map)
    invalid_count = len(invalid_df)
    valid_count = total_registrations - invalid_count
    
    print(f"  ✓ Valid registrations: {valid_count}")
    print(f"  ✗ Invalid registrations: {invalid_count}")
    
    # Step 4: Detect siblings
    print("\n[4/4] Detecting sibling groups...")
    siblings_df = detect_siblings(df, column_map)
    sibling_stats = get_sibling_statistics(siblings_df)
    
    print(f"  ✓ Families with multiple children: {sibling_stats['total_families_with_siblings']}")
    print(f"  ✓ Children in sibling groups: {sibling_stats['total_children_in_sibling_groups']}")
    
    # Step 5: Write results
    print("\n[5/5] Writing results to Excel...")
    write_results_to_excel(output_path, invalid_df, siblings_df)
    
    # Summary
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"Total Registrations: {total_registrations}")
    print(f"Valid: {valid_count} ({valid_count/total_registrations*100:.1f}%)")
    print(f"Invalid: {invalid_count} ({invalid_count/total_registrations*100:.1f}%)")
    print(f"Sibling Families: {sibling_stats['total_families_with_siblings']}")
    print("=" * 60)
    
    return {
        'total_registrations': total_registrations,
        'valid_count': valid_count,
        'invalid_count': invalid_count,
        'sibling_stats': sibling_stats,
        'output_file': output_path
    }