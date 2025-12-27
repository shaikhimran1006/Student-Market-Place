const Footer = () => (
  <footer className="bg-white border-t border-slate-200">
    <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-slate-600 flex flex-col md:flex-row justify-between">
      <span>© {new Date().getFullYear()} Verified Campus Marketplace</span>
      <span className="text-slate-500">Built for trusted campus trading.</span>
    </div>
  </footer>
);

export default Footer;
