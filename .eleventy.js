module.exports = function(eleventyConfig) {
  // 1. Force Eleventy to copy these folders exactly as they are into _site
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  
  // 2. Pass through the Progressive Web App and root-level files
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("sw.js");
  
  // IMPROVEMENT A: Ensure standard SEO and browser icons pass through if you add them later
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("robots.txt"); 

  // 3. Custom Filters
  // Clean UK Date Formatter (removes the messy GMT timezone string)
  eleventyConfig.addFilter("formatDate", function(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  // IMPROVEMENT B: Tell Eleventy to watch these folders for changes during local development.
  // This prevents you from having to restart the server when you tweak Tailwind styles or swap images.
  eleventyConfig.addWatchTarget("./css/");
  eleventyConfig.addWatchTarget("./assets/");

  // 4. Directory Structure
  return {
    dir: {
      input: ".",
      // IMPROVEMENT C: Explicitly defining the includes folder is a best practice 
      // that prevents routing bugs if you ever upgrade Eleventy versions.
      includes: "_includes",
      output: "_site"
    }
  };
};