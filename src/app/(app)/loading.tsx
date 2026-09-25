export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="bg-surface-2 h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="bg-surface-2 h-28 rounded-2xl" />
        ))}
      </div>
      <div className="bg-surface-2 h-64 rounded-2xl" />
    </div>
  );
}
