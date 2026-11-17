// Docs pages: the sidebar filter, copy buttons and the current section in the table of contents.

const search = document.querySelector("[data-docs-search]");
const side = document.querySelector(".side");
if (search && side) {
  search.addEventListener("focus", () => side.classList.add("is-open"));
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    side.classList.add("is-open");
    for (const group of side.querySelectorAll(".side__group")) {
      let shown = 0;
      for (const li of group.querySelectorAll("li")) {
        const hit = !q || li.textContent.toLowerCase().includes(q);
        li.hidden = !hit;
        if (hit) shown++;
      }
      group.hidden = shown === 0;
    }
  });
  search.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const first = side.querySelector("li:not([hidden]) a");
    if (first) location.href = first.href;
  });
}

for (const btn of document.querySelectorAll(".code__copy")) {
  btn.addEventListener("click", async () => {
    const code = btn.parentElement.querySelector("code");
    try {
      await navigator.clipboard.writeText(code.textContent);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Select and copy";
    }
    setTimeout(() => { btn.textContent = "Copy"; }, 1600);
  });
}

const links = [...document.querySelectorAll(".toc a")];
const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
if (targets.length && "IntersectionObserver" in window) {
  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) seen.set(e.target.id, e.isIntersecting);
    const on = targets.find((t) => seen.get(t.id)) ?? null;
    if (!on) return;
    for (const a of links) a.classList.toggle("is-on", a.hash === `#${on.id}`);
  }, { rootMargin: "-80px 0px -65% 0px" });
  targets.forEach((t) => io.observe(t));
}
