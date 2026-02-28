import {
  Sprout,
  BadgeCheck,
  TrendingUp,
  Bug,
  Brain,
  Users,
  Plus,
  Zap,
  GraduationCap,
  MessageSquare,
  Video,
  Handshake,
  Lightbulb,
  CheckCircle2,
  Globe,
  MessageCircle,
  Youtube,
  Cpu,
  ShieldCheck,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';

import heroBg from './assets/hero-bg.png';
import mascote from './assets/mascote.png';
import logo from './assets/logo.png';
import duvidas from './assets/duvidas.png';
import mascote2 from './assets/mascote2.png';
import profissional from './assets/profissional.png';

const Header = () => (
  <header className="sticky top-0 z-50 w-full bg-background-light/80 backdrop-blur-md border-b border-primary/10">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
          Bananicultura <span className="text-primary">de Valor</span>
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-10">
        <a href="#solucoes" className="text-sm font-semibold hover:text-primary transition-colors">Soluções</a>
        <a href="#beneficios" className="text-sm font-semibold hover:text-primary transition-colors">Benefícios</a>
        <a href="#especialista" className="text-sm font-semibold hover:text-primary transition-colors">Especialista</a>
        <button className="bg-primary text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
          Entrar na Comunidade
        </button>
      </nav>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative min-h-[90vh] flex items-center pt-10 pb-20 px-6 overflow-hidden">
    <div className="absolute inset-0 z-0 rounded-b-[4rem] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      <img
        src={heroBg}
        alt="Banana plantation"
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>

    <div className="max-w-7xl mx-auto w-full relative z-20 grid lg:grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
      >
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <BadgeCheck className="text-accent-yellow w-4 h-4" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">Tecnologia no Campo</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
          Bananicultura de Valor: Sua Lavoura <span className="text-primary">Nunca Mais</span> Será a Mesma!
        </h1>
        <p className="text-xl text-slate-200 leading-relaxed max-w-xl">
          Combinando a sabedoria ancestral da terra com o poder revolucionário da Inteligência Artificial para transformar sua produtividade.
        </p>
        <button className="bg-accent-yellow text-slate-900 px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 group cursor-pointer">
          Quero Otimizar Minha Produção Agora!
          <TrendingUp className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex justify-center relative"
      >
        <div className="relative w-80 h-80 bg-primary/20 backdrop-blur-xl rounded-full border-4 border-primary/30 flex items-center justify-center">
          <div className="absolute -top-10 -right-10 bg-white p-6 rounded-2xl shadow-2xl border border-primary/20 max-w-[200px]">
            <p className="text-sm font-bold text-slate-800 leading-tight italic">
              "Pronto para colher resultados inteligentes, mestre?"
            </p>
          </div>
          <img
            src={mascote}
            alt="Intelligent monkey mascot"
            className="w-64 h-64 object-cover rounded-full border-4 border-white shadow-xl"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

const Challenges = () => (
  <section className="py-24 px-6 bg-background-light">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:w-1/2"
        >
          <img
            src={logo}
            alt="Logo"
            className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="md:w-1/2 space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Os Desafios do Campo <span className="text-primary italic">não precisam ser solitários.</span>
          </h2>
          <p className="text-lg text-slate-600">
            Sabemos que o dia a dia na bananicultura é repleto de incertezas que tiram o sono do produtor.
          </p>
          <div className="grid gap-6">
            <div className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-red-100 p-3 rounded-xl h-fit">
                <Bug className="text-red-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Pragas e Doenças</h3>
                <p className="text-slate-600">Folhas amareladas e manchas que podem destruir meses de trabalho em dias.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-3 rounded-xl h-fit">
                <Brain className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Dúvidas Técnicas</h3>
                <p className="text-slate-600">A incerteza de não saber o próximo passo ou como aplicar o manejo correto.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Solution = () => (
  <section id="solucoes" className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <h2 className="text-4xl md:text-6xl font-extrabold mb-16 tracking-tight">
        Bananicultura de Valor: <br />A União que <span className="text-primary">Faz a Força</span>
      </h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
        <motion.div
          whileHover={{ y: -10 }}
          className="flex-1 p-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl hover:bg-white/10 transition-colors"
        >
          <Users className="w-16 h-16 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-4">Experiência Humana</h3>
          <p className="text-slate-400">Décadas de conhecimento prático, troca de experiências entre produtores e o toque de quem vive o campo.</p>
        </motion.div>

        <div className="z-20 -mx-4">
          <div className="bg-primary p-6 rounded-full shadow-[0_0_50px_rgba(75,190,79,0.5)] border-4 border-slate-900">
            <Plus className="w-10 h-10 text-white" />
          </div>
        </div>

        <motion.div
          whileHover={{ y: -10 }}
          className="flex-1 p-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl hover:bg-white/10 transition-colors"
        >
          <Zap className="w-16 h-16 text-accent-yellow mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-4">Inteligência Artificial</h3>
          <p className="text-slate-400">Processamento de dados em tempo real, diagnósticos precisos e suporte especializado disponível 24 horas.</p>
        </motion.div>
      </div>
    </div>
  </section>
);

const Benefits = () => (
  <section id="beneficios" className="py-24 px-6 bg-background-light">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-16 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-extrabold mb-4">Tudo o que você precisa para <span className="text-primary">prosperar</span></h2>
          <p className="text-lg text-slate-600">Um ecossistema completo desenhado para transformar sua produção em um negócio de alto valor.</p>
        </div>
        <div className="hidden md:block">
          <img
            src={duvidas}
            alt="Dúvidas"
            className="w-32 h-32 rounded-full border-4 border-primary/20 shadow-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { icon: GraduationCap, title: "Treinamentos Exclusivos", desc: "Aulas práticas do plantio à colheita, focadas em aumentar seu lucro por hectare." },
          { icon: MessageSquare, title: "Dr. Bananeira (Agrônomo Virtual)", desc: "Suporte via WhatsApp com IA avançada. Diagnósticos e orientações na palma da mão, qualquer hora do dia.", badge: "IA 24H" },
          { icon: Video, title: "Lives Semanais", desc: "Encontros ao vivo para tirar dúvidas direto com especialistas e ficar por dentro das novidades." },
          { icon: Handshake, title: "Network no Telegram", desc: "Comunidade vibrante de produtores compartilhando oportunidades de mercado e soluções." },
          { icon: Lightbulb, title: "Inovação Constante", desc: "Acesso antecipado a novas variedades, tecnologias de manejo e insumos biológicos." },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02 }}
            className={`bg-white p-8 rounded-3xl border ${item.badge ? 'border-2 border-primary' : 'border-slate-200'} hover:shadow-xl transition-all group relative overflow-hidden`}
          >
            {item.badge && (
              <div className="absolute top-0 right-0 bg-primary px-4 py-1 text-white text-[10px] font-bold uppercase tracking-widest">
                {item.badge}
              </div>
            )}
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
              <item.icon className="text-primary w-7 h-7 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-4">{item.title}</h3>
            <p className="text-slate-600">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="planos" className="py-24 px-6 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
          Escolha o plano ideal e tenha o controle da sua roça na palma da mão!
        </h2>
        <p className="text-xl text-slate-600 mb-8">
          Chega de dúvidas na hora de manejar o seu bananal. Tenha acesso a todo o conteúdo, rede de contatos e ao Dr. Bananeira IA trabalhando para você 24 horas por dia.
        </p>
        <div className="inline-block bg-primary/10 px-6 py-4 rounded-2xl border border-primary/20">
          <p className="text-slate-900 font-bold leading-relaxed">
            Um agrônomo particular custaria milhares de reais. <br />
            <span className="text-primary">Com menos do que o valor de um cafezinho por dia (R$ 2,30)</span>, você protege a sua colheita, evita prejuízos e multiplica seus lucros.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Plano Mensal */}
        <motion.div
          whileHover={{ y: -10 }}
          className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl relative flex flex-col"
        >
          <div className="mb-8">
            <span className="bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
              Para começar
            </span>
            <h3 className="text-3xl font-black mb-2">Mensal</h3>
            <p className="text-slate-500">A flexibilidade que você precisa para conhecer e testar a plataforma.</p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-slate-400">Por apenas:</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">R$ 69,90</span>
              <span className="text-slate-500 font-bold">/mês</span>
            </div>
            <p className="text-xs text-primary font-bold mt-1">(Isso dá só R$ 2,30 por dia!)</p>
          </div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "Acesso imediato ao curso atualizado",
              "Aulas ao vivo e gravações exclusivas",
              "Comunidade de Networking",
              "Dr. Bananeira IA 24h",
              "Sem fidelidade: Cancele quando quiser"
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <CheckCircle2 className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-slate-600 font-medium">{item}</span>
              </li>
            ))}
          </ul>

          <button className="w-full py-4 bg-slate-100 text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors cursor-pointer">
            QUERO ASSINAR O PLANO MENSAL
          </button>
        </motion.div>

        {/* Plano Anual */}
        <motion.div
          whileHover={{ y: -10 }}
          className="bg-slate-900 p-10 rounded-[3rem] border-4 border-primary shadow-[0_20px_60px_rgba(75,190,79,0.3)] relative flex flex-col overflow-hidden"
        >
          <div className="absolute top-6 right-6">
            <div className="bg-accent-yellow text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              Mais Escolhido
            </div>
          </div>

          <div className="mb-8">
            <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
              Melhor Custo-Benefício
            </span>
            <h3 className="text-3xl font-black text-white mb-2">Anual</h3>
            <p className="text-slate-400">Para o produtor que pensa no longo prazo e quer a maior economia.</p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-slate-500 line-through">De R$ 838,80 por apenas:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">R$ 497,00</span>
              <span className="text-primary font-bold text-lg">à vista</span>
            </div>
            <p className="text-slate-400 font-bold mt-2">
              ou <span className="text-white">12x de R$ 49,70*</span>
            </p>
            <p className="text-sm text-accent-yellow font-bold mt-2">
              (Equivale a apenas R$ 41,41 por mês. <br />Você economiza R$ 341,80!)
            </p>
          </div>

          <ul className="space-y-4 mb-10 flex-grow">
            {[
              "TUDO do Plano Mensal",
              "1 ano inteiro de suporte garantido",
              "Economia: 2 meses DE GRAÇA",
              "Preço Travado: Sem reajustes",
              "Parcelamento em até 12x no cartão"
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <CheckCircle2 className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-slate-300 font-medium">{item}</span>
              </li>
            ))}
          </ul>

          <button className="w-full py-5 bg-primary text-white rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
            QUERO ASSINAR O ANUAL E ECONOMIZAR
          </button>
        </motion.div>
      </div>

      <div className="mt-20 text-center max-w-2xl mx-auto bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
        <h3 className="text-2xl font-bold mb-4">Ainda está na dúvida? Risco Zero para você!</h3>
        <p className="text-slate-600 leading-relaxed font-medium">
          Faça sua assinatura hoje. Se em até 7 dias você entrar na plataforma, usar o Dr. Bananeira IA, assistir às aulas e achar que isso não vai ajudar a sua roça a dar mais lucro, nós devolvemos 100% do seu dinheiro. Sem burocracia.
        </p>
      </div>
    </div>
  </section>
);

