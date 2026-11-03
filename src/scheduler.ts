import type { Materia, Slot, Turma } from './types';

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const slotValido = (s: Slot) => toMin(s.inicio) < toMin(s.fim);

const slotsChocam = (a: Slot, b: Slot) =>
  a.dia === b.dia && toMin(a.inicio) < toMin(b.fim) && toMin(b.inicio) < toMin(a.fim);

export const turmasChocam = (a: Turma, b: Turma) =>
  a.slots.some((sa) => b.slots.some((sb) => slotsChocam(sa, sb)));

export interface Escolha {
  materia: Materia;
  turma: Turma;
}

export interface Opcao {
  escolhas: Escolha[];
  /** matérias que ficaram de fora por conflito */
  fora: Materia[];
  dias: number;
  /** minutos de "janela" entre aulas no mesmo dia */
  janelas: number;
  creditos: number;
}

const LIMITE_RESULTADOS = 300;
const LIMITE_PASSOS = 250_000;
const INTERVALO_MAX = 20;

/**
 * Gera todas as combinações de turmas sem choque de horário.
 * Se não existir combinação com todas as matérias, devolve as que encaixam
 * o maior número possível delas.
 */
export function gerarGrades(materias: Materia[], fixadas: Record<string, string>): Opcao[] {
  const lista = materias
    .map((m) => ({ ...m, turmas: m.turmas.filter((t) => t.slots.length && t.slots.every(slotValido)) }))
    .filter((m) => m.turmas.length > 0)
    // matérias com menos opções primeiro = poda mais cedo
    .sort((a, b) => a.turmas.length - b.turmas.length);

  let melhor = 0;
  let resultados: Escolha[][] = [];
  let passos = 0;
  const atual: Escolha[] = [];

  const bt = (i: number) => {
    if (++passos > LIMITE_PASSOS) return;
    if (atual.length + (lista.length - i) < melhor) return;
    if (i === lista.length) {
      if (atual.length > melhor) {
        melhor = atual.length;
        resultados = [];
      }
      if (atual.length === melhor && resultados.length < LIMITE_RESULTADOS) resultados.push([...atual]);
      return;
    }
    const m = lista[i];
    const opcoes = fixadas[m.id] ? m.turmas.filter((t) => t.id === fixadas[m.id]) : m.turmas;
    for (const t of opcoes) {
      if (atual.some((e) => turmasChocam(e.turma, t))) continue;
      atual.push({ materia: m, turma: t });
      bt(i + 1);
      atual.pop();
    }
    bt(i + 1); // tentar sem essa matéria
  };

  if (lista.length) bt(0);
  if (melhor === 0) return [];

  return resultados
    .map((escolhas) => avaliar(escolhas, lista))
    .sort((a, b) => a.dias - b.dias || a.janelas - b.janelas);
}

function avaliar(escolhas: Escolha[], todas: Materia[]): Opcao {
  const porDia = new Map<number, Slot[]>();
  for (const e of escolhas)
    for (const s of e.turma.slots) porDia.set(s.dia, [...(porDia.get(s.dia) ?? []), s]);

  let janelas = 0;
  for (const slots of porDia.values()) {
    const ord = [...slots].sort((a, b) => toMin(a.inicio) - toMin(b.inicio));
    for (let i = 1; i < ord.length; i++) {
      const gap = toMin(ord[i].inicio) - toMin(ord[i - 1].fim);
      if (gap > INTERVALO_MAX) janelas += gap; // intervalinho entre aulas não conta como janela
    }
  }

  const ids = new Set(escolhas.map((e) => e.materia.id));
  return {
    escolhas: [...escolhas].sort((a, b) => a.materia.nome.localeCompare(b.materia.nome)),
    fora: todas.filter((m) => !ids.has(m.id)),
    dias: porDia.size,
    janelas,
    creditos: escolhas.reduce((s, e) => s + e.materia.creditos, 0),
  };
}
