import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Printer, Award, Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  instructorName?: string;
}

export default function CertificateModal({ 
  isOpen, 
  onClose, 
  studentName, 
  courseTitle, 
  completionDate,
  instructorName = "Banana PRO"
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = certificateRef.current;
      
      // Pequeno delay para garantir que tudo renderizou
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [842, 595]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 842, 595);
      pdf.save(`Certificado-${studentName.replace(/\s+/g, '-')}.pdf`);
      
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert("Houve um problema ao gerar seu certificado. Por favor, tente usar a opção 'Imprimir' enquanto ajustamos o download direto.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;
    
    const windowPrint = window.open('', '', 'width=900,height=650');
    if (windowPrint) {
      windowPrint.document.write('<html><head><title>Certificado - ' + courseTitle + '</title>');
      windowPrint.document.write('<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">');
      // Import Tailwind styles if needed or use inline CSS
      windowPrint.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      windowPrint.document.write('<style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }</style>');
      windowPrint.document.write('</head><body>');
      windowPrint.document.write(printContent.innerHTML);
      windowPrint.document.write('</body></html>');
      windowPrint.document.close();
      setTimeout(() => {
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
      }, 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-8 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl my-auto"
          >
            {/* Header / Actions */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Award className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Seu Certificado</h3>
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Conclusão de Curso</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                >
                  {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isDownloading ? 'Gerando...' : 'Baixar PDF'}</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-red-500 text-white rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Certificate Preview Container */}
            <div className="p-8 md:p-12 bg-zinc-950 overflow-x-auto flex justify-center">
              <div 
                ref={certificateRef}
                id="certificate-content"
                className="relative w-[842px] h-[595px] bg-white shadow-2xl flex-shrink-0"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: "#1e293b"
                }}
              >
                {/* Background Decor */}
                <div className="absolute inset-0 border-[20px] border-white" style={{ backgroundColor: '#ffffff' }} />
                <div className="absolute inset-4 border" style={{ borderColor: 'rgba(30, 41, 59, 0.1)' }} />
                
                {/* Geometric Corners (No clip-path for better html2canvas support) */}
                {/* Top Left Triangle */}
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[192px] border-r-[192px] border-r-transparent overflow-hidden" style={{ borderTopColor: '#0a2342' }}>
                   <div className="absolute -top-[184px] left-8 w-[300px] h-1 rotate-[45deg] origin-left" style={{ backgroundColor: '#c5a059' }} />
                   <div className="absolute -top-[176px] left-12 w-[300px] h-1 rotate-[45deg] origin-left" style={{ backgroundColor: '#c5a059' }} />
                </div>
                
                {/* Bottom Right Triangle */}
                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[192px] border-l-[192px] border-l-transparent overflow-hidden" style={{ borderBottomColor: '#0a2342' }}>
                   <div className="absolute bottom-[16px] -left-[140px] w-[300px] h-1 rotate-[45deg] origin-left" style={{ backgroundColor: '#c5a059' }} />
                   <div className="absolute bottom-[24px] -left-[130px] w-[300px] h-1 rotate-[45deg] origin-left" style={{ backgroundColor: '#c5a059' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center px-24 py-16 text-center">
                  <h1 className="text-6xl font-bold tracking-[0.2em] mb-12" style={{ color: '#0a2342' }}>CERTIFICADO</h1>
                  
                  <p className="text-sm font-bold uppercase tracking-[0.3em] mb-10" style={{ color: '#71717a' }}>
                    Este certificado comprova que
                  </p>
                  
                  <h2 className="text-6xl mb-12" style={{ fontFamily: "'Great Vibes', cursive", color: "#1e293b" }}>
                    {studentName}
                  </h2>
                  
                  <p className="text-lg leading-relaxed mb-16 max-w-2xl mx-auto" style={{ color: '#1e293b' }}>
                    concluiu com êxito o curso <span className="font-bold uppercase">{courseTitle}</span> ministrado por <span className="font-bold">{instructorName}</span> em <span className="font-bold">{completionDate}</span> e demonstrou dedicação e empenho exemplares. Parabéns e boa sorte no futuro.
                  </p>
                  
                  <div className="mt-auto w-full max-w-xs border-t-2 pt-4" style={{ borderTopColor: '#1e293b' }}>
                    <p className="text-sm font-bold" style={{ color: '#0a2342' }}>{instructorName}</p>
                    <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#71717a' }}>Diretoria Responsável</p>
                  </div>
                </div>

                {/* Subtle Texture/Watermark */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
                   <span className="text-[400px]">🎓</span>
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="p-6 bg-zinc-900/50 flex items-center justify-center gap-4 border-t border-white/5">
              <p className="text-zinc-500 text-xs">Você pode salvar este certificado como PDF ou imprimi-lo diretamente.</p>
              <div className="flex items-center gap-2 text-emerald-500">
                <Share2 size={14} />
                <span className="text-xs font-bold">Compartilhar Conquista</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
