"""
Sibling detection logic.
Groups registrations by parent email to identify potential siblings.
"""

import pandas as pd
from typing import Dict, List


def detect_siblings(df: pd.DataFrame, column_map: Dict[str, str]) -> pd.DataFrame:
    """
    Detect potential siblings by grouping registrations with the same parent email.
    
    Args:
        df: DataFrame with registration data
        column_map: Mapping of config keys to actual column names
        
    Returns:
        DataFrame with sibling groups
    """
    email_col = column_map.get('parent_email')
    child_col = column_map.get('child_name')
    
    if not email_col or not child_col:
        print("⚠ Cannot detect siblings: missing email or child name columns")
        return pd.DataFrame(columns=['Parent_Email', 'Number_of_Children', 'Children_Names', 'Row_Numbers'])
    
    # Filter out rows with missing data
    valid_df = df[df[email_col].notna() & df[child_col].notna()].copy()
    
    # Normalize emails for grouping
    valid_df['_normalized_email'] = valid_df[email_col].str.strip().str.lower()
    
    # Group by parent email
    sibling_groups = []
    
    for email, group in valid_df.groupby('_normalized_email'):
        # Only include groups with 2+ children
        if len(group) >= 2:
            children_names = group[child_col].tolist()
            row_numbers = (group.index + 2).tolist()  # +2 for Excel numbering
            
            sibling_groups.append({
                'Parent_Email': group[email_col].iloc[0],  # Use original email format
                'Number_of_Children': len(group),
                'Children_Names': ', '.join(str(name) for name in children_names),
                'Row_Numbers': ', '.join(str(num) for num in row_numbers),
                'Total_Age': group[column_map.get('child_age')].sum() if column_map.get('child_age') else None
            })
    
    if sibling_groups:
        siblings_df = pd.DataFrame(sibling_groups)
        # Sort by number of children (descending)
        siblings_df = siblings_df.sort_values('Number_of_Children', ascending=False)
        return siblings_df
    else:
        return pd.DataFrame(columns=['Parent_Email', 'Number_of_Children', 'Children_Names', 'Row_Numbers'])


def get_sibling_statistics(siblings_df: pd.DataFrame) -> Dict:
    """
    Calculate statistics about sibling groups.
    
    Args:
        siblings_df: DataFrame with sibling groups
        
    Returns:
        Dictionary with statistics
    """
    if len(siblings_df) == 0:
        return {
            'total_families_with_siblings': 0,
            'total_children_in_sibling_groups': 0,
            'largest_family_size': 0,
            'average_children_per_family': 0
        }
    
    total_families = len(siblings_df)
    total_children = siblings_df['Number_of_Children'].sum()
    largest_family = siblings_df['Number_of_Children'].max()
    avg_children = siblings_df['Number_of_Children'].mean()
    
    return {
        'total_families_with_siblings': total_families,
        'total_children_in_sibling_groups': int(total_children),
        'largest_family_size': int(largest_family),
        'average_children_per_family': round(avg_children, 2)
    }