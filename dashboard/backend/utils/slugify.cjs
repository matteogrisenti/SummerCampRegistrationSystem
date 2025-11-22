// backend/utils/slugify.js
/*
  * Utility function to generate URL-friendly slugs from names
*/
const slugifyLib = require('slugify');

function slugify(name) {
  if (!name) return '';
  return slugifyLib(name, { lower: true, strict: true, locale: 'en' }).replace(/_/g, '-');
}

module.exports = { slugify };