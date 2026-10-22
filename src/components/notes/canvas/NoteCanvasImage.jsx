import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function NoteCanvasImage({ fileUri }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setUrl("");
    if (!fileUri) return () => { active = false; };

    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 })
      .then((result) => {
        if (active) setUrl(result.signed_url);
      })
      .catch(() => {});

    return () => { active = false; };
  }, [fileUri]);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <img src={url} alt="ノートに挿入した画像" className="h-full w-full object-cover" draggable={false} />
  );
}