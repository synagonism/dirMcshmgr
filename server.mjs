// Simple zero-dependency static web server for the dirNodews site.
// Replaces XAMPP/Apache for serving static HTML/CSS/JS/.mjs content.
// Run:  node server.mjs   (or: npm run serve)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- config -----------------------------------------------------------------

const sRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // dirMcshmgr's parent = web root C:\dirNodews
// Port/host: local default stays 127.0.0.1:80 (unchanged for `node server.mjs`).
// When hosted (Plesk/Passenger, a PaaS, etc.) PORT is provided in the environment,
// and we bind 0.0.0.0 so the platform can reach the app. (Passenger also patches
// .listen(), so honouring PORT here is belt-and-suspenders.)
const nPort = process.env.PORT || 80;
const sHost = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const bListDirs = true;    // show a directory listing when no index.html

// Hit-counter (replaces the old PHPcount counter.php). Data files are one
// integer per page, at dirPgm/dirCntr/dirCntrfiles/<page>.txt .
const sCounterDir = path.join(sRoot, 'dirPgm', 'dirCntr', 'dirCntrfiles');
const rPageClean = /[^a-zA-Z0-9._-]/g; // allowed page-id chars (matches old PHP)

// Content-Type by lowercase file extension (without the dot).
const oMimeByExt = {
	html: 'text/html',
	htm: 'text/html',
	css: 'text/css',
	js: 'application/javascript',
	mjs: 'application/javascript',
	json: 'application/json',
	map: 'application/json',
	txt: 'text/plain',
	md: 'text/plain',
	xml: 'application/xml',
	svg: 'image/svg+xml',
	png: 'image/png',
	gif: 'image/gif',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	ico: 'image/x-icon',
	webp: 'image/webp',
	bmp: 'image/bmp',
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	mp4: 'video/mp4',
	pdf: 'application/pdf',
	wasm: 'application/wasm',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	otf: 'font/otf',
	eot: 'application/vnd.ms-fontobject',
	zip: 'application/zip',
};

// Extensions that should carry a utf-8 charset.
const oCharsetExt = new Set(['html', 'htm', 'css', 'js', 'mjs', 'json', 'map', 'txt', 'md', 'xml', 'svg']);

// CORS parity with the old root .htaccess (<Files> matched by basename): these
// files may be fetched cross-origin by other origins via JS.
const oCorsFiles = new Set(['manifest.json', 'bksk-index.html']);
const oCorsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
};

// --- helpers ----------------------------------------------------------------

// Extension (lowercase, no dot) of a filesystem path.
const fExt = (sPath) => {
	const sE = path.extname(sPath).toLowerCase();
	return sE ? sE.slice(1) : '';
};

// Content-Type header value for a file path.
const fContentType = (sPath) => {
	const sE = fExt(sPath);
	const sType = oMimeByExt[sE] || 'application/octet-stream';
	return oCharsetExt.has(sE) ? sType + '; charset=utf-8' : sType;
};

// Send a short HTML response for an error/status page.
const fSendStatus = (oRes, nCode, sMsg) => {
	const sBody = `<!doctype html><meta charset="utf-8"><title>${nCode}</title>`
		+ `<h1>${nCode}</h1><p>${sMsg}</p>`;
	oRes.writeHead(nCode, { 'Content-Type': 'text/html; charset=utf-8' });
	oRes.end(sBody);
};

