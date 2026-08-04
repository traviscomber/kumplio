import assert from 'node:assert/strict'

const amendmentBoundary = /^\s*(?:[0-9]+\)|[a-z]\)|[ivxlcdm]+\.)?\s*(?:en\s+(?:el|la|los|las)\s+art[ií]culo|reempl[aá]z|sustit[uú]y|agr[eé]g|incorp[oó]r|interc[aá]l|supr[ií]m|modif[ií]c|introd[uú]c)/i

const rules = {
  obligation: /(?:^|[^\p{L}])(?:debe|deben|deberá|deberán)(?=$|[^\p{L}])|está\s+obligad[oa]|están\s+obligad[oa]s|queda[n]?\s+sujet[oa]s?\s+a\s+la\s+obligación/iu,
  right: /(tiene[n]?\s+derecho|derecho\s+que\s+le\s+asiste|derecho\s+que\s+les\s+asiste)/i,
  prohibition: /(se\s+prohíbe|queda[n]?\s+prohibid[oa]s?|no\s+(?:se\s+)?podrá[n]?)/i,
  deadline: /(dentro\s+del\s+plazo|en\s+el\s+plazo\s+de|plazo\s+no\s+mayor\s+a|dispone\s+de\s+un\s+plazo\s+de|dentro\s+de\s+(?:los\s+|un\s+)?[a-záéíóú0-9]+\s+(?:días?|meses?|años?|horas?)|a\s+más\s+tardar|sin\s+dilaciones\s+indebidas|por\s+un\s+término\s+de\s+[a-záéíóú0-9]+\s+(?:días?|meses?|años?)|hasta\s+por\s+[a-záéíóú0-9]+\s+(?:días?|meses?|años?))/i,
  sanction: /(será[n]?\s+sancionad[oa]s?|multa\s+de\s+hasta|amonestación\s+escrita|recargo\s+de\s+50%|suspensión\s+de\s+las\s+operaciones)/i,
}

assert.match('El responsable deberá reportar la vulneración.', rules.obligation)
assert.match('El responsable debe mantener el registro.', rules.obligation)
assert.doesNotMatch('La expresión indebemente no es un verbo modal.', rules.obligation)
assert.match('El titular de datos tiene derecho a solicitar acceso.', rules.right)
assert.match('Se prohíbe el tratamiento de estos datos.', rules.prohibition)
assert.match('El responsable no podrá tratar los datos mientras resuelve.', rules.prohibition)
assert.match('Deberá responder dentro de los dos días hábiles siguientes.', rules.deadline)
assert.match('Deberá reportar sin dilaciones indebidas.', rules.deadline)
assert.doesNotMatch('Se tendrá en consideración el plazo de conservación.', rules.deadline)
assert.match('Las infracciones graves serán sancionadas con multa de hasta 10.000 UTM.', rules.sanction)
assert.match('9) En el artículo 17:', amendmentBoundary)
assert.match('a) Reemplázase la frase indicada.', amendmentBoundary)
assert.doesNotMatch('a) Informar al titular los antecedentes.', amendmentBoundary)

const multiType = 'El responsable deberá responder dentro de los dos días hábiles y no podrá tratar los datos.'
assert.match(multiType, rules.obligation)
assert.match(multiType, rules.deadline)
assert.match(multiType, rules.prohibition)

console.log('Ley 21.719 deterministic claim rules passed')
