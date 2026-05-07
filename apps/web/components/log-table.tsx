import type { RequestLog } from "@locallink/shared";

export function LogTable({ logs }: { logs: RequestLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Path</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-neutral-100">
              <td className="px-4 py-3 font-medium">{log.method}</td>
              <td className="px-4 py-3">{log.path}</td>
              <td className="px-4 py-3">{log.statusCode}</td>
              <td className="px-4 py-3">{log.durationMs}ms</td>
              <td className="px-4 py-3 text-neutral-500">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

