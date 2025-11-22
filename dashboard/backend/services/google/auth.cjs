// backend/services/google/simpleAuth.cjs
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { google } = require('googleapis');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

// Validate that credentials are loaded
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: Google OAuth credentials not loaded from .env file');
  console.error('Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in backend/.env');
}

const SCOPES = [
  'https://www.googleapis.com/auth/forms',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

const TOKEN_PATH = path.join(__dirname, '../../data/token.json');


function hasToken() {
  return fs.existsSync(TOKEN_PATH);
}

function getStoredToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  }
  return null;
}

async function authorize() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured. Check backend/.env file.');
  }

  // Check if we have a valid token
  const storedToken = getStoredToken();
  if (storedToken) {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials(storedToken);
    
    // Check if token is expired and refresh if needed
    if (storedToken.expiry_date && storedToken.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        saveToken(credentials);
        oauth2Client.setCredentials(credentials);
      } catch (err) {
        console.error('Token refresh failed:', err);
        // If refresh fails, proceed to new auth
      }
    }
    
    return oauth2Client;
  }

  // Need new authentication
  throw new Error('No valid token found. Please authenticate first.');
}

function saveToken(token) {
  // Ensure the data directory exists
  const dataDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }
  
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log('Token saved to', TOKEN_PATH);
}

async function getAuthUrl() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error(`OAuth configuration incomplete: CLIENT_ID=${!!CLIENT_ID}, CLIENT_SECRET=${!!CLIENT_SECRET}, REDIRECT_URI=${!!REDIRECT_URI}`);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  return authUrl;
}

async function handleAuthCallback(code) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error(`OAuth configuration incomplete for callback: CLIENT_ID=${!!CLIENT_ID}, CLIENT_SECRET=${!!CLIENT_SECRET}, REDIRECT_URI=${!!REDIRECT_URI}`);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    saveToken(tokens);
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch (err) {
    throw new Error(`Failed to get token: ${err.message}`);
  }
}

function clearToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    console.log('Token cleared');
  }
}

// Callback server for OAuth
let callbackServer = null;

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      resolve();
      return;
    }

    callbackServer = http.createServer((req, res) => {
      const urlObj = new URL(req.url, `http://localhost:3000`);
      
      if (urlObj.pathname === '/auth/callback') {
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        
        if (error) {
          console.error('OAuth error from Google:', error);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <head><title>Authorization Failed</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Authorization Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
        } else if (code) {
          console.log('Authorization code received:', code.substring(0, 20) + '...');
          
          // Exchange code for tokens immediately
          exchangeCodeForToken(code)
            .then(() => {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <head><title>Authorization Successful</title></head>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>✓ Authorization Successful!</h1>
                    <p>You have successfully authorized the application.</p>
                    <p>You can close this window and return to the app.</p>
                  </body>
                </html>
              `);
            })
            .catch(err => {
              console.error('Error exchanging code:', err);
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <head><title>Error</title></head>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>❌ Error</h1>
                    <p>${err.message}</p>
                    <p>Please try again.</p>
                  </body>
                </html>
              `);
            });
        } else {
          res.writeHead(400);
          res.end('Missing authorization code');
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    callbackServer.listen(3000, 'localhost', () => {
      console.log('OAuth callback server listening on http://localhost:3000');
      resolve();
    });

    callbackServer.on('error', (err) => {
      console.error('Callback server error:', err);
      reject(err);
    });
  });
}

function stopCallbackServer() {
  if (callbackServer) {
    callbackServer.close();
    callbackServer = null;
    console.log('OAuth callback server stopped');
  }
}

async function exchangeCodeForToken(code) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error(`OAuth configuration incomplete: CLIENT_ID=${!!CLIENT_ID}, CLIENT_SECRET=${!!CLIENT_SECRET}, REDIRECT_URI=${!!REDIRECT_URI}`);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  
  try {
    console.log('Exchanging authorization code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received successfully');
    saveToken(tokens);
    console.log('Tokens saved to disk');
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch (err) {
    console.error('Failed to exchange code for token:', err.message);
    throw new Error(`Failed to get token: ${err.message}`);
  }
}

module.exports = {
  authorize,
  hasToken,
  getStoredToken,
  saveToken,
  getAuthUrl,
  handleAuthCallback,
  clearToken,
  startCallbackServer,
  stopCallbackServer,
  exchangeCodeForToken,
  REDIRECT_URI,
  SCOPES
};
