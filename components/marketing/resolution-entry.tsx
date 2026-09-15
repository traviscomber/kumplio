"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import type { PublicLocale } from "@/lib/i18n/public-routing";
import {
  buildGuidedOnboardingSignUpPath,
  GUIDED_ONBOARDING_DRAFT_KEY,
} from "@/lib/product/onboarding/guided-entry";

type Audience = "person" | "company";

type ResolutionCopy = {
  audiences: Record<Audience, string>;
  examples: Record<Audience, string[]>;
  question: string;
  placeholder: string;
  action: string;
  completeAction: string;
  note: string;
  guidance: string;
  ready: string;
  error: string;
  previewEyebrow: string;
  previewTitle: Record<Audience, string>;
  previewSummary: Record<Audience, string>;
  previewSignals: Record<Audience, string[]>;
  previewLocked: string;
};

const audienceOrder: Audience[] = ["company", "person"];

const COPY: Record<PublicLocale, ResolutionCopy> = {
  es: {
    audiences: {
      company: "Empresa",
      person: "Trabajador",
    },
    examples: {
      company: [
        "Quiero saber qué documentos están por vencer",
        "Necesito revisar a mis contratistas",
        "Debo prepararme para la Ley 21.719",
      ],
      person: [
        "Quiero ordenar mis documentos para trabajar",
        "Necesito saber qué certificado está por vencer",
        "Quiero reutilizar mi información verificada",
      ],
    },
    question: "¿Qué necesitas proteger o resolver?",
    placeholder:
      "Describe la situación, los datos involucrados o lo que necesitas implementar...",
    action: "Ver orientación inicial",
    completeAction: "Obtener diagnóstico completo",
    note: "Kumplio centraliza los antecedentes, activa los especialistas adecuados y conserva el respaldo de cada decisión.",
    guidance: "Escribe al menos 8 caracteres o elige una situación de ejemplo.",
    ready: "Situación lista. Ya puedes ver una orientación inicial.",
    error: "Cuéntanos un poco más para poder preparar tu guía.",
    previewEyebrow: "Orientación inicial · sin registro",
    previewTitle: {
      company:
        "Tu primer paso es ordenar el contexto antes de implementar controles.",
      person:
        "Tu primer paso es ordenar qué documentos tienes y cuáles necesita tu trabajo.",
    },
    previewSummary: {
      company:
        "Por lo que describes, conviene comenzar delimitando los datos, tratamientos, responsables y terceros involucrados. Eso permite distinguir brechas urgentes de tareas de implementación frente a la Ley 21.719.",
      person:
        "Por lo que describes, conviene reunir tus documentos, certificaciones y fechas de vencimiento para identificar qué está listo y qué requiere atención.",
    },
    previewSignals: {
      company: [
        "Mapear datos y tratamientos involucrados",
        "Identificar responsables, proveedores y evidencia disponible",
        "Priorizar brechas y próximos pasos",
      ],
      person: [
        "Ordenar documentos y certificaciones",
        "Identificar vencimientos y requisitos",
        "Definir la siguiente acción",
      ],
    },
    previewLocked:
      "Regístrate gratis para recibir el diagnóstico completo, tareas priorizadas, responsables sugeridos y evidencia necesaria para cerrar cada brecha.",
  },
  en: {
    audiences: {
      company: "Company",
      person: "Worker",
    },
    examples: {
      company: [
        "I want to know which documents are about to expire",
        "I need to review my contractors",
        "I need to prepare for Chilean Law 21.719",
      ],
      person: [
        "I want to organize my documents for work",
        "I need to know which certification expires next",
        "I want to reuse my verified information",
      ],
    },
    question: "What do you need to protect or resolve?",
    placeholder:
      "Describe the situation, the data involved or what you need to implement...",
    action: "See initial guidance",
    completeAction: "Get the complete assessment",
    note: "Kumplio centralizes the context, activates the right specialists and preserves the evidence behind each decision.",
    guidance: "Write at least 8 characters or choose an example situation.",
    ready: "Your situation is ready. You can now see initial guidance.",
    error: "Tell us a little more so we can prepare your guidance.",
    previewEyebrow: "Initial guidance · no sign-up required",
    previewTitle: {
      company:
        "Your first step is to organize the context before implementing controls.",
      person:
        "Your first step is to organize what documents you have and what your work requires.",
    },
    previewSummary: {
      company:
        "Based on what you described, start by defining the data, processing activities, owners and third parties involved. This helps separate urgent gaps from implementation work under Chilean Law 21.719.",
      person:
        "Based on what you described, gather documents, certifications and expiry dates to identify what is ready and what needs attention.",
    },
    previewSignals: {
      company: [
        "Map the data and processing activities involved",
        "Identify owners, vendors and available evidence",
        "Prioritize gaps and next steps",
      ],
      person: [
        "Organize documents and certifications",
        "Identify expirations and requirements",
        "Define the next action",
      ],
    },
    previewLocked:
      "Sign up free to receive the complete assessment, prioritized tasks, suggested owners and the evidence needed to close each gap.",
  },
};

