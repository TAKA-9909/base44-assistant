import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";

const DEFAULT_PLACEHOLDER =
  "講義を聞いて気づいたこと、先生が強調していた点、次回までの課題などを自由に書けます。";

export default function NoteMemoEditor({ noteId, initialContent, placeholder = DEFAULT_PLACEHOLDER }) {
  const [content, setContent] = useState(initialContent || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = content !== (initialContent || "");

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.LectureNote.update(noteId, { content });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        className="min-h-[320px] resize-y rounded-2xl p-5 text-[15px] leading-8"
      />
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
    </div>
  );
}