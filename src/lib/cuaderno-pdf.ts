import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { getSubject, SUBJECTS } from "@/lib/subjects";
import type { AudioNote, NotebookPage } from "@/lib/store";

type RGB = [number, number, number];

type Cover = { band: RGB };

const COVERS: Record<string, Cover> = {
  "civil-iv": { band: [72, 28, 28] },
  administrativo: { band: [36, 52, 74] },
  laboral: { band: [32, 64, 48] },
  mercantil: { band: [74, 54, 36] },
  procesal: { band: [32, 40, 60] },
  pruebas: { band: [40, 40, 44] },
  "practicas-adm": { band: [28, 64, 64] },
  "practicas-proc": { band: [74, 36, 36] },
};

const FALLBACK: Cover = { band: [17, 17, 19] };
const PAPER: RGB = [247, 244, 236];
const INK: RGB = [17, 17, 19];
const MUTED: RGB = [90, 86, 78];

const coverPages = new Set<number>();

function coverOf(slug: string | null | undefined): Cover {
  if (!slug) return FALLBACK;
  return COVERS[slug] ?? FALLBACK;
}

function pdfSafe(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ");
}

function slugName(slug: string | null | undefined): string {
  if (!slug) return "General";
  return getSubject(slug)?.name ?? slug;
}

function fileLabel(slug: string | null | undefined): string {
  return slugName(slug).replace(/\s+/g, "-");
}

function drawIusSeal(doc: jsPDF, cx: number, cy: number, r: number, color: RGB) {
  doc.setDrawColor(...color);
  doc.setLineWidth(Math.max(0.35, r * 0.018));
  doc.circle(cx, cy, r, "S");
  doc.setLineWidth(Math.max(0.12, r * 0.008));
  doc.circle(cx, cy, r * 0.88, "S");
  doc.setLineWidth(Math.max(0.22, r * 0.012));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    doc.line(
      cx + Math.cos(a) * r * 0.8,
      cy + Math.sin(a) * r * 0.8,
      cx + Math.cos(a) * r * 0.87,
      cy + Math.sin(a) * r * 0.87,
    );
  }
  const rw = r * 0.48;
  doc.setLineWidth(Math.max(0.16, r * 0.01));
  doc.line(cx - rw, cy - r * 0.22, cx + rw, cy - r * 0.22);
  doc.line(cx - rw, cy + r * 0.26, cx + rw, cy + r * 0.26);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(10, r * 0.72));
  const baseline = cy + r * 0.14;
  doc.text("I", cx - r * 0.32, baseline, { align: "center" });
  doc.text("U", cx, baseline, { align: "center" });
  doc.text("S", cx + r * 0.32, baseline, { align: "center" });
}

