import assert from 'node:assert/strict'
import fs from 'node:fs'
const sql=fs.readFileSync('supabase/migrations/20260920153000_outcome_closure_preparation_queue_v1.sql','utf8')
const worker=fs.readFileSync('app/api/internal/outcomes/closure-preparations/run/route.ts','utf8')
for(const x of ['for update skip locked','q.id = p_queue_id','attempts < 5','claim_outcome_closure_preparation','complete_outcome_closure_preparation','fail_outcome_closure_preparation']) assert.ok(sql.toLowerCase().includes(x))
for(const x of ['INTERNAL_RUNNER_SECRET','p_queue_id: message.queueId','Queue identity mismatch','preparation_organization_mismatch',"validation_status === 'accepted'","integrity_status === 'verified'",'requiresHumanVerification: true',"'attempts_exhausted'","'already_completed'","'queue_item_not_found'",'deadLetter: true']) assert.ok(worker.includes(x))
assert.ok(!worker.includes("verification_status: 'verified'"))
assert.ok(!worker.includes(".update({ verification_status"))
console.log('Outcome preparation worker v1: PASS')