const Expert = () => (
  <section id="especialista" className="py-24 px-6 relative overflow-hidden">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
      <div className="lg:w-1/2 relative">
        <div className="absolute -bottom-6 -right-6 bg-accent-yellow p-4 rounded-2xl shadow-xl z-10 flex items-center gap-3">
          <img
            src={profissional}
            alt="Profissional"
            className="w-16 h-16 rounded-full object-cover border-2 border-white"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-800 opacity-60">Aprendiz de Luxo</p>
            <p className="font-bold text-slate-900 leading-none">Mestre Bananinha</p>
          </div>
        </div>
        <img
          src={mascote2}
          alt="Expert in field"
          className="w-full h-[600px] object-cover rounded-[3rem] shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="lg:w-1/2 space-y-8">
        <h4 className="text-primary font-bold uppercase tracking-widest text-sm">O Mentor</h4>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Especialista que vive a <span className="italic underline decoration-primary underline-offset-8">realidade do campo.</span>
        </h2>
        <p className="text-xl text-slate-600 leading-relaxed italic">
          "Minha missão é democratizar o acesso à tecnologia e ao conhecimento de elite para que cada produtor de banana no Brasil possa ter a colheita que sempre sonhou."
        </p>
        <div className="space-y-4">
          {[
            "+20 Anos de Experiência Prática",
            "Consultor das Maiores Fazendas do País",
            "Especialista em Manejo Biológico e IA"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="text-primary w-6 h-6" />
              <span className="font-bold text-lg">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-24 px-6">
    <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] overflow-hidden relative shadow-[0_30px_100px_rgba(75,190,79,0.3)]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop"
          alt="Happy farmers"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="relative z-20 p-12 md:p-24 text-center max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Sua Colheita Mais Farta Começa Aqui!
        </h2>
        <p className="text-xl text-white/90 font-medium">
          Não deixe para amanhã a evolução que sua lavoura precisa hoje. Junte-se a centenas de produtores visionários.
        </p>
        <button className="bg-accent-yellow text-slate-900 px-12 py-6 rounded-full font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto cursor-pointer">
          QUERO OTIMIZAR MINHA PRODUÇÃO AGORA!
        </button>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight uppercase">
              Bananicultura <span className="text-primary">de Valor</span>
            </span>
          </div>
          <p className="text-slate-400 max-w-sm">
            A maior comunidade de produtores de banana do Brasil, unindo inovação, IA e a sabedoria da terra para elevar seu patamar produtivo.
          </p>
          <div className="flex gap-4">
            {[Globe, MessageCircle, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-lg">Links Úteis</h5>
          <ul className="space-y-4 text-slate-400">
            {["Sobre Nós", "Dr. Bananeira", "Nossos Cursos", "Comunidade"].map((link) => (
              <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-lg">Legal</h5>
          <ul className="space-y-4 text-slate-400">
            {["Termos de Uso", "Privacidade", "Contato"].map((link) => (
              <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
        <p>© 2024 Bananicultura de Valor. Todos os direitos reservados.</p>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>Potencializado por IA para Produtores</span>
        </div>
      </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Challenges />
      <Solution />
      <Benefits />
      <Expert />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
