-- KUMPLIO — Primer playbook orientado a resultados
begin;

do $$
declare
  v_playbook_id uuid;
  v_capability_id uuid;
  v_item record;
begin
  insert into public.mission_playbooks(
    slug,version,name,description,objective,vertical,status,outcome_schema,closing_criteria,metadata,published_at
  ) values (
    'preparar-ley-21719',1,'Preparar cumplimiento de la Ley N.º 21.719',
    'Convierte la regulación de datos personales en obligaciones, riesgos, trabajo, revisión y evidencia verificable.',
    'Preparar a la organización para operar y demostrar su avance frente a la Ley N.º 21.719.',
    'proteccion_datos','published',
    jsonb_build_object(
      'requiredResults',jsonb_build_array('obligaciones','impacto_regulatorio','riesgos_controles','plan_trabajo','revision','preparacion_auditoria'),
      'language','es-CL',
      'humanReviewRequired',true
    ),
    jsonb_build_array(
      jsonb_build_object('key','obligations_identified','label','Obligaciones aplicables identificadas y citadas'),
      jsonb_build_object('key','risks_prioritized','label','Riesgos y controles priorizados'),
      jsonb_build_object('key','action_plan_defined','label','Plan de trabajo con responsables y dependencias'),
      jsonb_build_object('key','critical_results_reviewed','label','Resultados críticos revisados por una persona'),
      jsonb_build_object('key','evidence_gaps_visible','label','Brechas de evidencia visibles antes de cierre')
    ),
    jsonb_build_object('country','CL','law','21.719','category','proteccion_de_datos'),now()
  )
  on conflict (slug,version) do update set
    name=excluded.name,
    description=excluded.description,
    objective=excluded.objective,
    vertical=excluded.vertical,
    status=excluded.status,
    outcome_schema=excluded.outcome_schema,
    closing_criteria=excluded.closing_criteria,
    metadata=excluded.metadata,
    published_at=coalesce(public.mission_playbooks.published_at,excluded.published_at),
    updated_at=now()
  returning id into v_playbook_id;

  for v_item in
    select * from (values
      (1,'detect_obligations',true),
      (2,'monitor_regulatory_change',true),
      (3,'prioritize_risk_controls',true),
      (4,'build_action_plan',true),
      (5,'review_decision',true),
      (6,'prepare_audit',true)
    ) as x(sequence,capability_key,required)
  loop
    select c.id into v_capability_id from public.mission_capabilities c
    where c.capability_key=v_item.capability_key and c.status='active';
    if v_capability_id is null then raise exception 'missing_capability_%',v_item.capability_key; end if;

    insert into public.mission_playbook_capabilities(playbook_id,capability_id,sequence,required,configuration)
    values(v_playbook_id,v_capability_id,v_item.sequence,v_item.required,
      jsonb_build_object('customerVisible',true,'requiresHumanReview',true))
    on conflict (playbook_id,capability_id) do update set
      sequence=excluded.sequence,
      required=excluded.required,
      configuration=excluded.configuration;
  end loop;
end $$;

commit;
