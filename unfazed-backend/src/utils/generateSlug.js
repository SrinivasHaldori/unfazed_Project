const Therapist = require('../models/Therapist');

/**
 * Generates a clean URL-friendly slug from a therapist's name.
 * Handles collisions by appending incremental digits (e.g., dr-anjali-sharma-2).
 */
const generateUniqueSlug = async (name, currentTherapistId = null) => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')      // replace spaces with hyphens
    .replace(/-+/g, '-');      // remove duplicate hyphens

  // Ensure 'dr-' prefix if appropriate or just clean slug
  if (!baseSlug.startsWith('dr-') && name.toLowerCase().startsWith('dr')) {
    baseSlug = baseSlug.replace(/^dr\s*/, 'dr-');
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Therapist.findOne({
      slug,
      ...(currentTherapistId ? { _id: { $ne: currentTherapistId } } : {}),
    }).select('_id');

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

module.exports = { generateUniqueSlug };