// Build a minimal HTML directory listing for sDir served at sUrlPath.
const fBuildListing = (sDir, sUrlPath) => {
	const aNames = fs.readdirSync(sDir, { withFileTypes: true })
		.sort((oA, oB) => {
			// directories first, then case-insensitive name order
			const bA = oA.isDirectory();
			const bB = oB.isDirectory();
			if (bA !== bB) return bA ? -1 : 1;
			return oA.name.localeCompare(oB.name);
		});
	const sBase = sUrlPath.endsWith('/') ? sUrlPath : sUrlPath + '/';
	let sRows = '';
	if (sBase !== '/') sRows += `<li><a href="../">../</a></li>`;
	for (const oEnt of aNames) {
		const bDir = oEnt.isDirectory();
		const sName = oEnt.name + (bDir ? '/' : '');
		const sHref = encodeURIComponent(oEnt.name) + (bDir ? '/' : '');
		sRows += `<li><a href="${sHref}">${sName}</a></li>`;
	}
	return `<!doctype html><meta charset="utf-8"><title>Index of ${sBase}</title>`
		+ `<h1>Index of ${sBase}</h1><ul>${sRows}</ul>`;
};

// Stream a file to the response. bHeadOnly => headers only (HEAD request).
const fServeFile = (oReq, oRes, sPath, oStat, bHeadOnly) => {
	const oHeaders = {
		'Content-Type': fContentType(sPath),
		'Content-Length': oStat.size,
	};

	// Editor cache parity (replicates dirMcshmgr/.htaccess): force revalidation
	// of js/mjs/css when the request comes from the VS Code WYSIWYG editor.
	const sReferer = oReq.headers.referer || '';
	const sE = fExt(sPath);
	if ((sReferer.includes('mcsw') || sReferer.includes('mcshv'))
		&& (sE === 'js' || sE === 'mjs' || sE === 'css')) {
		oHeaders['Cache-Control'] = 'no-cache, must-revalidate';
	}

	// CORS headers for the allow-listed files (parity with the old .htaccess).
	if (oCorsFiles.has(path.basename(sPath))) Object.assign(oHeaders, oCorsHeaders);

	oRes.writeHead(200, oHeaders);
	if (bHeadOnly) { oRes.end(); return; }

	const oStream = fs.createReadStream(sPath);
	oStream.on('error', () => {
		if (!oRes.headersSent) fSendStatus(oRes, 500, 'Read error.');
		else oRes.destroy();
	});
	oStream.pipe(oRes);
};

// Hit counter. Handles the clean URL "/counter?page=ID" plus the legacy
// ".../dirPgm/dirCntr/counter.php" and ".../program/counter/counter.php" paths.
// Reads dirCntrfiles/<ID>.txt, increments it, and returns JavaScript
// `document.write('<count>');` — same contract the old PHPcount script had, so
// the embedding <script> tags render the number inline. Returns true when it
// handled the request, false to let static serving take over.
const fHandleCounter = (oReq, oRes, sUrlPath, sQuery, bHeadOnly) => {
	const sLow = sUrlPath.toLowerCase();
	const bMatch = sLow === '/counter'
		|| sLow.endsWith('/dirpgm/dircntr/counter.php')
		|| sLow.endsWith('/program/counter/counter.php');
	if (!bMatch) return false;

	// no-cache headers so every hit is counted (never served from cache)
	const oHeaders = {
		'Content-Type': 'application/javascript; charset=utf-8',
		'Cache-Control': 'no-store, no-cache, must-revalidate',
		'Pragma': 'no-cache',
	};

	// read & sanitize the page id (?page=ID)
	const oParams = new URLSearchParams(sQuery);
	const sPage = (oParams.get('page') || '').replace(rPageClean, '');
	if (!sPage) {
		// no valid page id: emit a harmless no-op so the page isn't broken
		oRes.writeHead(200, oHeaders);
		oRes.end(bHeadOnly ? undefined : '/* counter: missing page id */');
		console.log(oReq.method, 200, 'counter(no-page)', oReq.url);
		return true;
	}

	// resolve the data file and guard it stays inside the counter dir
	const sCountFile = path.join(sCounterDir, sPage + '.txt');
	if (sCountFile !== sCounterDir && !sCountFile.startsWith(sCounterDir + path.sep)) {
		oRes.writeHead(200, oHeaders);
		oRes.end(bHeadOnly ? undefined : '/* counter: invalid page id */');
		console.log(oReq.method, 200, 'counter(bad-page)', oReq.url);
		return true;
	}

	// increment: synchronous read-modify-write is race-free in one Node process.
	// A missing file is auto-created starting at 1.
	let nCount = 0;
	try { nCount = parseInt(String(fs.readFileSync(sCountFile, 'utf8')).trim(), 10) || 0; }
	catch { nCount = 0; } // file does not exist yet
	nCount += 1;
	try {
		fs.writeFileSync(sCountFile, String(nCount));
	} catch (oErr) {
		oRes.writeHead(500, oHeaders);
		oRes.end(bHeadOnly ? undefined : '/* counter: write error */');
		console.log(oReq.method, 500, 'counter(write-fail)', sPage, oErr.message);
		return true;
	}

	const sBody = `document.write('${nCount.toLocaleString('en-US')}');`;
	oRes.writeHead(200, oHeaders);
	oRes.end(bHeadOnly ? undefined : sBody);
	console.log(oReq.method, 200, 'counter', sPage, nCount);
	return true;
};

