import { forwardRef } from 'react';
import type { Escolha } from '../scheduler';
import { toMin } from '../scheduler';
import { DIAS } from '../types';

const PX_POR_HORA = 52;

interface Props {
  escolhas: Escolha[];
  titulo?: string;
}

/** Grade semanal visual. O ref é usado para exportar em PDF. */
export const Grade = forwardRef<HTMLDivElement, Props>(({ escolhas, titulo }, ref) => {
  const slots = escolhas.flatMap((e) => e.turma.slots.map((s) => ({ ...s, e })));
  const usaSabado = slots.some((s) => s.dia === 5);
  const dias = usaSabado ? DIAS : DIAS.slice(0, 5);

  const minH = slots.length ? Math.floor(Math.min(...slots.map((s) => toMin(s.inicio))) / 60) : 8;
  const maxH = slots.length ? Math.ceil(Math.max(...slots.map((s) => toMin(s.fim))) / 60) : 18;
  const horas = Array.from({ length: maxH - minH }, (_, i) => minH + i);
  const altura = horas.length * PX_POR_HORA;
  const creditos = escolhas.reduce((s, e) => s + e.materia.creditos, 0);

  return (
    <div className="grade-export" ref={ref}>
      {titulo && (
        <div className="grade-titulo">
          <h2>{titulo}</h2>
          <span>{escolhas.length} matérias · {creditos} créditos</span>
        </div>
      )}
      <div className="grade" style={{ gridTemplateColumns: `52px repeat(${dias.length}, minmax(0, 1fr))` }}>
        <div className="grade-canto" />
        {dias.map((d) => <div key={d} className="grade-dia">{d}</div>)}

        <div className="grade-horas" style={{ height: altura }}>
          {horas.map((h) => <span key={h} style={{ top: (h - minH) * PX_POR_HORA }}>{String(h).padStart(2, '0')}:00</span>)}
        </div>

        {dias.map((_, di) => (
          <div key={di} className="grade-coluna" style={{ height: altura, backgroundSize: `100% ${PX_POR_HORA}px` }}>
            {slots.filter((s) => s.dia === di).map((s, i) => {
              const top = ((toMin(s.inicio) - minH * 60) / 60) * PX_POR_HORA;
              const h = ((toMin(s.fim) - toMin(s.inicio)) / 60) * PX_POR_HORA;
              return (
                <div key={i} className="aula" style={{ top, height: h, background: s.e.materia.cor }}
                  title={`${s.e.materia.nome} (${s.e.turma.nome}) ${s.inicio}–${s.fim}`}>
                  <strong>{s.e.materia.nome}</strong>
                  <span>{s.inicio}–{s.fim}</span>
                  {h > 56 && <span className="aula-turma">{s.e.turma.nome}{s.e.turma.professor ? ` · ${s.e.turma.professor}` : ''}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="legenda">
        {escolhas.map((e) => (
          <li key={e.materia.id}>
            <i style={{ background: e.materia.cor }} />
            {e.materia.codigo ? `${e.materia.codigo} · ` : ''}{e.materia.nome} — {e.turma.nome}
            {e.turma.professor ? ` (${e.turma.professor})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
});
Grade.displayName = 'Grade';
