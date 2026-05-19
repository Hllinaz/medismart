export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
