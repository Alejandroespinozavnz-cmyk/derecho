import {
  Briefcase,
  FileSignature,
  Folders,
  Gavel,
  Landmark,
  Scale,
  Search,
  Stamp,
  type LucideIcon,
} from "lucide-react";

export const ROOT_FOLDER_ID = "1ulXKDXMJWXN5x91TlX_os8Cw4xKbyAZp";
export const ROOT_FOLDER_LINK =
  "https://drive.google.com/drive/folders/1ulXKDXMJWXN5x91TlX_os8Cw4xKbyAZp";
export const SCHEDULE_PDF_ID = "1_4fRWNGEf7lbhQfGF3k-M_d1ZzRmtuCi";
export const SCHEDULE_PDF_LINK =
  "https://drive.google.com/file/d/1_4fRWNGEf7lbhQfGF3k-M_d1ZzRmtuCi/view";

export type FileKind =
  | "folder"
  | "document"
  | "slides"
  | "pdf"
  | "image"
  | "text"
  | "other";

export type CatalogFile = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  sizeBytes?: number;
  modifiedTime?: string;
  webViewLink: string;
  kind: FileKind;
  exam?: boolean;
};

export type Subject = {
  slug: string;
  name: string;
  fullName: string;
  hint: string;
  folderId: string;
  driveLink: string;
  icon: LucideIcon;
  initials: string;
  topics: string[];
  files: CatalogFile[];
};

export function kindFromMime(mime: string, isFolder?: boolean): FileKind {
  if (isFolder || mime === "application/vnd.google-apps.folder") return "folder";
  if (
    mime === "application/vnd.google-apps.presentation" ||
    mime.includes("presentationml.presentation")
  )
    return "slides";
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/vnd.google-apps.document" ||
    mime.includes("wordprocessingml") ||
    mime === "application/msword"
  )
    return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("xml"))
    return "text";
  return "other";
}

export function isExamName(name: string): boolean {
  return /parcial|final|examen|bater[ií]a|preguntas/i.test(name);
}

export function catalogFile(input: {
  id: string;
  name: string;
  mimeType: string;
  isFolder?: boolean;
  sizeBytes?: number;
  modifiedTime?: string;
  webViewLink: string;
}): CatalogFile {
  const kind = kindFromMime(input.mimeType, input.isFolder);
  return {
    ...input,
    isFolder: Boolean(input.isFolder) || kind === "folder",
    kind,
    exam: isExamName(input.name),
  };
}