export function ResolutionEntry({ locale = "es" }: { locale?: PublicLocale }) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("company");
  const [goal, setGoal] = useState("");
  const [showError, setShowError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copy = COPY[locale];
  const isReady = goal.trim().length >= 8;

  function saveDraft(normalizedGoal: string) {
    const serializedDraft = JSON.stringify({ goal: normalizedGoal, audience });
    window.sessionStorage.setItem(GUIDED_ONBOARDING_DRAFT_KEY, serializedDraft);
    window.localStorage.setItem(GUIDED_ONBOARDING_DRAFT_KEY, serializedDraft);
  }

  function showInitialGuidance() {
    const normalizedGoal = goal.trim();
    if (normalizedGoal.length < 8) {
      setShowError(true);
      textareaRef.current?.focus();
      return;
    }

    saveDraft(normalizedGoal);
    setShowPreview(true);
  }

  function continueToSignUp() {
    saveDraft(goal.trim());
    router.push(buildGuidedOnboardingSignUpPath());
  }

  return (
    <div className="rounded-[4px] border border-[#B17A4D]/35 bg-[#211F1B] p-5 sm:p-7">
      <div className="flex flex-wrap gap-2">
        {audienceOrder.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setAudience(value);
              setShowPreview(false);
            }}
            className={`rounded-[4px] border px-4 py-2 text-sm font-medium transition ${
              audience === value
                ? "border-[#A7C63A] bg-[#A7C63A]/15 text-[#C5E052] shadow-[inset_0_0_0_1px_rgba(167,198,58,0.12)]"
                : "border-[#C2A887]/20 bg-[#151513]/45 text-[#C2A887] hover:border-[#B17A4D]/60 hover:bg-[#B17A4D]/10 hover:text-[#E0C5A1]"
            }`}
          >
            {copy.audiences[value]}
          </button>
        ))}
      </div>

      <label
        htmlFor="resolution-goal"
        className="mt-6 block text-sm font-bold text-[#E0C5A1]"
      >
        {copy.question}
      </label>
      <textarea
        ref={textareaRef}
        id="resolution-goal"
        value={goal}
        onChange={(event) => {
          setGoal(event.target.value);
          setShowPreview(false);
          if (event.target.value.trim().length >= 8) setShowError(false);
        }}
        rows={5}
        placeholder={copy.placeholder}
        aria-invalid={showError}
        aria-describedby="resolution-guidance"
        className={`mt-3 w-full resize-none rounded-[4px] border bg-[#151513] px-4 py-4 text-base leading-7 text-[#C2A887] outline-none transition placeholder:text-[#8F8678] focus:ring-2 ${showError ? "border-[#D58A62] focus:border-[#D58A62] focus:ring-[#D58A62]/15" : "border-[#C2A887]/22 focus:border-[#A7C63A]/75 focus:ring-[#A7C63A]/15"}`}
      />
      <p
        id="resolution-guidance"
        className={`mt-2 text-xs ${showError ? "text-[#E2A37E]" : isReady ? "text-[#C5E052]" : "text-[#B1A696]"}`}
        aria-live="polite"
      >
        {showError ? copy.error : isReady ? copy.ready : copy.guidance}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {copy.examples[audience].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setGoal(example);
              setShowError(false);
              setShowPreview(false);
            }}
            aria-pressed={goal === example}
            className={`rounded-[4px] border px-3 py-2 text-left text-xs transition ${goal === example ? "border-[#A7C63A]/70 bg-[#A7C63A]/12 text-[#D5EA7C]" : "border-[#C2A887]/28 bg-[#151513]/55 text-[#C2B6A4] hover:border-[#A7C63A]/65 hover:bg-[#A7C63A]/10 hover:text-[#C2A887]"}`}
          >
            {example}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={showInitialGuidance}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#B7D83C] bg-[#A7C63A] px-6 py-3 font-black text-[#12140B] shadow-[0_10px_30px_rgba(167,198,58,0.16)] transition hover:bg-[#B7D83C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EA7C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211F1B]"
      >
        {copy.action} <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      {showPreview && (
        <section
          className="mt-6 rounded-[4px] border border-[#A7C63A]/35 bg-[#171813] p-5"
          aria-live="polite"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A7C63A]">
            {copy.previewEyebrow}
          </p>
          <h3 className="mt-3 text-xl font-bold leading-7 text-[#E0C5A1]">
            {copy.previewTitle[audience]}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#B8AD9C]">
            {copy.previewSummary[audience]}
          </p>
          <div className="mt-5 grid gap-3">
            {copy.previewSignals[audience].map((signal) => (
              <div key={signal} className="flex gap-3 text-sm text-[#D4C5B0]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A7C63A]" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[4px] border border-[#B17A4D]/30 bg-[#211F1B] p-4">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#B17A4D]" />
              <p className="text-xs leading-5 text-[#B8AD9C]">
                {copy.previewLocked}
              </p>
            </div>
            <button
              type="button"
              onClick={continueToSignUp}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#B7D83C] bg-[#A7C63A] px-6 py-3 font-black text-[#12140B] transition hover:bg-[#B7D83C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EA7C]"
            >
              {copy.completeAction} <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <p className="mt-4 text-center text-xs leading-5 text-[#8F8678]">
        {copy.note}
      </p>
    </div>
  );
}
