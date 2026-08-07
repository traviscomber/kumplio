create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'kumplio-agent-worker';

select cron.schedule(
  'kumplio-agent-worker',
  '* * * * *',
  $$select private.dispatch_agent_worker();$$
);