export const SUBJECTS: Subject[] = [
  {
    slug: "civil-iv",
    name: "Civil IV",
    fullName: "Derecho Civil IV — Contratos y garantías",
    hint: "Venta, depósito, contratos y garantías",
    folderId: "1hFQGX3nlpiFlhfGPkjY2sa0IicjuGvN9",
    driveLink:
      "https://drive.google.com/drive/folders/1hFQGX3nlpiFlhfGPkjY2sa0IicjuGvN9",
    icon: FileSignature,
    initials: "CIV",
    topics: [
      "Contrato de venta",
      "Depósito",
      "Garantías",
      "I Parcial — clases",
      "II Parcial — clases",
      "Doctrina y jurisprudencia",
    ],
    files: [
      catalogFile({
        id: "1EzKlV5DKKkibfHjGBawsdLNlAl6erMQ7",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1EzKlV5DKKkibfHjGBawsdLNlAl6erMQ7",
      }),
      catalogFile({
        id: "1LfC1ysMzGjiF_SktXKiUX_IT7dU5hOPe",
        name: "Guías",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1LfC1ysMzGjiF_SktXKiUX_IT7dU5hOPe",
      }),
      catalogFile({
        id: "12F-8GT49kxBLZNNGRYiJLwVVo-_gWksN",
        name: "Legislación y jurisprudencia",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/12F-8GT49kxBLZNNGRYiJLwVVo-_gWksN",
      }),
      catalogFile({
        id: "1F2jVQewPOOFRbXZQyPFZiENXODbAVpjy",
        name: "Material del profesor",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1F2jVQewPOOFRbXZQyPFZiENXODbAVpjy",
      }),
      catalogFile({
        id: "179OU3CQbMQOiBX9Ioj2Tm-kXBQweGk9f",
        name: "Trabajos",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/179OU3CQbMQOiBX9Ioj2Tm-kXBQweGk9f",
      }),
      catalogFile({
        id: "15YAAUcd-rf_j3kJC-QG3O7bwbL9GKeyQrDzXvNFFdyA",
        name: "Apuntes de Derecho Civil IV (Contratos y garantías)",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/15YAAUcd-rf_j3kJC-QG3O7bwbL9GKeyQrDzXvNFFdyA/edit",
      }),
      catalogFile({
        id: "1s0kjtYgeb1dmC2Lkt-9VOB3jFDWSAZCc",
        name: "Civil III Parcial parte César.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1s0kjtYgeb1dmC2Lkt-9VOB3jFDWSAZCc/edit",
      }),
      catalogFile({
        id: "11HnImYBjni9TF19IgYudhSAORTqDYC97",
        name: "Clases Civil I Parcial.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/11HnImYBjni9TF19IgYudhSAORTqDYC97/edit",
      }),
      catalogFile({
        id: "1ocRy6nNapFtLesLykEARe1_HEhWe3YvH",
        name: "Clases Civil II Parcial.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1ocRy6nNapFtLesLykEARe1_HEhWe3YvH/edit",
      }),
      catalogFile({
        id: "1Jh51z1Yfp62wLVsWdtqCFMvaExLERdHt",
        name: "Deposito parte Cesar.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1Jh51z1Yfp62wLVsWdtqCFMvaExLERdHt/edit",
      }),
    ],
  },
  {
    slug: "administrativo",
    name: "Administrativo III",
    fullName: "Derecho Administrativo III",
    hint: "Contencioso, LOJCA, batería de preguntas",
    folderId: "1oVvk6LoQYn2MSU71omJO6ODHkzJCgD5h",
    driveLink:
      "https://drive.google.com/drive/folders/1oVvk6LoQYn2MSU71omJO6ODHkzJCgD5h",
    icon: Landmark,
    initials: "ADM",
    topics: [
      "Contencioso administrativo",
      "LOJCA",
      "Tema 6",
      "Tema 7",
      "Mapa conceptual",
      "Batería I Parcial",
    ],
    files: [
      catalogFile({
        id: "1TegguksJuxYzxr4FFKB-sm2ctleiMG5i",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1TegguksJuxYzxr4FFKB-sm2ctleiMG5i",
      }),
      catalogFile({
        id: "1h_MTa9xn2tk3RvwMZpYsoHUSxd6sAVKm",
        name: "Guías",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1h_MTa9xn2tk3RvwMZpYsoHUSxd6sAVKm",
      }),
      catalogFile({
        id: "1ZNHd8cMpOEwTsjftHGlwNSoAjkQ2cL5D",
        name: "II Parcial",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1ZNHd8cMpOEwTsjftHGlwNSoAjkQ2cL5D",
      }),
      catalogFile({
        id: "1Uv1ar_ZzHDR3pAo8lDyNhNfOi2xjEREd",
        name: "Legislación y jurisprudencia",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1Uv1ar_ZzHDR3pAo8lDyNhNfOi2xjEREd",
      }),
      catalogFile({
        id: "1NSFzfaF_wquBZEyinw9xeWxSvRgpW16Z",
        name: "Material aula virtual",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1NSFzfaF_wquBZEyinw9xeWxSvRgpW16Z",
      }),
      catalogFile({
        id: "1-p9oAtiJ6X9dDKqzbQhB_92Bf380RnzK",
        name: "Material del docente",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1-p9oAtiJ6X9dDKqzbQhB_92Bf380RnzK",
      }),
      catalogFile({
        id: "1VdcHP4iOCpb1dYk4qIf_tEyJaBDQ2x6-kblxveB2jfw",
        name: "Apuntes de Derecho Administrativo III",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1VdcHP4iOCpb1dYk4qIf_tEyJaBDQ2x6-kblxveB2jfw/edit",
      }),
      catalogFile({
        id: "1DQ_V0jff1CPJzZBn0jV0R9eB8pyhSEgACvkwHqmIdPI",
        name: "I Parcial - batería de preguntas",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1DQ_V0jff1CPJzZBn0jV0R9eB8pyhSEgACvkwHqmIdPI/edit",
      }),
      catalogFile({
        id: "1wrtGPSwwfuCFrh2ZlrGj1cakjjsRs-spZ_H-4INq-t8",
        name: "LOJCA",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1wrtGPSwwfuCFrh2ZlrGj1cakjjsRs-spZ_H-4INq-t8/edit",
      }),
      catalogFile({
        id: "13aP515nGcAkt3h3TdgJHPbU-8eglvYXK",
        name: "Mapa conceptual.pptx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        webViewLink:
          "https://docs.google.com/presentation/d/13aP515nGcAkt3h3TdgJHPbU-8eglvYXK/edit",
      }),
      catalogFile({
        id: "1xVTR8hze32NHzbE6wzCZ6w7zCq_7EHn8",
        name: "Contencioso Administrativo I Parcial.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1xVTR8hze32NHzbE6wzCZ6w7zCq_7EHn8/edit",
      }),
    ],
  },
  {
    slug: "laboral",
    name: "Laboral",
    fullName: "Derecho del Trabajo",
    hint: "Contrato, prestaciones, parciales y final",
    folderId: "1bXzW1pP28ElKjWT9ZUIlBJWZ4PFYWKj6",
    driveLink:
      "https://drive.google.com/drive/folders/1bXzW1pP28ElKjWT9ZUIlBJWZ4PFYWKj6",
    icon: Briefcase,
    initials: "LAB",
    topics: [
      "Contrato de trabajo",
      "Prestaciones por antigüedad",
      "I Parcial",
      "Guía II corte",
      "Final",
    ],
    files: [
      catalogFile({
        id: "1eOSyz4pP5JrzrTFFX7IHkkvLHvnG0FCo",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1eOSyz4pP5JrzrTFFX7IHkkvLHvnG0FCo",
      }),
      catalogFile({
        id: "1LWUhPzhkqjldg7n0HJnrJGMo33gyoJc_",
        name: "Guías",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1LWUhPzhkqjldg7n0HJnrJGMo33gyoJc_",
      }),
      catalogFile({
        id: "1vl6UwnJdqCRPV62Bj1ZBmJEJ8m59FKix",
        name: "Material del profesor",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1vl6UwnJdqCRPV62Bj1ZBmJEJ8m59FKix",
      }),
      catalogFile({
        id: "1btlz-XoX7GigLUp5Hx6h_5W-4HZU1OlEeFe7FAGR5Y4",
        name: "Apuntes de Derecho Laboral",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1btlz-XoX7GigLUp5Hx6h_5W-4HZU1OlEeFe7FAGR5Y4/edit",
      }),
      catalogFile({
        id: "1hj8AHxCYeSjExdfWuP6_yIkGC2RFC90W",
        name: "I Parcial CESAR BAEZ.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1hj8AHxCYeSjExdfWuP6_yIkGC2RFC90W/edit",
      }),
      catalogFile({
        id: "1r3X2Q57x4N5N-ETDl-W9alGwB-oNtrzK",
        name: "GUIA LABORAL 2DO CORTE — contrato y prestaciones",
        mimeType: "application/msword",
        webViewLink:
          "https://docs.google.com/document/d/1r3X2Q57x4N5N-ETDl-W9alGwB-oNtrzK/edit",
      }),
      catalogFile({
        id: "1XeR__2K6ZC4SIWe37pGzVQKJOndm5m4o",
        name: "FINAL CESAR BAEZ.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1XeR__2K6ZC4SIWe37pGzVQKJOndm5m4o/edit",
      }),
      catalogFile({
        id: "1F4j3zy7bP8Oeeb2wlPEVrpgCe-S9io40",
        name: "LABORAL.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1F4j3zy7bP8Oeeb2wlPEVrpgCe-S9io40/edit",
      }),
    ],
  },
  {
    slug: "mercantil",
    name: "Mercantil I",
    fullName: "Derecho Mercantil I",
    hint: "Parciales y final de años anteriores",
    folderId: "1R2oRUMIPj06gNEVi0i7I3cHar_iDGUuF",
    driveLink:
      "https://drive.google.com/drive/folders/1R2oRUMIPj06gNEVi0i7I3cHar_iDGUuF",
    icon: Folders,
    initials: "MER",
    topics: ["I Parcial", "II Parcial", "Final", "Doctrina", "Guías"],
    files: [
      catalogFile({
        id: "1RaMGTIBNg0jeFqm0vNbrXkoive365FRv",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1RaMGTIBNg0jeFqm0vNbrXkoive365FRv",
      }),
      catalogFile({
        id: "1xjkX64YbvyHsk_nbBYxElDsk-szxXjnt",
        name: "Guías",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1xjkX64YbvyHsk_nbBYxElDsk-szxXjnt",
      }),
      catalogFile({
        id: "1fPfG-I34LaVIHKBzTyXjtxoyCsL7_SjS",
        name: "Legislación y jurisprudencia",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1fPfG-I34LaVIHKBzTyXjtxoyCsL7_SjS",
      }),
      catalogFile({
        id: "1nb9dFV4C6BjS2OLJr--KpNeDRERro1CE",
        name: "PRIMER PARCIAL 4C 18 01 2021 DERECHO MERCANTIL I.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1nb9dFV4C6BjS2OLJr--KpNeDRERro1CE/edit",
      }),
      catalogFile({
        id: "1TcjUNz1Cz-IIcjt05SDwn7yxXwxPpgog",
        name: "II Parcial - CESAR BAEZ.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1TcjUNz1Cz-IIcjt05SDwn7yxXwxPpgog/edit",
      }),
      catalogFile({
        id: "14QRQvxBZzZaTP-wK7PQ10XREE79uH77H",
        name: "SEGUNDO PARCIAL 4C 2021 DERECHO MERCANTIL I.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/14QRQvxBZzZaTP-wK7PQ10XREE79uH77H/edit",
      }),
      catalogFile({
        id: "1Z924MfGMOohAfx8MO7rmZHGSf-GOZy_E",
        name: "FINAL 4C 2021.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1Z924MfGMOohAfx8MO7rmZHGSf-GOZy_E/edit",
      }),
    ],
  },
  {
    slug: "procesal",
    name: "Procesal Civil II",
    fullName: "Derecho Procesal Civil II",
    hint: "Contestación, incidentes, cuestiones previas",
    folderId: "17nleo_3few4ym71P7fNQoHcUprshVzQ6",
    driveLink:
      "https://drive.google.com/drive/folders/17nleo_3few4ym71P7fNQoHcUprshVzQ6",
    icon: Scale,
    initials: "PRC",
    topics: [
      "Contestación de la demanda",
      "Procedimiento incidental",
      "Cuestiones previas",
      "Temas 11 y 12",
      "I Parcial / Final",
    ],
    files: [
      catalogFile({
        id: "10Bkhgp8dIe8m9Ab6CREqXxSwewMPoVAQ",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/10Bkhgp8dIe8m9Ab6CREqXxSwewMPoVAQ",
      }),
      catalogFile({
        id: "1UnrA3TfjIiTW57X84gWurm2-u1i3R7IB",
        name: "Material del profesor",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1UnrA3TfjIiTW57X84gWurm2-u1i3R7IB",
      }),
      catalogFile({
        id: "1iOJTKT78fcv63OoEn-mLFo-ZQas4gDMS",
        name: "Contestacion a la demanda.pptx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        webViewLink:
          "https://docs.google.com/presentation/d/1iOJTKT78fcv63OoEn-mLFo-ZQas4gDMS/edit",
      }),
      catalogFile({
        id: "1hazP29ej2V_Q83zhLs_GF6LHuCFQAkSV",
        name: "Contestacion de la demanda.pdf",
        mimeType: "application/pdf",
        webViewLink:
          "https://drive.google.com/file/d/1hazP29ej2V_Q83zhLs_GF6LHuCFQAkSV/view",
      }),
      catalogFile({
        id: "1Ra1ZgCdcnHO0c8SbNmKVSQv9lqU-RWUr",
        name: "Derecho Procesal Civil 2.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1Ra1ZgCdcnHO0c8SbNmKVSQv9lqU-RWUr/edit",
      }),
      catalogFile({
        id: "1J09Hx3a4iFhoar2YJRp36_3pXC-ORgXj",
        name: "I Parcial - CESAR BAEZ.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1J09Hx3a4iFhoar2YJRp36_3pXC-ORgXj/edit",
      }),
      catalogFile({
        id: "1JtUL46MiHyMfq0E5ZCwTqrWk7GjnIgmy",
        name: "Final - CESAR BAEZ.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1JtUL46MiHyMfq0E5ZCwTqrWk7GjnIgmy/edit",
      }),
      catalogFile({
        id: "1AOGE2Enl-9epNn9HnJtljpVXPt_dEBPn",
        name: "Procedimiento Incidental CP.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1AOGE2Enl-9epNn9HnJtljpVXPt_dEBPn/edit",
      }),
      catalogFile({
        id: "1kHkV3kSqgWtkMnl1ZqkaigjwwAWtotbL",
        name: "Resumen Cuestiones Previas.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1kHkV3kSqgWtkMnl1ZqkaigjwwAWtotbL/edit",
      }),
    ],
  },
  {
    slug: "pruebas",
    name: "Pruebas",
    fullName: "Derecho de Pruebas",
    hint: "Apuntes, I y II parcial",
    folderId: "1-vaEtRRb4ydvlVz2mk82DKo_C1OsMjWr",
    driveLink:
      "https://drive.google.com/drive/folders/1-vaEtRRb4ydvlVz2mk82DKo_C1OsMjWr",
    icon: Search,
    initials: "PRB",
    topics: ["Medios de prueba", "I Parcial", "II Parcial", "Legislación"],
    files: [
      catalogFile({
        id: "1gjLeRRGInzxIzUD-4yFQBrY-snjKRFS0",
        name: "Doctrina",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1gjLeRRGInzxIzUD-4yFQBrY-snjKRFS0",
      }),
      catalogFile({
        id: "1KNOhmIbMPJx3Irit7MQx915ko2-uBW4g",
        name: "Material del profe",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1KNOhmIbMPJx3Irit7MQx915ko2-uBW4g",
      }),
      catalogFile({
        id: "1_sMuCpLSMTC7Q7Ed1uifqCJZX3eEYRgV0X6ZnkOt9cA",
        name: "Apuntes de Derecho de Pruebas",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1_sMuCpLSMTC7Q7Ed1uifqCJZX3eEYRgV0X6ZnkOt9cA/edit",
      }),
      catalogFile({
        id: "1Mhm-kouEq5miXCxU8gv3j1xdpRXSnNVN",
        name: "I PARCIAL César Báez.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1Mhm-kouEq5miXCxU8gv3j1xdpRXSnNVN/edit",
      }),
      catalogFile({
        id: "1XbCz9tl-1prpbmv5_FQ1kxBeoc-W1RL9",
        name: "II Parcial Cesar Baez.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1XbCz9tl-1prpbmv5_FQ1kxBeoc-W1RL9/edit",
      }),
    ],
  },
  {
    slug: "practicas-adm",
    name: "Prácticas adm.",
    fullName: "Prácticas administrativas",
    hint: "Asignaciones, apuntes y modelos",
    folderId: "1W6aXs-GjU87jvw5vIgw-NgO9VuMMpksy",
    driveLink:
      "https://drive.google.com/drive/folders/1W6aXs-GjU87jvw5vIgw-NgO9VuMMpksy",
    icon: Stamp,
    initials: "PAD",
    topics: ["Asignaciones", "Apuntes", "Modelos", "Legislación"],
    files: [
      catalogFile({
        id: "1b2J9H4_iREeZ9JOd8I-Uq6aKre7DUFd-",
        name: "Asignaciones",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/1b2J9H4_iREeZ9JOd8I-Uq6aKre7DUFd-",
      }),
      catalogFile({
        id: "15oPHC1JnZbC5xWXYB20PiiZcjRbPgbRt",
        name: "Material del profesor",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/15oPHC1JnZbC5xWXYB20PiiZcjRbPgbRt",
      }),
      catalogFile({
        id: "1tefVcv4QqMhNOVjUBELeSdlWX4hm8SDkKXYu8l7izSQ",
        name: "Apuntes de prácticas administrativas",
        mimeType: "application/vnd.google-apps.document",
        webViewLink:
          "https://docs.google.com/document/d/1tefVcv4QqMhNOVjUBELeSdlWX4hm8SDkKXYu8l7izSQ/edit",
      }),
    ],
  },
  {
    slug: "practicas-proc",
    name: "Prácticas proc.",
    fullName: "Prácticas procesales civiles y mercantiles",
    hint: "Modelos de contestación y promoción de pruebas",
    folderId: "1wltG_YyXhGkxKGGUz_ZcG__S6ObW4GWR",
    driveLink:
      "https://drive.google.com/drive/folders/1wltG_YyXhGkxKGGUz_ZcG__S6ObW4GWR",
    icon: Gavel,
    initials: "PPR",
    topics: [
      "Modelo de contestación",
      "Promoción de pruebas",
      "Asignaciones",
    ],
    files: [
      catalogFile({
        id: "14OIoACDEww1PE1pdCGzve7pc5Mm-c7Ns",
        name: "Asignaciones",
        mimeType: "application/vnd.google-apps.folder",
        isFolder: true,
        webViewLink:
          "https://drive.google.com/drive/folders/14OIoACDEww1PE1pdCGzve7pc5Mm-c7Ns",
      }),
      catalogFile({
        id: "1vWdRlphe7MXceknY5w8r90kvgCk_II63",
        name: "Modelo de contestacion.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1vWdRlphe7MXceknY5w8r90kvgCk_II63/edit",
      }),
      catalogFile({
        id: "1zWIT4-hAQ03YrtLDXYEMrMROrj1SstyK",
        name: "Modelo promoción de pruebas",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        webViewLink:
          "https://docs.google.com/document/d/1zWIT4-hAQ03YrtLDXYEMrMROrj1SstyK/edit",
      }),
    ],
  },
];

export const SUBJECT_BY_SLUG = Object.fromEntries(
  SUBJECTS.map((s) => [s.slug, s]),
) as Record<string, Subject>;

export function allCatalogFiles(): Array<CatalogFile & { subjectSlug: string }> {
  return SUBJECTS.flatMap((s) =>
    s.files.map((f) => ({ ...f, subjectSlug: s.slug })),
  );
}

export function getSubject(slug: string): Subject | undefined {
  return SUBJECT_BY_SLUG[slug];
}