function addCover(doc: jsPDF, slug: string | null, workTitle?: string) {
  const cover = coverOf(slug);
  const subject = slug ? getSubject(slug) : undefined;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  doc.setFillColor(...PAPER);
  doc.rect(0, 0, w, h, "F");

  doc.setFillColor(...cover.band);
  doc.rect(0, 0, w, 7, "F");
  doc.rect(0, h - 7, w, 7, "F");

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.35);
  doc.rect(14, 18, w - 28, h - 36, "S");
  doc.setLineWidth(0.12);
  doc.rect(16.5, 20.5, w - 33, h - 41, "S");

  drawIusSeal(doc, cx, 88, 28, INK);

  const title = pdfSafe(subject?.name ?? "Cuaderno");
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(title, w - 56) as string[];
  let y = 140;
  doc.text(titleLines, cx, y, { align: "center" });
  y += titleLines.length * 12;

  if (subject?.fullName && subject.fullName !== subject.name) {
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...MUTED);
    const full = doc.splitTextToSize(pdfSafe(subject.fullName), w - 64) as string[];
    y += 6;
    doc.text(full, cx, y, { align: "center" });
    y += full.length * 6.5;
  }

  const work = workTitle?.trim();
  if (work && work !== title) {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.2);
    doc.line(cx - 16, y + 10, cx + 16, y + 10);
    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    const workLines = doc.splitTextToSize(pdfSafe(work), w - 64) as string[];
    doc.text(workLines, cx, y + 20, { align: "center" });
  }

  if (subject?.initials) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...cover.band);
    doc.text(subject.initials.split("").join("  "), cx, h - 48, {
      align: "center",
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("I   U   S", cx, h - 32, { align: "center" });

  coverPages.add(doc.getNumberOfPages());
}

function addHeader(doc: jsPDF, heading: string) {
  const w = doc.internal.pageSize.getWidth();
  drawIusSeal(doc, 18, 9.2, 5.2, INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(BRAND.name, 26, 10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(heading), w - 14, 10.5, { align: "right" });
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(14, 16, w - 14, 16);
}

function addFooter(doc: jsPDF, page: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.2);
  doc.line(14, h - 14, w - 14, h - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${page}`, w / 2, h - 8, { align: "center" });
}

function writeBody(
  doc: jsPDF,
  text: string,
  heading: string,
  startY = 26,
): number {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const maxW = w - 28;
  const maxY = h - 18;
  const lineH = 5.4;
  let y = startY;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(pdfSafe(text || "Sin apuntes."), maxW) as string[];
  for (const line of lines) {
    if (y + lineH > maxY) {
      doc.addPage();
      addHeader(doc, heading);
      y = 26;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...INK);
    }
    doc.text(line, 14, y);
    y += lineH;
  }
  return y;
}

function writeSectionTitle(doc: jsPDF, title: string, heading: string, y: number): number {
  const h = doc.internal.pageSize.getHeight();
  if (y > h - 40) {
    doc.addPage();
    addHeader(doc, heading);
    y = 26;
  }
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(pdfSafe(title), 14, y);
  return y + 8;
}

function pagesForSubject(
  pages: NotebookPage[],
  slug: string | null,
): NotebookPage[] {
  return pages
    .filter((p) => (p.subjectSlug ?? null) === slug)
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function audioFor(
  notes: AudioNote[],
  slug: string | null,
  pageIds: Set<string>,
): AudioNote[] {
  return notes.filter(
    (n) =>
      (n.subjectSlug ?? null) === slug || (n.pageId != null && pageIds.has(n.pageId)),
  );
}

function renderSubjectBlock(
  doc: jsPDF,
  slug: string | null,
  pages: NotebookPage[],
  audioNotes: AudioNote[],
  { first }: { first: boolean },
) {
  const subjectPages = pagesForSubject(pages, slug);
  const ids = new Set(subjectPages.map((p) => p.id));
  const audios = audioFor(audioNotes, slug, ids);
  if (subjectPages.length === 0 && audios.length === 0) return false;

  if (!first) doc.addPage();
  addCover(doc, slug);

  for (const page of subjectPages) {
    const heading = `${slugName(slug)} · ${page.title || "Sin título"}`;
    doc.addPage();
    addHeader(doc, heading);
    let y = 26;
    y = writeSectionTitle(doc, page.title || "Sin título", heading, y);
    writeBody(doc, page.body, heading, y);
  }

  if (audios.length > 0) {
    const heading = `${slugName(slug)} · Audio`;
    doc.addPage();
    addHeader(doc, heading);
    let y = writeSectionTitle(doc, "Transcripciones", heading, 26);
    audios.forEach((note, i) => {
      y = writeSectionTitle(doc, `Nota ${i + 1}`, heading, y);
      y = writeBody(doc, note.transcript, heading, y) + 6;
    });
  }
  return true;
}

function stampPages(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    if (coverPages.has(i)) continue;
    doc.setPage(i);
    addFooter(doc, i);
  }
}

export function downloadCuadernoPdf(opts: {
  kind: "hoja" | "materia" | "todo";
  pages: NotebookPage[];
  audioNotes: AudioNote[];
  page?: NotebookPage;
  subjectSlug?: string | null;
}): void {
  coverPages.clear();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let filename = `${BRAND.fileName}-cuaderno.pdf`;

  if (opts.kind === "hoja" && opts.page) {
    const page = opts.page;
    addCover(doc, page.subjectSlug, page.title || undefined);
    const heading = `${slugName(page.subjectSlug)} · ${page.title || "Sin título"}`;
    doc.addPage();
    addHeader(doc, heading);
    writeSectionTitle(doc, page.title || "Sin título", heading, 26);
    writeBody(doc, page.body, heading, 38);
    const related = opts.audioNotes.filter(
      (n) => n.pageId === page.id || (!n.pageId && n.subjectSlug === page.subjectSlug),
    );
    if (related.length > 0) {
      doc.addPage();
      addHeader(doc, heading);
      let y = writeSectionTitle(doc, "Transcripciones", heading, 26);
      related.forEach((note, i) => {
        y = writeSectionTitle(doc, `Nota ${i + 1}`, heading, y);
        y = writeBody(doc, note.transcript, heading, y) + 6;
      });
    }
    filename = `${BRAND.fileName}-${fileLabel(page.subjectSlug)}.pdf`;
  } else if (opts.kind === "materia") {
    const slug = opts.subjectSlug ?? opts.page?.subjectSlug ?? null;
    const ok = renderSubjectBlock(doc, slug, opts.pages, opts.audioNotes, {
      first: true,
    });
    if (!ok) {
      addCover(doc, slug);
    }
    filename = `${BRAND.fileName}-${fileLabel(slug)}.pdf`;
  } else {
    let first = true;
    const slugs: Array<string | null> = [...SUBJECTS.map((s) => s.slug), null];
    for (const slug of slugs) {
      const drew = renderSubjectBlock(doc, slug, opts.pages, opts.audioNotes, {
        first,
      });
      if (drew) first = false;
    }
    if (first) {
      addCover(doc, null);
    }
    filename = `${BRAND.fileName}-cuaderno.pdf`;
  }

  stampPages(doc);
  doc.save(filename);
}
