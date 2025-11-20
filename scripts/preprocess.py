"""
Preprocessing script to handle raw data file uploads and automatic processing.
This script is called from the backend API when a file is uploaded.
"""

import json
import sys
from pathlib import Path
from process_registration import process_registrations


def preprocess_file(input_file_path: str) -> dict:
    """
    Preprocess a raw data file and return results as JSON.
    
    Args:
        input_file_path: Path to the uploaded Excel file
        
    Returns:
        Dictionary with processing results
    """
    try:
        # Process the file using the main processor pipeline
        results = process_registrations(input_file_path)
        
        return {
            'success': True,
            'data': results,
            'message': 'File processed successfully'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'message': f'Error processing file: {str(e)}'
        }


if __name__ == "__main__":
    # Command-line usage: python preprocess.py <input_file_path>
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Missing input file path',
            'message': 'Usage: python preprocess.py <input_file_path>'
        }))
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not Path(input_file).exists():
        print(json.dumps({
            'success': False,
            'error': f'File not found: {input_file}',
            'message': 'The specified file does not exist'
        }))
        sys.exit(1)
    
    result = preprocess_file(input_file)
    print(json.dumps(result, indent=2))
