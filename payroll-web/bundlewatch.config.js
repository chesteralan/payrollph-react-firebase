/* Bundlewatch config — tracks bundle size across PRs */
export default {
  files: [
    {
      path: "dist/assets/index-*.js",
      maxSize: "500kB",
    },
    {
      path: "dist/assets/index-*.css",
      maxSize: "50kB",
    },
    {
      path: "dist/assets/vendor-*.js",
      maxSize: "300kB",
    },
  ],
  ci: {
    trackBranches: ["main"],
  },
};
