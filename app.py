"""
Flask backend server for the Camp Registration Dashboard.
Handles file uploads and calls the preprocessing pipeline.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
import tempfile
import sys

# Add scripts folder to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

from scripts.process_registration import process_registrations

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend server is running'})


@app.route('/api/process', methods=['POST'])
def process_file():
    """
    Process an uploaded file through the pipeline.
    Expects a file upload with the key 'file'
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided',
                'message': 'Please upload a file'
            }), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename',
                'message': 'Please select a file'
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type',
                'message': 'Please upload an Excel file (.xlsx or .xls)'
            }), 400

        # Save file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(temp_path)

        try:
            # Process the file
            results = process_registrations(temp_path)

            return jsonify({
                'success': True,
                'data': results,
                'message': 'File processed successfully'
            }), 200

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': f'Error processing file: {str(e)}'
        }), 500


@app.route('/api/process/raw', methods=['POST'])
def process_raw_file():
    """
    Process a file that already exists on the server.
    Expects JSON with 'file_path' key
    """
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing file_path',
                'message': 'Please provide a file_path'
            }), 400

        file_path = data['file_path']

        if not Path(file_path).exists():
            return jsonify({
                'success': False,
                'error': 'File not found',
                'message': f'File does not exist: {file_path}'
            }), 404

        # Process the file
        results = process_registrations(file_path)

        return jsonify({
            'success': True,
            'data': results,
            'message': 'File processed successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': f'Error processing file: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
