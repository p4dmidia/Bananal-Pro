import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define the translation dictionary structure
const resources = {
  pt: {
    translation: {
      "nav": {
        "dashboard": "Início",
        "feed": "Comunidade",
        "courses": "Treinamentos",
        "lives": "Lives ao Vivo",
        "library": "Biblioteca Técnica",
        "soil": "Análise de Solo",
        "financial": "Gestão Financeira",
        "inventory": "Estoque de Insumos",
        "weather": "Clima e Previsão",
        "calendar": "Calendário Agrícola",
        "diagnostic": "Diagnóstico Visual",
        "producer": "Área do Produtor",
        "admin": "Painel Admin",
        "logout": "Sair da Conta",
        "my_account": "Minha Conta",
        "profile": "Meu Perfil",
        "notifications": "Notificações"
      },
      "partners_page": {
        "title": "Clube de Vantagens",
        "subtitle": "Economize em milhares de estabelecimentos parceiros com descontos reais direto no seu CPF.",
        "badge": "Benefícios Exclusivos",
        "view_card": "Ver meu Cartão",
        "search_placeholder": "Buscar parceiros ou especialidades...",
        "advanced_filters": "Filtros Avançados",
        "all": "Todos",
        "discount_badge": "{{discount}}% Desconto",
        "no_partners": "Nenhum parceiro encontrado nesta categoria.",
        "generate_voucher": "Gerar Voucher",
        "address": "Localização",
        "contact": "Contato",
        "no_contact": "Contato indisponível"
      },
      "card_modal": {
        "title": "Seu Cartão Virtual de Benefícios",
        "subtitle": "Apresente este cartão nos estabelecimentos parceiros para obter descontos.",
        "member_since": "Membro desde",
        "status_active": "ATIVO",
        "status_inactive": "INATIVO",
        "card_type": "Membro VIP",
        "copied": "Código copiado com sucesso!",
        "voucher_title": "Seu Cupom de Desconto",
        "voucher_desc": "Use o código abaixo no caixa do estabelecimento parceiro no momento do pagamento.",
        "copy_code": "Copiar Código",
        "close": "Fechar",
        "generate_new": "Gerar Novo Voucher"
      },
      "notifications": {
        "title": "Notificações",
        "mark_read": "Lidas",
        "empty": "Nenhuma notificação por aqui.",
        "fetching": "Buscando...",
        "activate_prompt": "Ativar Notificações?",
        "activate_desc": "Receba alertas de novos vídeos e treinamentos!",
        "activate_btn": "Ativar",
        "later_btn": "Agora não"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "dashboard": "Home",
        "feed": "Community",
        "courses": "Courses",
        "lives": "Live Streams",
        "library": "Technical Library",
        "soil": "Soil Analysis",
        "financial": "Farm Finance",
        "inventory": "Insumos Stock",
        "weather": "Weather & Forecast",
        "calendar": "Agricultural Calendar",
        "diagnostic": "Visual Diagnostic",
        "producer": "Producer Area",
        "admin": "Admin Panel",
        "logout": "Sign Out",
        "my_account": "My Account",
        "profile": "My Profile",
        "notifications": "Notifications"
      },
      "partners_page": {
        "title": "Benefits Club",
        "subtitle": "Save at thousands of partner establishments with real discounts directly on your ID.",
        "badge": "Exclusive Benefits",
        "view_card": "View my Card",
        "search_placeholder": "Search partners or specialties...",
        "advanced_filters": "Advanced Filters",
        "all": "All",
        "discount_badge": "{{discount}}% Discount",
        "no_partners": "No partners found in this category.",
        "generate_voucher": "Get Voucher",
        "address": "Location",
        "contact": "Contact",
        "no_contact": "Contact unavailable"
      },
      "card_modal": {
        "title": "Your Virtual Benefits Card",
        "subtitle": "Present this card at partner establishments to get your discounts.",
        "member_since": "Member since",
        "status_active": "ACTIVE",
        "status_inactive": "INACTIVE",
        "card_type": "VIP Member",
        "copied": "Code copied successfully!",
        "voucher_title": "Your Discount Coupon",
        "voucher_desc": "Use the code below at the register of the partner establishment when paying.",
        "copy_code": "Copy Code",
        "close": "Close",
        "generate_new": "Get New Voucher"
      },
      "notifications": {
        "title": "Notifications",
        "mark_read": "Read",
        "empty": "No notifications here.",
        "fetching": "Fetching...",
        "activate_prompt": "Enable Notifications?",
        "activate_desc": "Receive alerts for new videos and courses!",
        "activate_btn": "Enable",
        "later_btn": "Not now"
      }
    }
  },
  es: {
    translation: {
      "nav": {
        "dashboard": "Inicio",
        "feed": "Comunidad",
        "courses": "Cursos",
        "lives": "Transmisiones",
        "library": "Biblioteca Técnica",
        "soil": "Análisis de Suelo",
        "financial": "Gestión Financiera",
        "inventory": "Inventario de Insumos",
        "weather": "Clima y Pronóstico",
        "calendar": "Calendario Agrícola",
        "diagnostic": "Diagnóstico Visual",
        "producer": "Área del Productor",
        "admin": "Panel Admin",
        "logout": "Cerrar Sesión",
        "my_account": "Mi Cuenta",
        "profile": "Mi Perfil",
        "notifications": "Notificaciones"
      },
      "partners_page": {
        "title": "Club de Beneficios",
        "subtitle": "Ahorre en miles de establecimientos asociados con descuentos reales directamente en su documento.",
        "badge": "Beneficios Exclusivos",
        "view_card": "Ver mi Tarjeta",
        "search_placeholder": "Buscar socios o especialidades...",
        "advanced_filters": "Filtros Avanzados",
        "all": "Todos",
        "discount_badge": "{{discount}}% Descuento",
        "no_partners": "No se encontraron socios en esta categoría.",
        "generate_voucher": "Obtener Cupón",
        "address": "Ubicación",
        "contact": "Contacto",
        "no_contact": "Contacto no disponible"
      },
      "card_modal": {
        "title": "Su Tarjeta de Beneficios Virtual",
        "subtitle": "Presente esta tarjeta en los establecimientos asociados para obtener descuentos.",
        "member_since": "Miembro desde",
        "status_active": "ACTIVO",
        "status_inactive": "INACTIVO",
        "card_type": "Miembro VIP",
        "copied": "¡Código copiado con éxito!",
        "voucher_title": "Su Cupón de Descuento",
        "voucher_desc": "Use el siguiente código en la caja del establecimiento asociado al momento de pagar.",
        "copy_code": "Copiar Código",
        "close": "Cerrar",
        "generate_new": "Obtener Nuevo Cupón"
      },
      "notifications": {
        "title": "Notificaciones",
        "mark_read": "Leídas",
        "empty": "No hay notificaciones aquí.",
        "fetching": "Buscando...",
        "activate_prompt": "¿Activar Notificaciones?",
        "activate_desc": "¡Recibe alertas de nuevos videos y cursos!",
        "activate_btn": "Activar",
        "later_btn": "Ahora no"
      }
    }
  }
};

const savedLang = localStorage.getItem('i18nextLng') || 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
