import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import CanvasEditor from "@/components/notes/canvas/CanvasEditor";
import { serializeCanvas } from "@/lib/notebookCanvas";

export default function CanvasNotePanel({ noteId, initialBlocks }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [savedBlocks, setSavedBlocks] = useState(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(blocks) !== JSON.stringify(savedBlocks);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.LectureNote.update(noteId, { content: serializeCanvas(blocks) });
    setSavedBlocks(blocks);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-border/70 bg-card shadow-sm">
        <CanvasEditor blocks={blocks} onChange={setBlocks} />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !dirty} className="rounded-full px-6">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存する
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            保存しました
          </span>
        )}
      </div>
      <p className="text-center text-xs leading-6 text-muted-foreground">
        罫線の上をタップすると書き込めます。文章を押すとマーカーが引かれ、ダブルタップで書き直せます。
      </p>
    </div>
  );
}