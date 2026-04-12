module.exports = function(eleventyConfig) {
  // Copy admin folder to output
  eleventyConfig.addPassthroughCopy("admin");

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