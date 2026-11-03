import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Materia, Status } from '../types';
import { STATUS_LABEL, STATUS_ORDER } from '../types';

interface Props {
  materias: Materia[];
  onMover: (id: string, status: Status) => void;
  onEditar: (m: Materia) => void;
  onNova: (status: Status) => void;
}

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
          <Coluna
            key={st}
            status={st}
            materias={materias.filter((m) => m.status === st)}
            onEditar={onEditar}
            onNova={() => onNova(st)}
          />
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
    <section ref={setNodeRef} className={`coluna coluna-${status} ${isOver ? 'sobre' : ''}`}>
      <header>
        <h3>{STATUS_LABEL[status]}</h3>
        <span className="contagem">{materias.length} · {creditos} cr</span>
      </header>
      <div className="cards">
        {materias.map((m) => <Card key={m.id} m={m} onEditar={() => onEditar(m)} />)}
        {materias.length === 0 && <p className="vazio">Arraste matérias pra cá</p>}
      </div>
      <button className="btn-add" onClick={onNova}>+ Matéria</button>
    </section>
  );
}

function Card({ m, onEditar }: { m: Materia; onEditar: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: m.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`card ${isDragging ? 'fantasma' : ''}`}
      onClick={onEditar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEditar();
        listeners?.onKeyDown?.(e);
      }}
    >
      <CardConteudo m={m} />
    </div>
  );
}

function CardConteudo({ m, arrastando }: { m: Materia; arrastando?: boolean }) {
  const semHorario = m.status === 'quero' && m.turmas.length === 0;
  return (
    <div className={`card-conteudo ${arrastando ? 'arrastando' : ''}`} style={{ borderLeftColor: m.cor }}>
      <div className="card-topo">
        <strong>{m.nome}</strong>
        {m.codigo && <span className="codigo">{m.codigo}</span>}
      </div>
      <div className="card-meta">
        <span>{m.creditos} créditos</span>
        <span>{m.turmas.length} {m.turmas.length === 1 ? 'turma' : 'turmas'}</span>
      </div>
      {semHorario && <div className="aviso">Sem turmas: não entra na grade</div>}
    </div>
  );
}
