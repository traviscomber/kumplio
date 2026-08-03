import { readFile, writeFile } from 'node:fs/promises'

const path = 'app/contact/page.tsx'
let text = await readFile(path, 'utf8')

text = text.replace("  mensaje: string\n}", "  mensaje: string\n  website: string\n}")
text = text.replace(
  "    mensaje: selectedService ? `Me interesa conversar sobre ${selectedService}.` : '',\n  })",
  "    mensaje: selectedService ? `Me interesa conversar sobre ${selectedService}.` : '',\n    website: '',\n  })",
)
text = text.replace(
  "setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '' })",
  "setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '', website: '' })",
)

const insertionPoint = `                  <Field label="Resultado o desafío">\n`
const honeypot = `                  <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">\n                    <label htmlFor="website">Sitio web</label>\n                    <input\n                      id="website"\n                      name="website"\n                      type="text"\n                      value={formData.website}\n                      onChange={handleChange}\n                      tabIndex={-1}\n                      autoComplete="off"\n                    />\n                  </div>\n\n`
if (!text.includes(insertionPoint)) throw new Error('No se encontró el punto de inserción del honeypot')
text = text.replace(insertionPoint, honeypot + insertionPoint)

if (!text.includes('value={formData.website}')) throw new Error('No se agregó el honeypot')
await writeFile(path, text)
