"use client";

import { useEffect, useRef } from "react";

export function HomeMotionController() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section[id]"),
    );
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("[data-section-link]"),
    );

    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    reveals.forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            const active = link.hash === `#${entry.target.id}`;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        }),
      { threshold: 0.2, rootMargin: "-22% 0px -58% 0px" },
    );

    sections.forEach((section) => sectionObserver.observe(section));

    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          distance > 0 ? Math.min(1, window.scrollY / distance) : 0;
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${progress})`;
        }
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={progressRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px origin-left bg-[#C5E052] shadow-[0_0_12px_rgba(197,224,82,.45)]"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
