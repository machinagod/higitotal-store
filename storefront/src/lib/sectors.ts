import type { MetadataRoute } from "next"

import { BRANDS } from "@lib/brands"

/**
 * Sector landing pages (`/setores`, `/setores/[setor]`): what each kind of
 * customer needs, mapped onto real catalogue categories and brands.
 *
 * Copy rules: practical and factual. General hygiene good practice is fine;
 * never invent claims about Higitotal (clients, certifications, numbers,
 * delivery times). Category handles must exist in the live tree (they were
 * checked against the Store API when written, and the page drops any handle
 * the live list no longer has, so a renamed category never becomes a broken
 * link). Brand names must match `BRANDS` in @lib/brands — links to them are
 * resolved at render time, so they follow wherever brand pages live.
 */

/** Icon ids, mapped to Lucide components in @modules/sectors. */
export type SectorIcon =
  | "bath"
  | "bed"
  | "brush"
  | "building"
  | "chef-hat"
  | "coffee"
  | "cooking-pot"
  | "droplets"
  | "factory"
  | "flame"
  | "hand"
  | "heart-pulse"
  | "package"
  | "recycle"
  | "school"
  | "scroll"
  | "shield"
  | "shirt"
  | "sparkles"
  | "spray-can"
  | "utensils"
  | "washing-machine"

/** A link to a catalogue category, with a label written for the sector. */
export type SectorCategoryLink = { label: string; handle: string }

export type SectorNeed = {
  title: string
  text: string
  icon: SectorIcon
  categories: SectorCategoryLink[]
  /** Names from `BRANDS` (@lib/brands). */
  brands?: string[]
}

export type SectorAssistance = {
  title: string
  text: string
  categories: SectorCategoryLink[]
  brands?: string[]
}

export type Sector = {
  slug: string
  /** Short name (cards, footer, breadcrumb). */
  name: string
  /** Who it is for, in one line. */
  audience: string
  icon: SectorIcon
  h1: string
  /** Page title before the " · Higitotal" suffix (see `sectorPageTitle`). */
  title: string
  /** Meta description, ≤ 155 characters. */
  description: string
  /** One-sentence summary for the index cards. */
  summary: string
  intro: string[]
  needs: SectorNeed[]
  /** Good-practice reminders (general, not legal advice). */
  practices: string[]
  /** Categories the featured-product strip draws from, in order. */
  featuredCategories: string[]
  /** Equipment + technical assistance block (sectors that use equipment). */
  assistance?: SectorAssistance
}

export const SECTORS_PATH = "/setores"
export const SITE_SUFFIX = " · Higitotal"
export const MAX_TITLE = 60
export const MAX_DESCRIPTION = 155

/* Categories (handles from the live tree; labels written for the reader). */
const C = {
  cozinha: { label: "Cozinha (Diversey)", handle: "cozinha" },
  agroAlimentar: { label: "Agro-alimentar (Diversey)", handle: "agro-alimentar" },
  outrosDetergentes: { label: "Detergentes de uso geral", handle: "outros" },
  concentrados: { label: "Concentrados", handle: "concentrados" },
  taski: { label: "Limpeza profissional Taski", handle: "taski-7584831" },
  lavandariaDiversey: { label: "Lavandaria (Diversey)", handle: "lavandaria-7584815" },
  lavandaria: { label: "Detergentes para roupa", handle: "lavandaria" },
  amenities: { label: "Higiene pessoal e amenities", handle: "higiene-pessoal" },
  maos: { label: "Higiene das mãos (Diversey)", handle: "higiene-pessoal-7584814" },
  saboneteiras: { label: "Saboneteiras", handle: "saboneteiras-10085241" },
  toalheiros: { label: "Toalheiros", handle: "toalheiros-10084775" },
  dispensadores: { label: "Suportes e dispensadores", handle: "suportes-e-dispensadores" },
  guardanapos: { label: "Guardanapos", handle: "guardanapos-10084039" },
  toalhasMesa: { label: "Toalhas de mesa", handle: "toalhas-de-mesa-10084040" },
  papel: { label: "Papel", handle: "papel" },
  papelIndustrial: { label: "Papel industrial", handle: "papel-industrial-10084024" },
  toalhasMaos: { label: "Toalhas de mãos", handle: "toalhas-de-maos-10084010" },
  papelHigienico: { label: "Papel higiénico", handle: "papel-higienico-10084029" },
  lencos: { label: "Lenços", handle: "lencos-10084113" },
  marquesa: { label: "Rolos de marquesa", handle: "marquesa-10084034" },
  descartaveis: { label: "Descartáveis", handle: "descartaveis" },
  sacos: { label: "Sacos", handle: "sacos" },
  utensilios: { label: "Utensílios de limpeza", handle: "utensilios-limpeza" },
  maquinas: { label: "Máquinas de limpeza", handle: "maquinas-de-limpeza" },
  equipamento: { label: "Equipamento hoteleiro", handle: "equipamento-hoteleiro" },
  ambientadores: { label: "Ambientadores", handle: "ambientador-e-inseticidas" },
} satisfies Record<string, SectorCategoryLink>

