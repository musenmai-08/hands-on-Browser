import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createSecureServer } from "http2";
import { on } from "events";
import mime from "mime-types";
import { createHash } from "crypto";

const port = 3000;
const reqs = on(
	createSecureServer({
		key: readFileSync("./cert.key"),
		cert: readFileSync("./cert.crt"),
	}).listen(port),
	"request"
);

const SESSION_ID = "123-456";

function isLogin(req) {
	if (req.headers["cookie"] === SESSION_ID) {
		return true;
	} else {
		return false;
	}
}

async function getIndex(req, res) {
	if (!isLogin(req)) {
		res.writeHead(302, {
			Location: "/login",
		});
		res.end();
		return;
	}
	res.end("Login Success!!");
}

async function getLogin(req, res) {
	const html = await readFile("./login.html");
	res.writeHead(200, {
		"Content-Type": "text/html",
	});
	res.end(html);
}

async function postLogin(req, res) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (d) => {
			data += d;
		});
		req.on("end", () => {
			const parsedData = decodeURIComponent(data);
			const parsedDataArray = parsedData.split("&");

			if (
				parsedDataArray[0].split("=")[1] === "yuki@example.com" &&
				parsedDataArray[1].split("=")[1] === "yUki0525!"
			) {
				res.writeHead(302, {
					Location: "/",
					"Set-Cookie": SESSION_ID,
				});
				res.end("something error");
			} else {
				res.writeHead(401);
				res.end("Unauthorized");
			}
			resolve();
		});
	});
}

function generateETag(content) {
	const hash = createHash("md5").update(content).digest("hex");
	return `"${hash}"`;
}

async function staticFile(url, req, res) {
	try {
		const content = await readFile(resolve("./public", url.pathname.slice(1)));
		const etag = generateETag(content);

		if (req.headers["if-none-match"] === etag) {
			res.writeHead(304, {
				"Cache-Control": "max-age=600",
			});
		} else {
			res.writeHead(200, {
				"Content-Type": mime.lookup(url.pathname),
				"Cache-Control": "max-age=600",
				ETag: etag,
			});
		}
		res.end(content);
	} catch (e) {
		console.error(e);
		res.writeHead(404);
		res.end("Not Found");
	}
}

for await (const [req, res] of reqs) {
	const url = new URL(req.url, `https://${req.headers.host}`);
	try {
		if (url.pathname === "/" && req.method === "GET") {
			await getIndex(req, res);
		} else if (url.pathname === "/login" && req.method === "GET") {
			await getLogin(req, res);
		} else if (url.pathname === "/login" && req.method === "POST") {
			await postLogin(req, res);
		} else {
			await staticFile(url, req, res);
		}
	} catch (e) {
		console.error(e);
		res.writeHead(500);
		res.end(e.toString());
	}
}
