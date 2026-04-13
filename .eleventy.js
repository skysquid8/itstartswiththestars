module.exports = function(eleventyConfig) {
  // Copy admin folder to output
  eleventyConfig.addPassthroughCopy("admin");

  // Format dates for blog posts (e.g., "April 1, 2026")
  eleventyConfig.addFilter("blogDate", function(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  });

  // Truncate strings to a given length
  eleventyConfig.addFilter("truncate", function(str, len) {
    if (!str) return '';
    if (str.length <= len) return str;
    return str.substring(0, len).replace(/\s+\S*$/, '') + '...';
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};