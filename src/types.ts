export type Status = 'pendente' | 'quero' | 'cursando' | 'concluida';

export interface Slot {
  /** 0 = segunda ... 5 = sábado */
  dia: number;
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
}

export interface Turma {
  id: string;
  nome: string;
  professor?: string;
  slots: Slot[];
}

export interface Materia {
  id: string;
  nome: string;
  codigo?: string;
  creditos: number;
  cor: string;
  status: Status;
  turmas: Turma[];
}

export const STATUS_LABEL: Record<Status, string> = {
  pendente: 'Pendentes',
  quero: 'Quero cursar',
  cursando: 'Cursando',
  concluida: 'Concluídas',
};

export const STATUS_ORDER: Status[] = ['pendente', 'quero', 'cursando', 'concluida'];

export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_LONGO = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const CORES = [
  '#0969da', '#cf222e', '#1a7f37', '#9a6700', '#8250df',
  '#bc4c00', '#1b7c83', '#bf3989', '#57606a', '#4d7c0f',
];

/** Paletas de versões anteriores, para migrar dados salvos (mesma ordem). */
export const CORES_LEGADAS = [
  ['#4f7cff', '#e5534b', '#2da44e', '#d4a72c', '#a371f7', '#f0883e', '#1f9eb7', '#db61a2', '#6e7781', '#57ab5a'],
  ['#3d5a98', '#b4442c', '#3e7a4f', '#b08a2e', '#6b4f96', '#c0652b', '#2f7a7a', '#a14468', '#5d6470', '#7a8a32'],
];

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
