import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  diffLeyChileSections,
  parseLeyChileHtml,
} from '../lib/regulatory/leychile-core.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fixtureDirectory = resolve(here, '../data/regulatory/fixtures')
const [htmlV1, htmlV2] = await Promise.all([
  readFile(resolve(fixtureDirectory, 'leychile-synthetic-v1.html'), 'utf8'),
  readFile(resolve(fixtureDirectory, 'leychile-synthetic-v2.html'), 'utf8'),
])

const parsedV1 = parseLeyChileHtml(htmlV1)
const parsedV2 = parseLeyChileHtml(htmlV2)

assert.equal(parsedV1.articleCount, 2, 'fixture v1 must contain two articles')
assert.equal(parsedV2.articleCount, 2, 'fixture v2 must contain two articles')
assert.equal(parsedV1.sectionCount, 7, 'fixture v1 must expose articles and incisos')
assert.equal(parsedV2.sectionCount, 7, 'fixture v2 must expose articles and incisos')
assert.match(parsedV1.documentHash, /^[0-9a-f]{64}$/)
assert.match(parsedV2.documentHash, /^[0-9a-f]{64}$/)
assert.notEqual(parsedV1.documentHash, parsedV2.documentHash)

const diff = diffLeyChileSections(parsedV1.sections, parsedV2.sections)
const repeatedDiff = diffLeyChileSections(parsedV1.sections, parsedV2.sections)

assert.equal(diff.hasChanges, true)
assert.equal(diff.summary.added, 3)
assert.equal(diff.summary.removed, 3)
assert.equal(diff.summary.modified, 3)
assert.equal(diff.summary.unchanged, 1)
assert.match(diff.changeHash, /^[0-9a-f]{64}$/)
assert.equal(diff.changeHash, repeatedDiff.changeHash, 'diff hash must be deterministic')
assert.ok(diff.changes.some((change) => change.key === 'article:1°' && change.type === 'modified'))
assert.ok(diff.changes.some((change) => change.key === 'article:2°' && change.type === 'removed'))
assert.ok(diff.changes.some((change) => change.key === 'article:3°' && change.type === 'added'))

assert.throws(
  () => parseLeyChileHtml('<html><body><p>Sin artículos</p></body></html>'),
  /leychile_parse_no_articles/,
)

console.log(JSON.stringify({
  parserVersion: parsedV2.parserVersion,
  v1: { articleCount: parsedV1.articleCount, sectionCount: parsedV1.sectionCount },
  v2: { articleCount: parsedV2.articleCount, sectionCount: parsedV2.sectionCount },
  diff: diff.summary,
  changeHash: diff.changeHash,
}, null, 2))
