// backend/services/google/auth.cjs
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const open = require('open');

// Prefer storing client credentials in environment variables for security.
// Fallback to credentials.json only if env vars are not provided.
const CREDENTIALS_PATH = path.join(__dirname, '..', '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '..', 'data', 'token.json');

// Scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

function checkCredentials() {
  // True if env vars are present or credentials.json exists
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) || fs.existsSync(CREDENTIALS_PATH);
}

function getCredentialsPath() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return 'env:GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET';
  }
  return fs.existsSync(CREDENTIALS_PATH) ? CREDENTIALS_PATH : null;
}

function ensureTokenDir() {
  const dir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function authorize() {
  // Determine client credentials: env vars take precedence
  const envClientId = process.env.GOOGLE_CLIENT_ID;
  const envClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const envRedirect = process.env.GOOGLE_REDIRECT_URI;

  let clientId = envClientId;
  let clientSecret = envClientSecret;
  let redirectUri = envRedirect;

  if (!clientId || !clientSecret) {
    // Fallback to credentials.json if available
    if (fs.existsSync(CREDENTIALS_PATH)) {
      const content = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      const creds = content.installed || content.web;
      clientId = clientId || creds.client_id;
      clientSecret = clientSecret || creds.client_secret;
      redirectUri = redirectUri || (creds.redirect_uris && creds.redirect_uris[0]);
    }
  }

  // Provide sensible default for redirect URI if not supplied
  if (!redirectUri) {
    redirectUri = 'http://localhost:3000/auth/callback';
  }

  // Create OAuth2 client even if clientId/secret are missing so we can attempt
  // to reuse an existing token. If there's no token and no client credentials,
  // we'll error later when attempting interactive auth.
  const oAuth2Client = new google.auth.OAuth2(clientId || '', clientSecret || '', redirectUri);

  // If token already saved, reuse it immediately (allow token-only operation)
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } catch (err) {
      // If token file is corrupt, remove it and continue to re-auth
      try { fs.unlinkSync(TOKEN_PATH); } catch (_) {}
    }
  }

  // Generate consent URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  // If we reached here we need to perform interactive auth. Ensure we have
  // client credentials available (env or credentials.json). If not, throw.
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth client credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment or provide a credentials.json file to perform initial authorization.');
  }

  console.log('Authorize this app by visiting this url:', authUrl);
  await open(authUrl);

  // Prompt for code (simple CLI fallback). Desktop apps may implement a local callback server instead.
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const code = await new Promise((resolve) => {
    rl.question('Enter the code from that page here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Ensure token directory exists and store token
  ensureTokenDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('Token stored to', TOKEN_PATH);
  return oAuth2Client;
}

module.exports = { authorize, SCOPES, checkCredentials, getCredentialsPath };

