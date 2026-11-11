"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Um único IntersectionObserver para a página toda. Marca com `data-inview`
 * cada elemento `[data-reveal]` que entra na tela; as animações em si são
 * CSS (globals.css). Também acompanha elementos que entram no DOM depois,
 * como os de uma nova página.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-inview", "");
          io.unobserve(entry.target);
        }
      },
      // Dispara um pouco depois de o elemento cruzar a borda inferior.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    const collect = (root: ParentNode) => {
      const nodes = root.querySelectorAll("[data-reveal]:not([data-inview])");
      for (const node of nodes) {
        if (seen.has(node)) continue;
        seen.add(node);
        io.observe(node);
      }
    };

    collect(document);
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches("[data-reveal]:not([data-inview])") && !seen.has(node)) {
            seen.add(node);
            io.observe(node);
          }
          collect(node);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
