export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" fill="#94a3b8" font-family="sans-serif" font-size="28" text-anchor="middle">No image</text></svg>',
  )

export function Img({ src, alt, className }) {
  return (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = PLACEHOLDER
      }}
    />
  )
}

export const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
  </div>
)

export const ErrorBox = ({ children }) =>
  children ? (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>
  ) : null

export const Field = ({ label, ...props }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    />
  </label>
)

export const btn = {
  primary: 'rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50',
  ghost: 'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
  danger: 'rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50',
}

export const STATUS_STYLE = {
  placed: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-200 text-slate-600',
}

export const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLE[status] || 'bg-slate-100'}`}>{status}</span>
)

export const Pagination = ({ page, pages, onPage }) =>
  pages > 1 ? (
    <div className="mt-8 flex items-center justify-center gap-3 text-sm">
      <button className={btn.ghost} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-slate-600">Page {page} of {pages}</span>
      <button className={btn.ghost} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  ) : null
