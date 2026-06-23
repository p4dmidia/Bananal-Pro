import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import logoImg from "../../assets/logo.png";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    if (targetId.startsWith("#")) {
      const el = document.querySelector(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        if (window.location.pathname !== "/") {
          e.preventDefault();
          navigate("/" + targetId);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans overflow-x-hidden selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* TopNavBar */}
      <nav
        id="main-nav"
        className="fixed top-0 w-full z-50 transition-all duration-300 h-20 sm:h-24 flex items-center bg-white shadow-sm border-b border-zinc-200/80"
      >
        <div className="flex justify-between items-center w-full px-6 md:px-10 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <img
              alt="Bananal PRO Logo"
              className="h-[44px] sm:h-[60px] w-auto object-contain"
              src={logoImg}
            />
          </Link>

          {/* Desktop Links (Dark text for white header) */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-secondary border-b-2 border-secondary pb-1 text-xs font-semibold tracking-wider uppercase font-inter"
            >
              Home
            </Link>
            <Link
              to="/ferramentas"
              className="text-zinc-600 hover:text-primary transition-colors text-xs font-semibold tracking-wider uppercase font-inter"
            >
              Ferramentas
            </Link>
            <a
              href="#comunidade"
              onClick={(e) => handleNavClick(e, "#comunidade")}
              className="text-zinc-600 hover:text-primary transition-colors text-xs font-semibold tracking-wider uppercase font-inter"
            >
              Comunidade
            </a>
            <a
              href="#planos"
              onClick={(e) => handleNavClick(e, "#planos")}
              className="text-zinc-600 hover:text-primary transition-colors text-xs font-semibold tracking-wider uppercase font-inter"
            >
              Planos
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "#faq")}
              className="text-zinc-600 hover:text-primary transition-colors text-xs font-semibold tracking-wider uppercase font-inter"
            >
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/auth/login"
              className="hidden md:block text-zinc-600 hover:text-primary transition-colors text-xs font-semibold tracking-wider uppercase font-inter"
            >
              Login
            </Link>
            <Link
              to="/auth/register"
              className="hidden sm:block bg-primary text-on-primary px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase font-inter active:scale-95 duration-200 transition-all hover:bg-secondary text-center"
            >
              Entrar para o Clube
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-zinc-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col gap-6"
          >
            <div className="flex flex-col gap-6 py-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-bold font-headline text-primary"
              >
                Home
              </Link>
              <Link
                to="/ferramentas"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-bold font-headline text-zinc-800"
              >
                Ferramentas
              </Link>
              <a
                href="#comunidade"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleNavClick(e, "#comunidade");
                }}
                className="text-xl font-bold font-headline text-zinc-800"
              >
                Comunidade
              </a>
              <a
                href="#planos"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleNavClick(e, "#planos");
                }}
                className="text-xl font-bold font-headline text-zinc-800"
              >
                Planos
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleNavClick(e, "#faq");
                }}
                className="text-xl font-bold font-headline text-zinc-800"
              >
                FAQ
              </a>
              <div className="h-px bg-zinc-200 my-2" />
              <Link
                to="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-semibold text-zinc-600"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setIsMenuOpen(false)}
                className="bg-primary text-on-primary py-4 rounded-xl text-center font-bold text-sm tracking-wider uppercase font-inter"
              >
                Entrar para o Clube
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 sm:pt-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="reveal active bg-surface-container-lowest w-full py-12 border-t border-outline-variant/30 mt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-10 max-w-7xl mx-auto">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <img
                alt="Logo"
                className="h-8 w-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6_pk1kW-eDecPhxDsRIHPt2LlxBMrjgw_9cp0rKZ0MgLAlK-EkH6qENcBG78Iuj2le5mfPRFwvmC8o9o7p-DcsVcrdalMm1sFyXxIYEbEqQt2mGVlRI-N8lONF1N2MveE4rUiLr2XHjyvOgxZK2i3Ow1vpERo_ivZAcbVzjMMpyIu9IVaHD6JzODGsxWEKSjAKBRj-Un5KaLzdOWDxXV6srT8Q-BQLAgtzu6J-Ou5mn2KkPhBm03MLqw-IxYWJQs6F58XfJ5z7A"
              />
              <span className="text-lg font-headline font-bold text-primary">
                Bananal PRO
              </span>
            </div>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
              Tecnologia de elite para o campo. Do plantio à comercialização, sua fazenda em alta performance.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-primary uppercase font-inter">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant font-sans">
              <li>
                <Link to="/ferramentas" className="hover:text-secondary hover:underline transition-all">
                  Ferramentas
                </Link>
              </li>
              <li>
                <a href="#planos" onClick={(e) => handleNavClick(e, "#planos")} className="hover:text-secondary hover:underline transition-all">
                  Preços
                </a>
              </li>
              <li>
                <a href="#comunidade" onClick={(e) => handleNavClick(e, "#comunidade")} className="hover:text-secondary hover:underline transition-all">
                  Comunidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Segurança
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-primary uppercase font-inter">
              Suporte
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant font-sans">
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <Link to="/contato" className="hover:text-secondary hover:underline transition-all">
                  Contato
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Documentação
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Status
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-primary uppercase font-inter">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant font-sans">
              <li>
                <Link to="/politica-de-privacidade" className="hover:text-secondary hover:underline transition-all">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="hover:text-secondary hover:underline transition-all">
                  Termos
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Suporte
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary hover:underline transition-all">
                  Vagas
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-xs text-on-surface-variant font-sans">
            © 2026 Bananal PRO. Tecnologia de elite para o campo.
          </p>
        </div>
      </footer>
    </div>
  );
}
