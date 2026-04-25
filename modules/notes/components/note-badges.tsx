import type { NoteType, RecordSourceType, Sensitivity } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  noteTypeLabel,
  recordSourceTypeLabel,
  sensitivityLabel,
  sensitivityVariant,
} from "@/modules/notes/labels";

export function NoteTypeBadge({ noteType }: { noteType: NoteType }) {
  return <Badge variant="secondary">{noteTypeLabel(noteType)}</Badge>;
}

export function NoteSourceBadge({
  sourceType,
}: {
  sourceType: RecordSourceType;
}) {
  return (
    <Badge variant={sourceType === "MANUAL" ? "secondary" : "outline"}>
      {recordSourceTypeLabel(sourceType)}
    </Badge>
  );
}

export function SensitivityBadge({
  sensitivity,
}: {
  sensitivity: Sensitivity;
}) {
  return (
    <Badge variant={sensitivityVariant(sensitivity)}>
      {sensitivityLabel(sensitivity)}
    </Badge>
  );
}
