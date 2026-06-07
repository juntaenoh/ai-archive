export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
        <p className="font-mono text-xs text-zinc-600">
          built with AI, documented with intent
        </p>
        <p className="font-mono text-xs text-zinc-600">
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