export const SECTORS: Sector[] = [
  {
    slug: "restauracao",
    name: "Restauração",
    audience: "Restaurantes, cafés, pastelarias e cozinhas profissionais",
    icon: "chef-hat",
    h1: "Produtos de limpeza para restauração",
    title: "Produtos de limpeza para restauração",
    description:
      "Lavagem de loiça, desengordurantes, desinfeção de superfícies (HACCP), higiene das mãos, papel e descartáveis para restaurantes e cafés.",
    summary:
      "Loiça, desengordurantes, desinfeção de superfícies, higiene das mãos, papel e descartáveis.",
    intro: [
      "Numa cozinha profissional, a higiene faz parte do serviço: loiça bem lavada e seca, superfícies limpas e desinfetadas, gordura controlada em fornos, grelhadores e exaustão, e mãos lavadas a cada mudança de tarefa. Reunimos aqui, por necessidade, os produtos que um restaurante, café ou cozinha profissional usa no dia a dia.",
      "Num sistema de segurança alimentar baseado nos princípios HACCP, a limpeza e a desinfeção fazem parte dos pré-requisitos: convém definir o que se limpa, com que produto e diluição, com que frequência e por quem. Se precisar de ajuda a escolher os produtos e doseadores para cada posto, fale connosco.",
    ],
    needs: [
      {
        title: "Lavagem de loiça",
        text: "Detergentes e abrilhantadores para máquina de lavar loiça, detergentes para lavagem manual e produtos anticalcário para manter a máquina.",
        icon: "utensils",
        categories: [C.cozinha, C.outrosDetergentes],
        brands: ["Diversey", "Unilever"],
      },
      {
        title: "Desengordurantes, fornos e grelhadores",
        text: "Desengordurantes para bancadas, exaustão e pavimentos de cozinha, e produtos próprios para fornos, grelhadores e fritadeiras.",
        icon: "flame",
        categories: [C.cozinha, C.outrosDetergentes],
        brands: ["Diversey", "Unilever"],
      },
      {
        title: "Desinfeção de superfícies (HACCP)",
        text: "Detergentes desinfetantes e desinfetantes de base alcoólica para bancadas, equipamentos e utensílios, a aplicar conforme o plano de higienização e a ficha técnica de cada produto.",
        icon: "shield",
        categories: [C.cozinha, C.outrosDetergentes],
        brands: ["Diversey", "Unilever"],
      },
      {
        title: "Higiene das mãos",
        text: "Sabonetes líquidos e em espuma, gel hidroalcoólico, saboneteiras e toalheiros para os lavatórios da cozinha e das casas de banho.",
        icon: "hand",
        categories: [C.maos, C.saboneteiras, C.toalheiros],
        brands: ["SC Johnson (Deb)", "Diversey"],
      },
      {
        title: "Papel para a sala e para a cozinha",
        text: "Guardanapos, toalhas de mesa, bobines de papel industrial e toalhas de mãos.",
        icon: "scroll",
        categories: [C.guardanapos, C.toalhasMesa, C.papelIndustrial, C.toalhasMaos],
      },
      {
        title: "Descartáveis, take-away e sacos",
        text: "Embalagens de alumínio e kraft para take-away, copos, aventais e barretes descartáveis, sacos do lixo e sacos de vácuo.",
        icon: "package",
        categories: [C.descartaveis, C.sacos],
      },
    ],
    practices: [
      "Em regra, limpa-se primeiro e desinfeta-se depois: a sujidade e a gordura reduzem a eficácia do desinfetante.",
      "Respeite a diluição e o tempo de contacto indicados na ficha técnica de cada produto — mais produto não significa mais limpeza.",
      "Nunca misture produtos: lixívia com produtos ácidos ou amoniacais liberta gases tóxicos.",
    ],
    featuredCategories: [
      "cozinha",
      "equipamento-hoteleiro",
      "guardanapos-10084039",
      "descartaveis",
      "higiene-pessoal-7584814",
      "outros",
    ],
    assistance: {
      title: "Equipamento de cozinha, com assistência técnica",
      text: "Fornecemos equipamento hoteleiro — máquinas de lavar loiça, fornos, equipamento de preparação e de frio — de marcas como Fagor e Sammic, e asseguramos a instalação, a reparação e contratos de manutenção com assistência técnica própria.",
      categories: [C.equipamento],
      brands: ["Fagor", "Sammic"],
    },
  },
  {
    slug: "hotelaria",
    name: "Hotelaria",
    audience: "Hotéis, turismo rural e alojamento local",
    icon: "bed",
    h1: "Produtos de higiene para hotelaria",
    title: "Produtos de higiene para hotelaria",
    description:
      "Limpeza de quartos e casas de banho, lavandaria, pavimentos, amenities, papel e dispensadores para hotéis e alojamento local.",
    summary:
      "Quartos e casas de banho, lavandaria, pavimentos, amenities, papel e dispensadores.",
    intro: [
      "Num hotel ou num alojamento local, a limpeza é das primeiras coisas que o hóspede nota: quartos e casas de banho impecáveis, roupa de cama e toalhas bem lavadas, pavimentos cuidados e amenities à altura. Organizámos por área os produtos que a governação, a lavandaria e a manutenção usam todos os dias.",
      "Os produtos concentrados com sistemas de doseamento ajudam a usar a quantidade certa em cada tarefa e simplificam a formação da equipa — frascos identificados por número e cor, como os da gama Room Care da Taski, deixam claro que produto usar em cada superfície.",
    ],
    needs: [
      {
        title: "Quartos e casas de banho",
        text: "Gamas completas para a limpeza diária: sanitários e desincrustação, multiusos, vidros, mobiliário e ambientadores.",
        icon: "bath",
        categories: [C.taski, C.concentrados],
        brands: ["Taski", "Unilever"],
      },
      {
        title: "Lavandaria",
        text: "Detergentes, alcalinizantes, branqueadores e amaciadores para roupa de cama, toalhas e fardas, para doseamento automático ou manual.",
        icon: "washing-machine",
        categories: [C.lavandariaDiversey, C.lavandaria],
        brands: ["Diversey"],
      },
      {
        title: "Pavimentos",
        text: "Detergentes e manutenção de pavimentos (incluindo ceras e decapantes), mopas e baldes, e máquinas lavadoras, aspiradores e monodiscos.",
        icon: "sparkles",
        categories: [C.taski, C.utensilios, C.maquinas],
        brands: ["Taski", "Vileda", "Nilfisk", "Viper"],
      },
      {
        title: "Amenities e higiene pessoal",
        text: "Gel de banho, champô, sabonetes, toucas e chinelos descartáveis, em formato individual ou em dispensadores de parede.",
        icon: "droplets",
        categories: [C.amenities, C.maos],
        brands: ["Diversey"],
      },
      {
        title: "Papel e dispensadores",
        text: "Papel higiénico, toalhas de mãos e lenços faciais, com os respetivos dispensadores, saboneteiras e secadores de mãos.",
        icon: "scroll",
        categories: [C.papelHigienico, C.lencos, C.dispensadores],
      },
      {
        title: "Cozinha e pequeno-almoço",
        text: "Para a cozinha e o restaurante do hotel: lavagem de loiça, desengordurantes, desinfeção de superfícies e guardanapos.",
        icon: "coffee",
        categories: [C.cozinha, C.guardanapos],
        brands: ["Diversey"],
      },
    ],
    practices: [
      "Use panos e materiais de cores diferentes para as casas de banho e para as restantes áreas, para evitar contaminações cruzadas.",
      "Limpe de cima para baixo e das zonas mais limpas para as mais sujas.",
      "Na lavandaria, separe a roupa por tipo e grau de sujidade e respeite as temperaturas indicadas nas etiquetas.",
    ],
    featuredCategories: [
      "taski-7584831",
      "lavandaria-7584815",
      "higiene-pessoal",
      "papel-higienico-10084029",
      "maquinas-de-limpeza",
      "equipamento-hoteleiro",
    ],
    assistance: {
      title: "Lavandaria e cozinha, com assistência técnica",
      text: "Fornecemos máquinas de lavar e de secar roupa e equipamento de cozinha de marcas como Fagor e Sammic, e asseguramos a instalação, a reparação e contratos de manutenção com assistência técnica própria.",
      categories: [C.equipamento],
      brands: ["Fagor", "Sammic"],
    },
  },
  {
    slug: "lares-e-saude",
    name: "Lares e saúde",
    audience: "Lares, IPSS, centros de dia, clínicas e consultórios",
    icon: "heart-pulse",
    h1: "Produtos de limpeza para lares, IPSS e clínicas",
    title: "Produtos de limpeza para lares, IPSS e clínicas",
    description:
      "Desinfeção de superfícies, higiene das mãos, lavandaria, cozinha e descartáveis de proteção para lares, IPSS, centros de dia e clínicas.",
    summary:
      "Desinfeção de superfícies, higiene das mãos, lavandaria, cozinha e descartáveis de proteção.",
    intro: [
      "Em lares, centros de dia, unidades de cuidados continuados e clínicas, a limpeza e a desinfeção protegem pessoas mais vulneráveis. Os pontos críticos repetem-se: superfícies tocadas com frequência, casas de banho, roupa, refeições e as mãos de quem presta cuidados.",
      "Reunimos os produtos para cada uma destas áreas — desinfetantes de superfícies, higiene das mãos, lavandaria, cozinha e descartáveis de proteção. Se precisar de ajuda a escolher os produtos para cada área, fale connosco.",
    ],
    needs: [
      {
        title: "Desinfeção de superfícies",
        text: "Desinfetantes e detergentes desinfetantes para superfícies tocadas com frequência, casas de banho e equipamentos, incluindo toalhetes desinfetantes prontos a usar.",
        icon: "shield",
        categories: [C.taski, C.outrosDetergentes],
        brands: ["Taski", "Unilever"],
      },
      {
        title: "Higiene das mãos",
        text: "Sabonetes suaves, desinfetantes de mãos de base alcoólica e cremes de proteção, com dispensadores para quartos, corredores e zonas de cuidados.",
        icon: "hand",
        categories: [C.maos, C.saboneteiras],
        brands: ["SC Johnson (Deb)", "Diversey"],
      },
      {
        title: "Lavandaria",
        text: "Detergentes, branqueadores e produtos de desinfeção para roupa de cama, toalhas e fardas, para doseamento automático ou manual.",
        icon: "washing-machine",
        categories: [C.lavandariaDiversey, C.lavandaria],
        brands: ["Diversey"],
      },
      {
        title: "Descartáveis e proteção",
        text: "Luvas, aventais, batas, máscaras e cobre-sapatos descartáveis, babetes geriátricos e toalhitas para adulto.",
        icon: "shirt",
        categories: [C.descartaveis, C.utensilios],
      },
      {
        title: "Cozinha e refeitório",
        text: "Lavagem de loiça, desengordurantes e desinfeção de superfícies para a cozinha e o refeitório.",
        icon: "cooking-pot",
        categories: [C.cozinha],
        brands: ["Diversey"],
      },
      {
        title: "Papel, sacos e resíduos",
        text: "Papel higiénico, toalhas de mãos, rolos de marquesa e sacos do lixo de várias cores para separar resíduos.",
        icon: "recycle",
        categories: [C.papelHigienico, C.toalhasMaos, C.marquesa, C.sacos],
      },
    ],
    practices: [
      "Dê prioridade às superfícies tocadas com frequência: puxadores, corrimãos, interruptores, grades das camas e comandos.",
      "Higienize as mãos antes e depois de cada contacto com o residente e depois de retirar as luvas.",
      "Respeite o tempo de contacto indicado no rótulo do desinfetante: secar ou enxaguar antes do tempo reduz a eficácia.",
    ],
    featuredCategories: [
      "taski-7584831",
      "higiene-pessoal-7584814",
      "lavandaria-7584815",
      "descartaveis",
      "cozinha",
      "papel",
    ],
    assistance: {
      title: "Lavandaria e cozinha, com assistência técnica",
      text: "Fornecemos máquinas de lavar e de secar roupa e equipamento de cozinha de marcas como Fagor, e asseguramos a instalação, a reparação e contratos de manutenção com assistência técnica própria.",
      categories: [C.equipamento],
      brands: ["Fagor"],
    },
  },
  {
    slug: "escolas-e-autarquias",
    name: "Escolas e autarquias",
    audience: "Escolas, creches, autarquias, juntas de freguesia e serviços públicos",
    icon: "school",
    h1: "Material de limpeza para escolas e autarquias",
    title: "Material de limpeza para escolas e autarquias",
    description:
      "Detergentes, máquinas de limpeza, utensílios, papel, dispensadores e sacos para escolas, autarquias e serviços públicos. Peça orçamento.",
    summary:
      "Limpeza geral e pavimentos, máquinas, casas de banho, utensílios, cantinas e resíduos.",
    intro: [
      "Escolas, pavilhões, edifícios municipais e serviços de atendimento têm muita circulação de pessoas e grandes áreas para limpar. O essencial é ter produtos eficazes e fáceis de usar, equipamento que poupe tempo nos pavimentos e casas de banho sempre abastecidas.",
      "Encontra abaixo os produtos organizados por necessidade. Para fornecimentos regulares, envie-nos as quantidades e as especificações de que precisa e preparamos uma proposta.",
    ],
    needs: [
      {
        title: "Limpeza geral e pavimentos",
        text: "Detergentes multiusos e para pavimentos, lixívia e desinfetantes, em embalagens profissionais ou concentrados com doseamento.",
        icon: "spray-can",
        categories: [C.outrosDetergentes, C.concentrados, C.taski],
        brands: ["Taski", "Unilever"],
      },
      {
        title: "Máquinas de limpeza",
        text: "Lavadoras de pavimento, aspiradores de pó e de líquidos, varredoras e monodiscos para pavilhões, corredores e grandes áreas.",
        icon: "sparkles",
        categories: [C.maquinas],
        brands: ["Nilfisk", "Viper"],
      },
      {
        title: "Casas de banho",
        text: "Papel higiénico, toalhas de mãos, sabonete líquido e respetivos dispensadores, secadores de mãos e desodorizantes para urinóis.",
        icon: "bath",
        categories: [C.papelHigienico, C.dispensadores, C.ambientadores],
      },
      {
        title: "Utensílios",
        text: "Mopas, baldes e carros de limpeza, vassouras, panos e esfregões, luvas e sinalização de piso molhado.",
        icon: "brush",
        categories: [C.utensilios],
        brands: ["Vileda"],
      },
      {
        title: "Cantinas e refeitórios",
        text: "Detergentes para loiça manual e à máquina, desengordurantes e desinfeção de superfícies de cozinha.",
        icon: "cooking-pot",
        categories: [C.cozinha],
        brands: ["Diversey"],
      },
      {
        title: "Sacos e resíduos",
        text: "Sacos do lixo em várias cores e dimensões, para separar resíduos, e contentores e baldes com pedal.",
        icon: "recycle",
        categories: [C.sacos, C.utensilios],
      },
    ],
    practices: [
      "Defina uma rotina por zona — salas, corredores, casas de banho, refeitório — com frequência e responsável.",
      "Use panos e baldes de cores diferentes para as casas de banho e para os restantes espaços.",
      "Guarde os produtos de limpeza fechados, nas embalagens de origem e fora do alcance das crianças.",
    ],
    featuredCategories: [
      "maquinas-de-limpeza",
      "utensilios-limpeza",
      "outros",
      "suportes-e-dispensadores",
      "sacos",
      "papel-higienico-10084029",
    ],
    assistance: {
      title: "Máquinas de limpeza, com assistência técnica",
      text: "Fornecemos lavadoras, aspiradores e varredoras de marcas como Nilfisk e Viper, e asseguramos a reparação e a manutenção do equipamento com assistência técnica própria.",
      categories: [C.maquinas],
      brands: ["Nilfisk", "Viper"],
    },
  },
  {
    slug: "industria-alimentar",
    name: "Indústria alimentar",
    audience: "Indústria agroalimentar: carnes, lacticínios, padarias, bebidas e azeite",
    icon: "factory",
    h1: "Higiene na indústria alimentar e HACCP",
    title: "Higiene na indústria alimentar e HACCP",
    description:
      "Detergentes em espuma, desinfetantes, higiene das mãos, proteção descartável e utensílios para o plano de higienização HACCP da indústria alimentar.",
    summary:
      "Detergentes e espumas, desinfeção, higiene das mãos, proteção descartável e utensílios.",
    intro: [
      "Na indústria alimentar, a higienização é uma etapa do processo como as outras: tem de ser planeada, executada e verificada. Num sistema baseado nos princípios HACCP, o plano de limpeza e desinfeção é um dos pré-requisitos — define superfícies e equipamentos, produtos e concentrações, métodos, frequências e responsáveis.",
      "Reunimos produtos profissionais para esse plano: detergentes alcalinos e ácidos, aplicação em espuma, desinfetantes, higiene das mãos e proteção descartável, além de utensílios próprios para o setor alimentar.",
    ],
    needs: [
      {
        title: "Detergentes e espumas",
        text: "Detergentes alcalinos, clorados e ácidos, para aplicação em espuma ou manual, que removem gorduras, proteínas e incrustações calcárias da área de produção.",
        icon: "droplets",
        categories: [C.agroAlimentar],
        brands: ["Diversey"],
      },
      {
        title: "Desinfeção",
        text: "Desinfetantes para superfícies e equipamentos da área de produção e desinfetantes de base alcoólica, de secagem rápida, para utensílios e pequenas superfícies.",
        icon: "shield",
        categories: [C.agroAlimentar, C.cozinha],
        brands: ["Diversey"],
      },
      {
        title: "Higiene das mãos",
        text: "Sabonetes, sabonetes antimicrobianos e desinfetantes de mãos, com dispensadores para os pontos de entrada nas zonas de produção.",
        icon: "hand",
        categories: [C.maos, C.saboneteiras],
        brands: ["SC Johnson (Deb)", "Diversey"],
      },
      {
        title: "Proteção descartável",
        text: "Barretes, batas, aventais, cobre-mangas, cobre-sapatos, máscaras e kits de visita, além de luvas.",
        icon: "shirt",
        categories: [C.descartaveis, C.utensilios],
      },
      {
        title: "Utensílios para o setor alimentar",
        text: "Rodos e escovas próprios para o setor alimentar, baldes, panos e utensílios de cores diferentes para separar zonas.",
        icon: "brush",
        categories: [C.utensilios],
        brands: ["Vileda"],
      },
      {
        title: "Embalagem, papel e resíduos",
        text: "Sacos de vácuo, sacos cristal e sacos alimentares em bloco, papel industrial em bobine e sacos do lixo.",
        icon: "package",
        categories: [C.sacos, C.papelIndustrial],
      },
    ],
    practices: [
      "Siga a sequência: remoção da sujidade grosseira, pré-enxaguamento, detergente, enxaguamento, desinfeção e, se o produto o indicar, enxaguamento final.",
      "Onde a água é dura ou se formam incrustações, intercale lavagens ácidas com as alcalinas.",
      "Registe as operações de limpeza e verifique periodicamente a sua eficácia, como parte do sistema HACCP.",
    ],
    featuredCategories: [
      "agro-alimentar",
      "descartaveis",
      "higiene-pessoal-7584814",
      "utensilios-limpeza",
      "sacos",
    ],
    assistance: {
      title: "Equipamento de preparação e frio, com assistência técnica",
      text: "Fornecemos equipamento de preparação (cortadoras, trituradores, descascadoras), de frio e de cozinha de marcas como Sammic e Fagor, e asseguramos a instalação, a reparação e contratos de manutenção com assistência técnica própria.",
      categories: [C.equipamento],
      brands: ["Sammic", "Fagor"],
    },
  },
  {
    slug: "escritorios-e-condominios",
    name: "Escritórios e condomínios",
    audience: "Escritórios, condomínios, lojas e empresas de limpeza",
    icon: "building",
    h1: "Produtos de limpeza para escritórios e condomínios",
    title: "Produtos de limpeza para escritórios e condomínios",
    description:
      "Multiusos, limpa-vidros, pavimentos, papel, dispensadores, utensílios e sacos para escritórios, condomínios, lojas e empresas de limpeza.",
    summary:
      "Superfícies, pavimentos, casas de banho, utensílios, sacos e copa.",
    intro: [
      "Escritórios, lojas, escadas e garagens de condomínios pedem uma limpeza regular, rápida e sem complicações. Com poucos produtos bem escolhidos — um multiusos, um limpa-vidros, um produto para casas de banho e outro para pavimentos — cobre-se a maior parte das tarefas.",
      "Para empresas de limpeza e equipas de manutenção, os formatos concentrados e os utensílios profissionais ajudam a ganhar tempo e a controlar o consumo.",
    ],
    needs: [
      {
        title: "Superfícies e vidros",
        text: "Multiusos, limpa-vidros, produtos para madeiras e inox e ambientadores, em embalagens profissionais ou concentrados.",
        icon: "spray-can",
        categories: [C.outrosDetergentes, C.concentrados],
        brands: ["Unilever", "Taski"],
      },
      {
        title: "Pavimentos",
        text: "Detergentes para pavimentos, ceras e decapantes, mopas e, para áreas maiores, aspiradores e lavadoras.",
        icon: "sparkles",
        categories: [C.taski, C.maquinas],
        brands: ["Taski", "Nilfisk", "Viper"],
      },
      {
        title: "Casas de banho",
        text: "Papel higiénico, toalhas de mãos, sabonete líquido, dispensadores, blocos sanitários e desodorizantes.",
        icon: "bath",
        categories: [C.papelHigienico, C.dispensadores, C.ambientadores],
        brands: ["Unilever"],
      },
      {
        title: "Utensílios e carros de limpeza",
        text: "Mopas, baldes, carros de limpeza, panos de microfibra, vassouras e luvas.",
        icon: "brush",
        categories: [C.utensilios],
        brands: ["Vileda"],
      },
      {
        title: "Sacos e resíduos",
        text: "Sacos do lixo em rolo ou a granel, em várias cores e dimensões, para separar resíduos.",
        icon: "recycle",
        categories: [C.sacos],
      },
      {
        title: "Copa",
        text: "Detergente da loiça, pastilhas para máquina, copos e outros descartáveis para a copa.",
        icon: "coffee",
        categories: [C.outrosDetergentes, C.descartaveis],
        brands: ["Unilever"],
      },
    ],
    practices: [
      "Ventile os espaços durante e depois da limpeza.",
      "Use panos e baldes de cores diferentes para as casas de banho e para os restantes espaços.",
      "Doseie os produtos concentrados com doseador ou frasco graduado, em vez de “a olho”.",
    ],
    featuredCategories: [
      "outros",
      "utensilios-limpeza",
      "taski-7584831",
      "papel-higienico-10084029",
      "ambientador-e-inseticidas",
      "sacos",
    ],
  },
]

