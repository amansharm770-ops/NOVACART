import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black text-blue-700">404</p>
      <p className="mt-3 text-slate-600">This page does not exist.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-blue-700">← Back to home</Link>
    </div>
  )
}
