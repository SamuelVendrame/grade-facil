import type { Materia } from './types';
import { CORES, uid } from './types';

const t = (nome: string, professor: string, slots: [number, string, string][]) => ({
  id: uid(),
  nome,
  professor,
  slots: slots.map(([dia, inicio, fim]) => ({ dia, inicio, fim })),
});

export const exemplo = (): Materia[] => [
  {
    id: uid(), nome: 'Estruturas de Dados', codigo: 'ED201', creditos: 4, cor: CORES[0], status: 'quero',
    turmas: [
      t('T01', 'Prof. Ana', [[0, '19:00', '20:40'], [2, '19:00', '20:40']]),
      t('T02', 'Prof. Bruno', [[1, '20:50', '22:30'], [3, '20:50', '22:30']]),
    ],
  },
  {
    id: uid(), nome: 'Banco de Dados', codigo: 'BD210', creditos: 4, cor: CORES[2], status: 'quero',
    turmas: [
      t('T01', 'Prof. Carla', [[0, '20:50', '22:30'], [2, '20:50', '22:30']]),
      t('T02', 'Prof. Diego', [[1, '19:00', '20:40'], [3, '19:00', '20:40']]),
    ],
  },
  {
    id: uid(), nome: 'Engenharia de Software', codigo: 'ES220', creditos: 4, cor: CORES[4], status: 'quero',
    turmas: [
      t('T01', 'Prof. Elisa', [[0, '19:00', '20:40'], [4, '19:00', '20:40']]),
      t('T02', 'Prof. Fábio', [[4, '19:00', '22:30']]),
    ],
  },
  {
    id: uid(), nome: 'Redes de Computadores', codigo: 'RC230', creditos: 2, cor: CORES[5], status: 'quero',
    turmas: [
      t('T01', 'Prof. Gil', [[5, '08:00', '11:40']]),
      t('T02', 'Prof. Helena', [[3, '19:00', '20:40']]),
    ],
  },
  {
    id: uid(), nome: 'Sistemas Operacionais', codigo: 'SO240', creditos: 4, cor: CORES[6], status: 'pendente',
    turmas: [t('T01', 'Prof. Igor', [[1, '19:00', '22:30']])],
  },
  { id: uid(), nome: 'Compiladores', codigo: 'CP310', creditos: 4, cor: CORES[7], status: 'pendente', turmas: [] },
  {
    id: uid(), nome: 'Programação III', codigo: 'PG300', creditos: 4, cor: CORES[1], status: 'cursando',
    turmas: [t('T01', 'Prof. João', [[2, '19:00', '22:30']])],
  },
  { id: uid(), nome: 'Cálculo I', codigo: 'MA101', creditos: 6, cor: CORES[3], status: 'concluida', turmas: [] },
  { id: uid(), nome: 'Algoritmos', codigo: 'AL101', creditos: 4, cor: CORES[8], status: 'concluida', turmas: [] },
  { id: uid(), nome: 'Lógica Matemática', codigo: 'MA102', creditos: 4, cor: CORES[9], status: 'concluida', turmas: [] },
];