/** The sector for a URL slug, if any. */
export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug)
}

/** Root-relative path (without the country prefix) of a sector page. */
export function sectorHref(sector: Pick<Sector, "slug">): string {
  return `${SECTORS_PATH}/${sector.slug}`
}

/** Root-relative path of a category page. */
export function categoryHref(handle: string): string {
  return `/categories/${handle}`
}

/**
 * The full page title: the sector title plus the site suffix when that fits
 * in {@link MAX_TITLE} characters, else the sector title alone (render it as
 * an absolute title so the layout template does not add the suffix again).
 */
export function sectorPageTitle(sector: Pick<Sector, "title">): {
  title: string
  withSuffix: boolean
} {
  const full = `${sector.title}${SITE_SUFFIX}`
  return full.length <= MAX_TITLE
    ? { title: full, withSuffix: true }
    : { title: sector.title, withSuffix: false }
}

/** Every category handle the sector pages link to (needs, assistance, strip). */
export function sectorCategoryHandles(sectors: Sector[] = SECTORS): string[] {
  const handles = new Set<string>()
  for (const s of sectors) {
    for (const n of s.needs) n.categories.forEach((c) => handles.add(c.handle))
    s.assistance?.categories.forEach((c) => handles.add(c.handle))
    s.featuredCategories.forEach((h) => handles.add(h))
  }
  return Array.from(handles)
}

