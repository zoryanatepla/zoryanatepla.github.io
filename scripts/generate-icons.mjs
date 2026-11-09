import fs from 'node:fs/promises'
import sharp from 'sharp'

// Retain the approved full-size artwork; regenerate browser and home-screen sizes from it.
const master = 'public/favicon-zt-512.png'
await sharp(master).resize(96, 96).png().toFile('public/favicon-zt.png')
await sharp(master).resize(180, 180).png().toFile('public/apple-touch-icon.png')

// ICO directory with independently encoded PNG entries for common browser sizes.
const sizes = [16, 32, 48, 64]
const images = await Promise.all(
  sizes.map((size) => sharp(master).resize(size, size).png().toBuffer()),
)
const header = Buffer.alloc(6 + sizes.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
for (let i = 0; i < sizes.length; i++) {
  const entry = 6 + i * 16
  header[entry] = sizes[i]
  header[entry + 1] = sizes[i]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(images[i].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += images[i].length
}
await fs.writeFile('public/favicon.ico', Buffer.concat([header, ...images]))
