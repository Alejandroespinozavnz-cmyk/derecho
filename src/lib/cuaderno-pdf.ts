import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import { YEAR } from "@/lib/program";
import { getSubject, SUBJECTS } from "@/lib/subjects";
import type { AudioNote, NotebookPage } from "@/lib/store";

type RGB = [number, number, number];

type Cover = { band: RGB };

const COVERS: Record<string, Cover> = {
  "civil-iv": { band: [122, 40, 38] },
  administrativo: { band: [47, 72, 102] },
  laboral: { band: [46, 90, 64] },
  mercantil: { band: [110, 78, 48] },
  procesal: { band: [40, 52, 78] },
  pruebas: { band: [48, 48, 52] },
  "practicas-adm": { band: [32, 92, 92] },
  "practicas-proc": { band: [120, 52, 52] },
};

const FALLBACK: Cover = { band: [17, 17, 19] };
const PAPER: RGB = [250, 250, 249];
const INK: RGB = [17, 17, 19];
const MUTED: RGB = [92, 92, 100];

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

function fileStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugName(slug: string | null | undefined): string {
  if (!slug) return "General";
  return getSubject(slug)?.name ?? slug;
}

function addCover(doc: jsPDF, slug: string | null, subtitle: string) {
  const cover = coverOf(slug);
  const subject = slug ? getSubject(slug) : undefined;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(...PAPER);
  doc.rect(0, 0, w, h, "F");
  doc.setFillColor(...cover.band);
  doc.rect(0, 0, 8, h, "F");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(BRAND.name, 22, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(YEAR.academicYear), 22, 36);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const title = pdfSafe(subject?.name ?? "Cuaderno");
  const titleLines = doc.splitTextToSize(title, w - 44) as string[];
  doc.text(titleLines, 22, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(subtitle), 22, 72 + titleLines.length * 12);

  if (subject?.fullName && subject.fullName !== subject.name) {
    doc.setFontSize(10);
    doc.text(pdfSafe(subject.fullName), 22, h - 36);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(pdfSafe(YEAR.university), 22, h - 24);

  if (subject?.initials) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(...cover.band);
    doc.text(subject.initials, w - 16, h - 22, { align: "right" });
  }
}

function addHeader(doc: jsPDF, heading: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...INK);
  doc.rect(0, 0, w, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(244, 244, 245);
  doc.text(pdfSafe(heading), 14, 9);
  doc.setFont("helvetica", "normal");
  doc.text(BRAND.name, w - 14, 9, { align: "right" });
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${page} / ${total}`, w / 2, h - 10, { align: "center" });
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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(pdfSafe(text || "Sin apuntes."), maxW) as string[];
  for (const line of lines) {
    if (y + lineH > maxY) {
      doc.addPage();
      addHeader(doc, heading);
      y = 26;
      doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
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
  const subtitle =
    subjectPages.length === 1
      ? subjectPages[0]?.title || "Hoja"
      : `${subjectPages.length} hojas`;
  addCover(doc, slug, subtitle);

  for (const page of subjectPages) {
    const heading = `${slugName(slug)} · ${page.title || "Sin título"}`;
    doc.addPage();
    addHeader(doc, heading);
    let y = 26;
    y = writeSectionTitle(doc, page.title || "Sin título", heading, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
      pdfSafe(new Date(page.updatedAt).toLocaleString("es-VE")),
      14,
      y,
    );
    y += 8;
    writeBody(doc, page.body, heading, y);
  }

  if (audios.length > 0) {
    const heading = `${slugName(slug)} · Audio`;
    doc.addPage();
    addHeader(doc, heading);
    let y = writeSectionTitle(doc, "Transcripciones", heading, 26);
    for (const note of audios) {
      const stamp = new Date(note.at).toLocaleString("es-VE");
      y = writeSectionTitle(doc, stamp, heading, y);
      y = writeBody(doc, note.transcript, heading, y) + 6;
    }
  }
  return true;
}

function stampPages(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i, total);
  }
}

export function downloadCuadernoPdf(opts: {
  kind: "hoja" | "materia" | "todo";
  pages: NotebookPage[];
  audioNotes: AudioNote[];
  page?: NotebookPage;
  subjectSlug?: string | null;
}): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let filename = `${BRAND.fileName}-cuaderno-${fileStamp()}.pdf`;

  if (opts.kind === "hoja" && opts.page) {
    const page = opts.page;
    addCover(doc, page.subjectSlug, page.title || "Hoja");
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
      for (const note of related) {
        y = writeSectionTitle(
          doc,
          new Date(note.at).toLocaleString("es-VE"),
          heading,
          y,
        );
        y = writeBody(doc, note.transcript, heading, y) + 6;
      }
    }
    filename = `${BRAND.fileName}-${slugName(page.subjectSlug).replace(/\s+/g, "-")}-${fileStamp()}.pdf`;
  } else if (opts.kind === "materia") {
    const slug = opts.subjectSlug ?? opts.page?.subjectSlug ?? null;
    const ok = renderSubjectBlock(doc, slug, opts.pages, opts.audioNotes, {
      first: true,
    });
    if (!ok) {
      addCover(doc, slug, "Sin hojas");
    }
    filename = `${BRAND.fileName}-${slugName(slug).replace(/\s+/g, "-")}-${fileStamp()}.pdf`;
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
      addCover(doc, null, "Vacío");
    }
    filename = `${BRAND.fileName}-cuaderno-${fileStamp()}.pdf`;
  }

  stampPages(doc);
  doc.save(filename);
}
