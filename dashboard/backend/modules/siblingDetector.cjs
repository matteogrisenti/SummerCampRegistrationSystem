/**
 * Sibling detection logic
 * Identifies possible sibling groups based on shared characteristics
 */

const CONFIG = require('./config.cjs');

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  str1 = String(str1).toLowerCase().trim();
  str2 = String(str2).toLowerCase().trim();
  
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Check if two registrations might be siblings
 */
function areSiblings(reg1, reg2) {
  let matchScore = 0;
  let matchCount = 0;

  // Check last name similarity
  if (CONFIG.siblings.considerLastName) {
    const lastName1 = String(reg1['Last Name'] || '').split(' ').pop();
    const lastName2 = String(reg2['Last Name'] || '').split(' ').pop();
    const similarity = stringSimilarity(lastName1, lastName2);
    matchScore += similarity;
    matchCount++;
  }

  // Check parent name/email match
  const parentMatch =
    String(reg1['Parent Email'] || '').toLowerCase() === String(reg2['Parent Email'] || '').toLowerCase() ||
    String(reg1['Parent Name'] || '').toLowerCase() === String(reg2['Parent Name'] || '').toLowerCase();

  if (parentMatch) {
    matchScore += 1;
    matchCount++;
  }

  // Check date of birth similarity (siblings likely born within 15 years)
  if (CONFIG.siblings.considerDateOfBirth && reg1['Date of Birth'] && reg2['Date of Birth']) {
    try {
      const dob1 = new Date(reg1['Date of Birth']);
      const dob2 = new Date(reg2['Date of Birth']);
      const ageDiff = Math.abs(dob1.getFullYear() - dob2.getFullYear());
      if (ageDiff <= 15) {
        matchScore += 0.8;
        matchCount++;
      }
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  // Check phone number
  if (CONFIG.siblings.considerPhone && reg1['Parent Phone'] && reg2['Parent Phone']) {
    if (String(reg1['Parent Phone']).replace(/\D/g, '') === String(reg2['Parent Phone']).replace(/\D/g, '')) {
      matchScore += 1;
      matchCount++;
    }
  }

  if (matchCount === 0) return false;

  const avgScore = matchScore / matchCount;
  return avgScore >= CONFIG.siblings.matchThreshold;
}

/**
 * Detect all sibling groups
 */
function detectSiblings(registrations) {
  const groups = [];
  const grouped = new Set();

  for (let i = 0; i < registrations.length; i++) {
    if (grouped.has(i)) continue;

    const group = [registrations[i]];
    grouped.add(i);

    for (let j = i + 1; j < registrations.length; j++) {
      if (grouped.has(j)) continue;

      if (areSiblings(registrations[i], registrations[j])) {
        group.push(registrations[j]);
        grouped.add(j);
      }
    }

    // Only include groups with 2+ children
    if (group.length > 1) {
      groups.push({
        familyId: `FAM_${groups.length + 1}`,
        children: group.length,
        parentName: group[0]['Parent Name'],
        parentEmail: group[0]['Parent Email'],
        childrenNames: group.map(r => `${r['First Name']} ${r['Last Name']}`).join(', '),
        members: group
      });
    }
  }

  return groups;
}

/**
 * Get sibling statistics
 */
function getSiblingStatistics(siblingGroups) {
  return {
    totalFamiliesWithSiblings: siblingGroups.length,
    totalChildrenInSiblingGroups: siblingGroups.reduce((sum, g) => sum + g.children, 0),
    largestFamilySize: siblingGroups.length > 0 ? Math.max(...siblingGroups.map(g => g.children)) : 0,
    averageFamilySize: siblingGroups.length > 0 
      ? (siblingGroups.reduce((sum, g) => sum + g.children, 0) / siblingGroups.length).toFixed(2)
      : 0,
  };
}

module.exports = {
  detectSiblings,
  getSiblingStatistics,
  stringSimilarity,
  areSiblings,
};
