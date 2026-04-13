const API_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/itstartswiththestars.wordpress.com/posts/?number=50&fields=ID,title,date,modified,slug,excerpt,content,featured_image,tags,categories';

const SMALL_WORDS = new Set(['a', 'an', 'the', 'in', 'of', 'for', 'and', 'but', 'or', 'at', 'to', 'by']);

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !SMALL_WORDS.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

function isAllCaps(str) {
  const letters = str.replace(/[^a-zA-Z]/g, '');
  return letters.length > 1 && letters === letters.toUpperCase();
}

function cleanText(text) {
  if (!text) return '';

  // Multiple spaces to single space
  text = text.replace(/ {2,}/g, ' ');

  // Normalize dots: 2, 4, or 5+ dots become ellipsis; 3 dots also become ellipsis
  // But leave single dots alone
  text = text.replace(/\.{5,}/g, '\u2026');
  text = text.replace(/\.{4}/g, '\u2026');
  text = text.replace(/\.{3}/g, '\u2026');
  text = text.replace(/\.{2}/g, '\u2026');

  // Fix spacing before punctuation: "word ," -> "word,"
  text = text.replace(/\s+([,.])/g, '$1');

  // Fix missing space after punctuation (but not URLs or abbreviations)
  // Match period/comma followed by a letter, but not if preceded by a letter-dot pattern (abbreviation)
  // or if it looks like a URL (has :// or www nearby)
  text = text.replace(/([.])([A-Z][a-z])/g, (match, punct, next, offset) => {
    // Check if this is part of a URL
    const before = text.substring(Math.max(0, offset - 10), offset);
    if (before.includes('://') || before.includes('www')) return match;
    // Check if this is an abbreviation (single letter before dot)
    if (offset > 0 && /^[A-Za-z]$/.test(text[offset - 1])) {
      const charBefore = offset >= 2 ? text[offset - 2] : ' ';
      if (charBefore === '.' || charBefore === ' ' || offset === 1) return match;
    }
    return punct + ' ' + next;
  });

  // Strip excessive exclamation/question marks
  text = text.replace(/!{2,}/g, '!');
  text = text.replace(/\?{2,}/g, '?');

  // Normalize excessive parentheses
  text = text.replace(/\(\(\s*/g, '(');
  text = text.replace(/\s*\)\)/g, ')');

  // Trim
  text = text.trim();

  return text;
}

function cleanTitle(title) {
  if (!title) return '';
  // Decode HTML entities
  title = title.replace(/&#8217;/g, '\u2019').replace(/&#8216;/g, '\u2018');
  title = title.replace(/&#8220;/g, '\u201c').replace(/&#8221;/g, '\u201d');
  title = title.replace(/&#8211;/g, '\u2013').replace(/&#8212;/g, '\u2014');
  title = title.replace(/&#038;/g, '&').replace(/&amp;/g, '&');
  title = title.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  title = title.replace(/&quot;/g, '"');
  title = title.replace(/&#\d+;/g, (m) => {
    const code = parseInt(m.replace(/&#|;/g, ''), 10);
    return String.fromCharCode(code);
  });

  let cleaned = cleanText(title);
  if (isAllCaps(cleaned)) {
    cleaned = toTitleCase(cleaned);
  }
  return cleaned;
}

function cleanContent(html) {
  if (!html) return '';

  let cleaned = html;

  // Strip inline styles
  cleaned = cleaned.replace(/\s*style="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s*style='[^']*'/gi, '');

  // Remove empty <p> tags (with optional whitespace/nbsp inside)
  cleaned = cleaned.replace(/<p[^>]*>\s*(&nbsp;|\s)*\s*<\/p>/gi, '');

  // Reduce excessive <br> tags (3+ in a row to 2)
  cleaned = cleaned.replace(/(<br\s*\/?\s*>[\s\n]*){3,}/gi, '<br><br>');

  // Apply text cleaning to text nodes only (not inside tags)
  cleaned = cleaned.replace(/>([^<]+)</g, (match, textContent) => {
    return '>' + cleanText(textContent) + '<';
  });

  return cleaned.trim();
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = async function () {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      console.warn(`Blog API returned ${response.status}, returning empty posts array.`);
      return [];
    }

    const data = await response.json();
    const posts = data.posts || [];

    return posts.map((post) => {
      const plainExcerpt = stripHtml(post.excerpt || post.content || '');

      return {
        id: post.ID,
        title: cleanTitle(post.title),
        date: post.date,
        slug: post.slug,
        excerpt: plainExcerpt.substring(0, 200),
        content: cleanContent(post.content),
        featuredImage: post.featured_image || null,
      };
    });
  } catch (err) {
    console.error('Failed to fetch blog posts:', err.message);
    return [];
  }
};
