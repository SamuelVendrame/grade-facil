import { describe, expect, it } from 'vitest';
import { gerarGrades, toMin, turmasChocam } from './scheduler';
import type { Materia, Turma } from './types';

const turma = (id: string, slots: [number, string, string][]): Turma => ({
  id, nome: id, slots: slots.map(([dia, inicio, fim]) => ({ dia, inicio, fim })),
});
const materia = (id: string, turmas: Turma[], creditos = 4): Materia => ({
  id, nome: id, creditos, cor: '#000', status: 'quero', turmas,
});

describe('toMin', () => {
  it('converte HH:MM em minutos', () => {
    expect(toMin('00:00')).toBe(0);
    expect(toMin('19:30')).toBe(1170);
  });
});

describe('turmasChocam', () => {
  it('detecta sobreposição no mesmo dia', () => {
    expect(turmasChocam(turma('a', [[0, '19:00', '20:40']]), turma('b', [[0, '20:00', '21:00']]))).toBe(true);
  });
  it('aula que termina quando a outra começa não choca', () => {
    expect(turmasChocam(turma('a', [[0, '19:00', '20:40']]), turma('b', [[0, '20:40', '22:00']]))).toBe(false);
  });
  it('mesmo horário em dias diferentes não choca', () => {
    expect(turmasChocam(turma('a', [[0, '19:00', '20:40']]), turma('b', [[1, '19:00', '20:40']]))).toBe(false);
  });
});

describe('gerarGrades', () => {
  it('gera todas as combinações sem conflito', () => {
    const a = materia('A', [turma('A1', [[0, '19:00', '21:00']]), turma('A2', [[1, '19:00', '21:00']])]);
    const b = materia('B', [turma('B1', [[0, '19:00', '21:00']]), turma('B2', [[2, '19:00', '21:00']])]);
    const opcoes = gerarGrades([a, b], {});
    // A1+B1 choca; sobram A1+B2, A2+B1, A2+B2
    expect(opcoes).toHaveLength(3);
    expect(opcoes.every((o) => o.fora.length === 0 && o.escolhas.length === 2)).toBe(true);
  });

  it('respeita turma fixada', () => {
    const a = materia('A', [turma('A1', [[0, '19:00', '21:00']]), turma('A2', [[1, '19:00', '21:00']])]);
    const b = materia('B', [turma('B1', [[2, '19:00', '21:00']])]);
    const opcoes = gerarGrades([a, b], { A: 'A2' });
    expect(opcoes).toHaveLength(1);
    expect(opcoes[0].escolhas.find((e) => e.materia.id === 'A')?.turma.id).toBe('A2');
  });

  it('quando não cabe tudo, encaixa o máximo e informa quem ficou de fora', () => {
    const a = materia('A', [turma('A1', [[0, '19:00', '21:00']])]);
    const b = materia('B', [turma('B1', [[0, '20:00', '22:00']])]);
    const c = materia('C', [turma('C1', [[1, '19:00', '21:00']])]);
    const opcoes = gerarGrades([a, b, c], {});
    expect(opcoes.length).toBeGreaterThan(0);
    for (const o of opcoes) {
      expect(o.escolhas).toHaveLength(2);
      expect(o.fora).toHaveLength(1);
      expect(o.escolhas.some((e) => e.materia.id === 'C')).toBe(true);
    }
  });

  it('ordena por menos dias e depois menos janelas', () => {
    const a = materia('A', [turma('A1', [[0, '19:00', '20:00']]), turma('A2', [[3, '19:00', '20:00']])]);
    const b = materia('B', [turma('B1', [[0, '21:00', '22:00']]), turma('B2', [[0, '20:00', '21:00']])]);
    const [melhor] = gerarGrades([a, b], {});
    expect(melhor.dias).toBe(1);
    expect(melhor.janelas).toBe(0);
    expect(melhor.escolhas.map((e) => e.turma.id).sort()).toEqual(['A1', 'B2']);
  });

  it('ignora intervalos curtos ao calcular janelas', () => {
    const a = materia('A', [turma('A1', [[0, '19:00', '20:40']])]);
    const b = materia('B', [turma('B1', [[0, '20:50', '22:30']])]);
    expect(gerarGrades([a, b], {})[0].janelas).toBe(0);
  });

  it('ignora matérias sem turmas ou com horário inválido', () => {
    const a = materia('A', []);
    const b = materia('B', [turma('B1', [[0, '22:00', '19:00']])]);
    expect(gerarGrades([a, b], {})).toEqual([]);
  });
});
