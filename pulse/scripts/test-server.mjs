// Local target for the checker: /ok returns 200, /fail returns 503, /slow hangs.
import { createServer } from "node:http";

createServer((req, res) => {
  if (req.url === "/ok") return res.writeHead(200).end("Book now");
  if (req.url === "/fail") return res.writeHead(503).end("down");
  if (req.url === "/slow") return;
  res.writeHead(404).end();
}).listen(4000, () => console.log("Test server on http://localhost:4000 (/ok, /fail, /slow)"));
