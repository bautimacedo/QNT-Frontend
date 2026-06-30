// Quick client-side check that a file *looks* like a DJI R-JPEG before we even
// upload it: DJI embeds an XMP block with a "drone-dji:" namespace very early
// in the file (same marker extractor.py's _extract_xmp_fields() searches for
// server-side). Reading the first 512KB is enough and keeps this instant —
// the authoritative check still happens server-side when dji_irp actually
// processes the image (see api/app/routers/preview.py).
export async function looksLikeDjiThermal(file) {
  if (!file || !file.type.startsWith('image/')) return false
  const head = await file.slice(0, 512 * 1024).arrayBuffer()
  const text = new TextDecoder('latin1').decode(head)
  return text.includes('drone-dji')
}
