import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = process.cwd()
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      const name = decodeURIComponent(url.pathname.slice(1))
      let file = path.resolve(root, name || 'index.html')
      if (!file.startsWith(`${root}/`)) {
        res.writeHead(403)
        res.end()
        return
      }
      let status = 200
      try {
        const stat = await fs.stat(file)
        if (stat.isDirectory()) {
          if (!url.pathname.endsWith('/')) {
            res.writeHead(301, { Location: `${url.pathname}/${url.search}` })
            res.end()
            return
          }
          file = path.join(file, 'index.html')
        }
        await fs.access(file)
      } catch {
        status = 404
        file = path.join(root, '404.html')
      }
      let body = await fs.readFile(file)
      const compress =
        /\.(?:html|css|js|svg|xml|txt)$/.test(file) &&
        /gzip/.test(req.headers['accept-encoding'] || '')
      if (compress) body = gzipSync(body)
      res.writeHead(status, {
        'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        Vary: 'Accept-Encoding',
        ...(compress ? { 'Content-Encoding': 'gzip' } : {}),
      })
      res.end(body)
    } catch {
      res.writeHead(500)
      res.end('Static server error')
    }
  })
  .listen(4176, '127.0.0.1', () =>
    console.log('Serving the actual publishing root under /dentist/'),
  )
