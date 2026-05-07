import Link from "next/link";

const links = [
  ["/", "Overview"],
  ["/resources", "Resources"],
  ["/keys", "Keys"],
  ["/logs", "Logs"],
  ["/settings", "Settings"]
] as const;

export function Nav() {
  return (
    <aside className="flex w-full shrink-0 gap-2 border-b border-neutral-200 bg-white px-4 py-3 md:min-h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="mr-3 flex items-center font-semibold md:mb-6 md:mr-0">LocalLink</div>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
          {label}
        </Link>
      ))}
    </aside>
  );
}

