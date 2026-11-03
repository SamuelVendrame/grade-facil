import type { CSSProperties } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Materia, Status } from '../types';
import { STATUS_LABEL, STATUS_ORDER } from '../types';
import { Icon } from './Icon';

interface Props {
  materias: Materia[];
  onMover: (id: string, status: Status) => void;
  onEditar: (m: Materia) => void;
  onNova: (status: Status) => void;
}

const DICA: Record<Status, string> = {
  pendente: 'O que ainda falta no curso',
  quero: 'Entra no montador de grade',
  cursando: 'Semestre atual',
  concluida: 'Já foi!',
};

export function Kanban({ materias, onMover, onEditar, onNova }: Props) {
  const [ativa, setAtiva] = useState<Materia | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const inicio = (e: DragStartEvent) => setAtiva(materias.find((m) => m.id === e.active.id) ?? null);
  const fim = (e: DragEndEvent) => {
    setAtiva(null);
    if (e.over) onMover(String(e.active.id), e.over.id as Status);
  };

  return (
    <DndContext sensors={sensors} onDragStart={inicio} onDragEnd={fim} onDragCancel={() => setAtiva(null)}>
      <div className="kanban">
        {STATUS_ORDER.map((st) => (
          <Coluna key={st} status={st} materias={materias.filter((m) => m.status === st)}
            onEditar={onEditar} onNova={() => onNova(st)} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{ativa ? <CardConteudo m={ativa} arrastando /> : null}</DragOverlay>
    </DndContext>
  );
}

function Coluna({ status, materias, onEditar, onNova }: {
  status: Status; materias: Materia[]; onEditar: (m: Materia) => void; onNova: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const creditos = materias.reduce((s, m) => s + m.creditos, 0);
  return (
    <section ref={setNodeRef} className={`coluna st-${status} ${isOver ? 'sobre' : ''}`}>
      <header className="coluna-topo">
        <div className="coluna-titulo">
          <span className="ponto" />
          <h3>{STATUS_LABEL[status]}</h3>
          <span className="pill">{materias.length}</span>
        </div>
        <span className="coluna-cr">{creditos} cr</span>
      </header>
      <p className="coluna-dica">{DICA[status]}</p>
      <div className="cards">
        {materias.map((m) => <Card key={m.id} m={m} onEditar={() => onEditar(m)} />)}
        {materias.length === 0 && <div className="dropzone">Solte uma matéria aqui</div>}
      </div>
      <button className="btn-add" onClick={onNova}><Icon name="plus" size={14} /> Adicionar matéria</button>
    </section>
  );
}

function Card({ m, onEditar }: { m: Materia; onEditar: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: m.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`card ${isDragging ? 'fantasma' : ''}`}
      onClick={onEditar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEditar();
        listeners?.onKeyDown?.(e);
      }}>
      <CardConteudo m={m} />
    </div>
  );
}

function CardConteudo({ m, arrastando }: { m: Materia; arrastando?: boolean }) {
  const semHorario = m.status === 'quero' && m.turmas.length === 0;
  return (
    <div className={`card-conteudo ${arrastando ? 'arrastando' : ''}`} style={{ '--cor': m.cor } as CSSProperties}>
      <div className="card-topo">
        {m.codigo && <span className="codigo">{m.codigo}</span>}
        <span className="grip" aria-hidden>⋮⋮</span>
      </div>
      <strong className="card-nome">{m.nome}</strong>
      <div className="card-meta">
        <span><Icon name="book" size={13} />{m.creditos} cr</span>
        <span><Icon name="users" size={13} />{m.turmas.length} {m.turmas.length === 1 ? 'turma' : 'turmas'}</span>
      </div>
      {semHorario && <div className="aviso"><Icon name="alert" size={13} /> Sem turmas: não entra na grade</div>}
    </div>
  );
}
