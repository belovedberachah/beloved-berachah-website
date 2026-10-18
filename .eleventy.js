module.exports = function (eleventyConfig) {
  // Copy static folders into _site unchanged
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("sw.js");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Watch these folders during `npm start`
  eleventyConfig.addWatchTarget("./css/");
  eleventyConfig.addWatchTarget("./assets/");

  // Dates are shown and compared in UK time, whatever timezone the build runs in.
  // Netlify builds in UTC, so without this an event at 7pm shows as 6pm in summer.
  const UK = "Europe/London";

  // Returns YYYY-MM-DD for a date, in UK time
  function ukDay(value) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: UK,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  }

  eleventyConfig.addFilter("formatDate", function (date) {
    if (!date) return "";
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-GB", {
        timeZone: UK,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      " at " +
      d.toLocaleTimeString("en-GB", {
        timeZone: UK,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  });

  // Events that are switched on and not yet past, soonest first.
  // This runs at build time, so a past event disappears on the next build.
  eleventyConfig.addCollection("upcomingEvents", function (collectionApi) {
    const today = ukDay(new Date());
    return collectionApi
      .getFilteredByTag("events")
      .filter((item) => item.data.show_on_site !== false)
      .filter((item) => item.data.event_date && ukDay(item.data.event_date) >= today)
      .sort((a, b) => new Date(a.data.event_date) - new Date(b.data.event_date));
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
    },
  };
};