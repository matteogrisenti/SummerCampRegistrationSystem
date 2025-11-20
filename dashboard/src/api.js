/**
 * API client for communicating with the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = {
  /**
   * Upload and process a file
   * @param {File} file - The Excel file to upload
   * @returns {Promise<Object>} Processing results
   */
  async processFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to process file')
    }

    return response.json()
  },

  /**
   * Process a file that already exists on the server
   * @param {string} filePath - Path to the file on the server
   * @returns {Promise<Object>} Processing results
   */
  async processRawFile(filePath) {
    const response = await fetch(`${API_BASE_URL}/process/raw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_path: filePath }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to process file')
    }

    return response.json()
  },

  /**
   * Check if backend is available
   * @returns {Promise<boolean>} True if backend is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  },
}
