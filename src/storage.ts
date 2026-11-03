import type { Materia } from './types';

const KEY = 'grade-facil:v1';

export interface Estado {
  materias: Materia[];
  fixadas: Record<string, string>;
}

export function carregar(): Estado | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.materias)) return null;
    return { materias: data.materias, fixadas: data.fixadas ?? {} };
  } catch {
    return null;
  }
}

export function salvar(estado: Estado) {
  try {
    localStorage.setItem(KEY, JSON.stringify(estado));
  } catch {
    /* storage indisponível: segue só em memória */
  }
}

export function exportarJSON(estado: Estado) {
  const blob = new Blob([JSON.stringify({ versao: 1, ...estado }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'grade-facil.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importarJSON(file: File): Promise<Estado> {
  const data = JSON.parse(await file.text());
  if (!Array.isArray(data?.materias)) throw new Error('Arquivo inválido');
  return { materias: data.materias, fixadas: data.fixadas ?? {} };
}
