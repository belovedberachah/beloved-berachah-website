module.exports = function(eleventyConfig) {
  // 1. Force Eleventy to copy these folders exactly as they are into _site
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  
  // 2. Pass through the Progressive Web App files
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("sw.js");

  // 3. Keep the build structure flat
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};