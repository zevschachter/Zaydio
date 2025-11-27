// Static file server for Deno Deploy
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Serve index.html for root path
  if (url.pathname === "/") {
    const file = await Deno.readFile("./index.html");
    return new Response(file, {
      headers: { "content-type": "text/html" },
    });
  }
  
  // Serve all other static files
  return serveDir(req, {
    fsRoot: ".",
    showDirListing: false,
  });
});


