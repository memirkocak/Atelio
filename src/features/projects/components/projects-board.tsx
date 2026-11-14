"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { updateProjectStatusAction } from "../actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "../constants";
import { clientLabel, type ProjectListItem } from "../types";

import { ProgressBar, ProjectDueDate } from "./project-display";

type Move = { id: string; status: ProjectStatus };

/** Tri dans une colonne : échéance la plus proche d'abord, sans échéance à la fin. */
function byDueDate(a: ProjectListItem, b: ProjectListItem) {
  if (a.due_date === b.due_date) return a.name.localeCompare(b.name, "fr");
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return a.due_date < b.due_date ? -1 : 1;
}

/**
 * Kanban des projets : glisser une carte vers une colonne change son statut.
 * Mise à jour optimiste (useOptimistic) ; en cas d'échec serveur, la carte revient
 * automatiquement à sa place à la fin de la transition.
 */
export function ProjectsBoard({ projects, slug }: { projects: ProjectListItem[]; slug: string }) {
  const [, startTransition] = useTransition();
  const [items, applyMove] = useOptimistic(projects, (state: ProjectListItem[], move: Move) =>
    state.map((p) => (p.id === move.id ? { ...p, status: move.status } : p)),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byId = new Map(items.map((p) => [p.id, p]));
  const nameOf = (id: string | number) => byId.get(String(id))?.name ?? "le projet";
  const columnOf = (id: string | number | undefined) =>
    id && PROJECT_STATUSES.includes(id as ProjectStatus) ? PROJECT_STATUS_LABELS[id as ProjectStatus] : null;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `« ${nameOf(active.id)} » saisi.`,
    onDragOver: ({ active, over }) =>
      over ? `« ${nameOf(active.id)} » au-dessus de la colonne ${columnOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `« ${nameOf(active.id)} » déposé dans ${columnOf(over.id)}.` : `« ${nameOf(active.id)} » relâché.`,
    onDragCancel: ({ active }) => `Déplacement de « ${nameOf(active.id)} » annulé.`,
  };

  function move(id: string, status: ProjectStatus) {
    const project = byId.get(id);
    if (!project || project.status === status) return;
    startTransition(async () => {
      applyMove({ id, status });
      const result = await updateProjectStatusAction(slug, id, status);
      if (!result.ok) toast.error(result.error);
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (event.over) move(String(event.active.id), event.over.id as ProjectStatus);
  }

  const active = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Pour déplacer ce projet, appuyez sur Espace ou Entrée, utilisez les flèches pour changer de colonne, puis Espace ou Entrée pour déposer. Échap annule.",
        },
      }}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {PROJECT_STATUSES.map((status) => {
          const columnItems = items.filter((p) => p.status === status).sort(byDueDate);
          return (
            <BoardColumn key={status} status={status} count={columnItems.length}>
              {columnItems.map((p) => (
                <BoardCard key={p.id} project={p} slug={slug} onMove={move} hidden={p.id === activeId} />
              ))}
            </BoardColumn>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <CardBody project={active} slug={slug} className="rotate-1 shadow-lg" /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({ status, count, children }: { status: ProjectStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`Colonne ${PROJECT_STATUS_LABELS[status]}`}
      data-status={status}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col rounded-lg border bg-muted/40 transition-colors md:w-auto md:min-w-0 md:flex-1",
        isOver && "border-primary/60 bg-accent",
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold">{PROJECT_STATUS_LABELS[status]}</h2>
        <span className="rounded-md bg-background px-1.5 text-xs text-muted-foreground tabular-nums">{count}</span>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
        {children}
        {count === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            Déposez un projet ici
          </p>
        ) : null}
      </div>
    </section>
  );
}

function BoardCard({
  project,
  slug,
  onMove,
  hidden,
}: {
  project: ProjectListItem;
  slug: string;
  onMove: (id: string, status: ProjectStatus) => void;
  hidden: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef } = useDraggable({ id: project.id });
  // Souris / toucher : toute la carte ; clavier : uniquement la poignée (évite qu'Entrée sur le lien démarre un déplacement).
  const { onKeyDown, ...pointerListeners } = listeners ?? {};
  const handleKeyDown = onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined;

  return (
    <div ref={setNodeRef} {...pointerListeners} data-project-card={project.name} className={cn(hidden && "opacity-40")}>
      <CardBody
        project={project}
        slug={slug}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            onKeyDown={handleKeyDown}
            aria-label={`Déplacer « ${project.name} »`}
            className="-ml-1 flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
        menu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                aria-label={`Changer le statut de « ${project.name} »`}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={project.status}
                onValueChange={(v) => onMove(project.id, v as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  );
}

function CardBody({
  project,
  slug,
  handle,
  menu,
  className,
}: {
  project: ProjectListItem;
  slug: string;
  handle?: React.ReactNode;
  menu?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("space-y-2 rounded-md border bg-background p-3 shadow-xs", className)}>
      <div className="flex items-start gap-1.5">
        {handle}
        <Link
          href={`/w/${slug}/projets/${project.id}`}
          className="min-w-0 flex-1 font-medium leading-snug outline-none hover:underline focus-visible:underline"
          draggable={false}
        >
          {project.name}
        </Link>
        {menu}
      </div>
      <p className="truncate text-xs text-muted-foreground">{clientLabel(project.client) ?? "Sans client"}</p>
      <div className="flex items-center justify-between gap-2 text-xs">
        <ProjectDueDate project={project} className="text-xs" />
      </div>
      <ProgressBar value={project.progress} />
    </article>
  );
}
