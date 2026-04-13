// Netlify Scheduled Function - checks WordPress for new posts every 6 hours
// and triggers a site rebuild if a new post is found

export default async (req) => {
  try {
    // Fetch latest post from WordPress
    const wpRes = await fetch(
      "https://public-api.wordpress.com/rest/v1.1/sites/itstartswiththestars.wordpress.com/posts/?number=1&fields=ID,title,date,slug"
    );
    const data = await wpRes.json();
    const posts = data.posts || [];

    if (posts.length === 0) {
      return new Response("No posts found");
    }

    const latest = posts[0];
    const postDate = new Date(latest.date);
    const cutoff = new Date(Date.now() - 7 * 60 * 60 * 1000); // 7 hours ago

    if (postDate > cutoff) {
      // New post found! Trigger rebuild
      await fetch("https://api.netlify.com/build_hooks/69dc4c0bc6dbb473b5f92200", {
        method: "POST",
      });

      return new Response(
        `New post found: "${latest.title}" - rebuild triggered. Link: https://itstartswiththestars.com/blog/${latest.slug}/`
      );
    }

    return new Response("No new posts in the last 7 hours");
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};

export const config = {
  schedule: "@every 6h",
};
