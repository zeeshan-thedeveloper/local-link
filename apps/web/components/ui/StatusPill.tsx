import type { HostStatus, ResourceStatus } from "@/lib/types";

export function StatusPill({ status, label }: { status: ResourceStatus | HostStatus; label?: string }) {
  const cls = status === "active" || status === "connected" ? "green"
    : status === "inactive" || status === "disconnected" ? "red"
    : "yellow";
  const text = label || (status === "active" ? "Active" : status === "inactive" ? "Inactive" : status === "idle" ? "Idle" : status === "connected" ? "Connected" : "Disconnected");
  return <span className={"pill " + cls}><span className="dot"/>{text}</span>;
}
