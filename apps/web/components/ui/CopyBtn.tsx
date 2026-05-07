"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function CopyBtn({ onCopy }: { onCopy?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
      onClick={() => {
        setDone(true);
        setTimeout(() => setDone(false), 1200);
        onCopy?.();
      }}
      title="Copy"
      type="button"
    >
      <Icon name={done ? "check" : "copy"} size={13} />
    </button>
  );
}
