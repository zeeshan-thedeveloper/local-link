import type { Resource } from "@locallink/shared";
import Link from "next/link";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link href={`/resources/${resource.id}`} className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-mint">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{resource.name}</h2>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs">{resource.type}</span>
      </div>
      <p className="mt-2 text-sm text-neutral-600">{resource.hostId}</p>
      <p className={resource.active ? "mt-4 text-sm text-mint" : "mt-4 text-sm text-coral"}>
        {resource.active ? "Active" : "Inactive"}
      </p>
    </Link>
  );
}