// --- request handler --------------------------------------------------------

const fHandle = (oReq, oRes) => {
	const bHeadOnly = oReq.method === 'HEAD';
	if (oReq.method !== 'GET' && !bHeadOnly) {
		fSendStatus(oRes, 405, 'Method not allowed.');
		console.log(oReq.method, 405, oReq.url);
		return;
	}

	// split off query/hash; decode the path portion
	const nQ = oReq.url.indexOf('?');
	const sQuery = nQ === -1 ? '' : oReq.url.slice(nQ + 1).split('#')[0];
	let sUrlPath = oReq.url.split('?')[0].split('#')[0];
	try { sUrlPath = decodeURIComponent(sUrlPath); }
	catch { fSendStatus(oRes, 400, 'Bad request.'); console.log('GET', 400, oReq.url); return; }

	// dynamic hit counter (clean /counter and legacy .php paths) before static
	if (fHandleCounter(oReq, oRes, sUrlPath, sQuery, bHeadOnly)) return;

	// resolve against root and guard against path traversal
	const sResolved = path.resolve(sRoot, '.' + sUrlPath);
	const bInside = sResolved === sRoot || sResolved.startsWith(sRoot + path.sep);
	if (!bInside) {
		fSendStatus(oRes, 403, 'Forbidden.');
		console.log('GET', 403, oReq.url);
		return;
	}

	fs.stat(sResolved, (oErr, oStat) => {
		if (oErr) {
			fSendStatus(oRes, 404, 'Not found.');
			console.log(oReq.method, 404, oReq.url);
			return;
		}

		if (oStat.isDirectory()) {
			// no trailing slash on a directory: redirect so relative links work
			if (!sUrlPath.endsWith('/')) {
				const sLoc = sUrlPath + '/';
				oRes.writeHead(301, { Location: sLoc });
				oRes.end();
				console.log(oReq.method, 301, oReq.url);
				return;
			}
			const sIndex = path.join(sResolved, 'index.html');
			if (fs.existsSync(sIndex)) {
				const oIdxStat = fs.statSync(sIndex);
				fServeFile(oReq, oRes, sIndex, oIdxStat, bHeadOnly);
				console.log(oReq.method, 200, oReq.url);
				return;
			}
			if (bListDirs) {
				const sBody = fBuildListing(sResolved, sUrlPath);
				oRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				oRes.end(bHeadOnly ? undefined : sBody);
				console.log(oReq.method, 200, oReq.url);
				return;
			}
			fSendStatus(oRes, 404, 'Not found.');
			console.log(oReq.method, 404, oReq.url);
			return;
		}

		fServeFile(oReq, oRes, sResolved, oStat, bHeadOnly);
		console.log(oReq.method, 200, oReq.url);
	});
};

// --- start ------------------------------------------------------------------

const oServer = http.createServer(fHandle);
oServer.listen(nPort, sHost, () => {
	console.log(`dirNodews static server listening on http://${sHost}:${nPort}`);
	console.log(`web root: ${sRoot}`);
});
