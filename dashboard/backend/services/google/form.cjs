// backend/services/google/forms.js
const { google } = require('googleapis');

async function createForm(auth, title) {
  const forms = google.forms({ version: 'v1', auth });
  const res = await forms.forms.create({
    requestBody: {
      info: { title }
    }
  });
  return res.data; // contiene formId in res.data.name (resource name) e res.data.responderUri
}

// Aggiungi domande semplici (text questions)
async function addQuestions(auth, formId, fields, requiredFields = []) {
  const forms = google.forms({ version: 'v1', auth });
  // formId qui è il resource name: "forms/<formId>" oppure l'id puro? googleapis ritorna .name = "forms/xxxxx"
  // ensure we pass the correct formId; if we have name like "forms/ID" pass it.
  const requests = [];

  // fields: array of { key, label }
  fields.forEach((f, idx) => {
    const question = {
      createItem: {
        item: {
          title: f.label,
          questionItem: {
            question: {
              required: requiredFields.includes(f.key),
              textQuestion: {}
            }
          }
        },
        location: { index: idx }
      }
    };
    requests.push(question);
  });

  const res = await forms.forms.batchUpdate({
    formId: formId.startsWith('forms/') ? formId.split('/')[1] : formId,
    requestBody: { requests }
  });

  return res.data;
}

module.exports = { createForm, addQuestions };
