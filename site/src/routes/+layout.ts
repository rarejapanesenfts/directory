// Prerender the entire site as static files; force trailing slashes so each
// route emits a directory/index.html (correct relative asset resolution on
// GitHub Pages project pages).
export const prerender = true;
export const trailingSlash = 'always';
