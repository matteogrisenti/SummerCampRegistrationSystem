// backend/utils/slugify.js
const slugifyLib = require('slugify');

function slugify(name) {
  if (!name) return '';
  return slugifyLib(name, { lower: true, strict: true, locale: 'en' }).replace(/_/g, '-');
}

module.exports = { slugify };