/** Every brand name the sector pages link to. */
export function sectorBrandNames(sectors: Sector[] = SECTORS): string[] {
  const names = new Set<string>()
  for (const s of sectors) {
    for (const n of s.needs) n.brands?.forEach((b) => names.add(b))
    s.assistance?.brands?.forEach((b) => names.add(b))
  }
  return Array.from(names)
}

/**
 * Keep only links to categories that still exist. `live` is the live handle
 * set; when it is unavailable (backend hiccup) the static config is trusted.
 */
export function liveCategoryLinks(
  links: SectorCategoryLink[],
  live: Set<string> | undefined
): SectorCategoryLink[] {
  return live ? links.filter((l) => live.has(l.handle)) : links
}

/** True when every brand name is a known brand in @lib/brands. */
export function isKnownBrand(name: string): boolean {
  return BRANDS.some((b) => b.name === name)
}

/**
 * Sitemap entries for the sector index and every sector page. `baseUrl` is
 * the absolute, country-prefixed site root (e.g. `https://www.x.pt/pt`).
 */
export function sectorSitemapEntries(
  baseUrl: string,
  lastModified: Date = new Date()
): MetadataRoute.Sitemap {
  const root = baseUrl.replace(/\/+$/, "")
  return [
    {
      url: `${root}${SECTORS_PATH}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...SECTORS.map((s) => ({
      url: `${root}${sectorHref(s)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
