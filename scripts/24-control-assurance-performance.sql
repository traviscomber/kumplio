-- KUMPLIO Control Assurance performance hardening

begin;

create index if not exists control_evaluation_evidence_project_id_idx
  on public.control_evaluation_evidence (project_id);

commit;
