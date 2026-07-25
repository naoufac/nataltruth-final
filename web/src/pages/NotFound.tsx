import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-prose py-24 text-center">
      <p className="text-6xl">✦</p>
      <h1 className="mt-6 text-3xl">Page not found</h1>
      <p className="mt-2 text-ink-soft">That page drifted off the chart.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
