// Old PrestaShop (www.higitotal.pt/base/) ids → new pages. Generated from the 2026-11 crawl of
// the old site (175 products: 70 active, 104 inactive, 1 deleted) matched against the live catalogue
// by reference / EAN / model; checked by hand. Each entry: old name [old ref] → new product [SKU].
// Priority: same product → successor / same model family → the closest category (only when the
// new catalogue has nothing equivalent, or the equivalent is still a draft — publish it and point
// the entry at it).
export const LEGACY_PRODUCTS: Record<number, string> = {
  // Drip Quat Ultraconcentrado (2L) [DX1001] → Drip Multi (2L) [DX1004] — Drip Quat (DX1001) is not in the new catalogue at all; same Drip 2L ultraconcentrate range (medium)
  1: "/products/dx1004-159978161",
  // Drip Floor Ultraconcentrado (2L) [DX1002] → Drip Floor (2L) [DX1002]
  2: "/products/dx1002-159978153",
  // Drip Energic Ultraconcentrado (2L) [DX1003] → Drip Multi (2L) [DX1004] — Drip Energic (DX1003) is only a draft in the new catalogue; same Drip 2L range (medium)
  3: "/products/dx1004-159978161",
  // Drip Multi Ultraconcentrado (2L) [DX1004] → Drip Multi (2L) [DX1004]
  4: "/products/dx1004-159978161",
  // Drip Toilet Ultraconcentrado (2L) [DX1005] → Drip Toilet (2L) [DX1005]
  5: "/products/dx1005-159978163",
  // Sacos do Lixo Extra Forte Prof Cinzento 130L - 90x105cm (20 Sacos) [V138751] → Sacos Lixo Extra Fortes Profissional Azul (130L) [V138752] — grey colour not sold any more; same Vileda Extra Forte 130L bag, blue (medium)
  6: "/products/v138752-159983033",
  // Sacos do Lixo Extra Forte Prof Azul 130L - 90x105cm (20 Sacos) [V138752] → Sacos Lixo Extra Fortes Profissional Azul (130L) [V138752]
  7: "/products/v138752-159983033",
  // Sacos do Lixo Extra Forte Prof Verde 130L - 90x105cm (20 Sacos) [V138753] → Sacos Lixo Extra Fortes Profissional Verde (130L) [V138753]
  8: "/products/v138753-159983036",
  // Sacos do Lixo Extra Forte Prof Amarelo 130L - 90x105cm (20 Sacos) [V138754] → Sacos Lixo Extra Fortes Profissional Amarelo (130L) [V138754]
  9: "/products/v138754-159983041",
  // Carro 25L com Prensa Vertical [V127937] → Carro Kit Single com Prensa Vertical [V149091] — Vileda successor: Kit Single 25L with vertical press (medium)
  10: "/products/v149091-159983108",
  // Carro 2x25L com Prensa Vertical [V127938] → Carro Kit Doble com Prensa Vertical [V149092] — Vileda successor: Kit Doble 2x25L with vertical press (medium)
  11: "/products/v149092-159983111",
  // Carro Completo UltraSpeed 2x25L [V129454] → Carro Ultraspeed r-Duo [V147206] — Vileda UltraSpeed double-bucket trolley (r-Duo) (medium)
  12: "/products/v147206-159983096",
  // Carro Completo UltraSpeed 25L [V129456] → Carro Kit Single Trio Ultraspeed Pro [V147181] — Vileda UltraSpeed single-bucket trolley (Kit Single Trio Pro) (medium)
  13: "/products/v147181-159983091",
  // Carro Origo 100 FX [V121564] → Carro Origo 100 Fx [V121564]
  14: "/products/v121564-159982874",
  // Carro Origo 300 FX [V121576] → Carro Origo 300 Fx 126x58x100 [V121576]
  15: "/products/v121576-159982879",
  // Recarga Mopa Active8 14x38cm (Unidade) [V100185] → Mopa Active8 Ag [V161577] — Active8 refill 14x38 gone; same Vileda Active8 mop range (medium)
  16: "/products/v161577-159983161",
  // Contentor Atlas 100L 59x44x90cm [137696] → category (Vileda Atlas container not in the new catalogue)
  17: "/categories/utensilios-limpeza",
  // maquina de lavar roupa electrica fagor 18kg la 18 tpe (inactive) → Máquina de Lavar a Roupa LA-14 TP 2 E Fagor [M-19058420] — LA-18 TP2 E is only a draft (M-19058399); nearest Fagor LA-TP washer, LA-14 TP 2 E (medium)
  18: "/products/m-19058420-159979804",
  // Máquina de Secar a Roupa Eléctrica Fagor (16Kg) SR-16 E [M-19034464] → Máquina de Secar Roupa SR-16 ME Fagor [M-19071868] — same Fagor SR-16 dryer, current ME version
  19: "/products/m-19071868-159979806",
  // Fritadeira Mergulhante a Gás Fagor FG9-05 2C [M-19006260] → category (no fryer published (Fagor FG9 / Sammic PF-6 are not on sale))
  20: "/categories/equipamento-hoteleiro",
  // Triturador Sammic TR-550 BL [M-3030382] → Triturador XM-52 230/50-60/1 Sammic [M-3030690] — Sammic TR hand-blender range replaced by the XM range; XM-52 is the top model (medium)
  21: "/products/m-3030690-159980158",
  // Máquina de Lavar Louça de Cúpula Sammic P-100 [M-1302200] → category (no hood-type dishwasher published (AX-100 is a draft))
  22: "/categories/equipamento-hoteleiro",
  // Fogão com Forno a Gás Fagor CG9-61H [M-19008858] → category (no Fagor gas range published)
  23: "/categories/equipamento-hoteleiro",
  // Fogão com Forno a Gás Fagor CG7-41 [M-19007372] → category (no Fagor gas range published)
  24: "/categories/equipamento-hoteleiro",
  // Aspirador de Pó Viper SMARTNESS DV 10 [V 50000057] → category (no Viper dry vacuum published)
  25: "/categories/maquinas-de-limpeza",
  // Aspirador de Pó e Líquidos Viper LSU 135 [V 50000110] → Aspirador Sólidos e Líquidos LSU 135P-EU [N50000111] — same Viper LSU 135, current P-EU version (plain LSU 135 is a draft)
  26: "/products/n50000111-159981006",
  // Aspirador de Pó e Líquidos Viper LSU 255 [V 50000126] → Aspirador Sólidos e Líquidos LSU 255 [N50000126] — same model
  27: "/products/n50000126-162696440",
  // Lavadora Secadora Viper AS 380/15 B [V 50000199] → Lavadora AS 4325B Full Viper [N50000579] — Viper AS battery scrubber-dryer, current AS 4325B (medium)
  28: "/products/n50000579-159981035",
  // Máquina Injecção/Extracção Viper CAR 275 [V 50000209] → category (Viper CAR 275 is only a draft (N50000209))
  29: "/categories/maquinas-de-limpeza",
  // Lavadora Secadora Viper AS 430 C [V 50000220] → Lavadora AS4335C Viper [N50000583] — Viper AS cable scrubber-dryer, current AS 4335C (medium)
  30: "/products/n50000583-162697996",
  // Aspirador de Pó e Líquidos Nilfisk VL 500 - 35 BSF [VL-500] → Aspirador Po/Líquidos Nilfisk Vl500 55-2 [N107405162] — same Nilfisk VL500 wet & dry vacuum, 55 L version (medium)
  31: "/products/n107405162-159980601",
  // Rotativa Monodisco Nilfisk FM 400 L [N- 56380056] → category (Nilfisk FM 400 L is only a draft (N56380056))
  32: "/categories/maquinas-de-limpeza",
  // Lavadora Secadora Eléctrica Nilfisk SC 400 E [SC-400E] → category (no Nilfisk SC scrubber-dryer published)
  33: "/categories/maquinas-de-limpeza",
  // Aspirador de Pó Nilfisk VP300 ECO [VP300 ECO] → Aspirador VP300 Hepa Basic [N107421144] — same Nilfisk VP300, current HEPA Basic version
  34: "/products/n107421144-216053201",
  // Injecção/Extracção Nilfisk AX 14 [NAX-14] → Maquina Injecção/ExtracçãoAX 14 Nilfisk [NES1512405101] — same Nilfisk AX 14
  35: "/products/nes1512405101-211763059",
  // Esfregão Preto Forte Cortado 14,5x10cm (10 Unidades) [V100549] → Esfregão Preto Forte Cortado 14x10cm (10un) [V100549]
  36: "/products/v100549-159982669",
  // Esfregão Verde Extra em Rolo 14x600cm (1 Rolo) [V100232] → Esfregão Verde Extra em Rolo (14x600cm) [V100232]
  37: "/products/v100232-159982621",
  // Esfregão Preto em Rolo 14x600cm (1 Rolo) [100086] → Esfregão Preto em Rolo (14x600cm) [V100086] — same Vileda reference
  38: "/products/v100086-159982561",
  // Salva-Unhas Suave Azul 15x7cm (10 Unidades) [V100082] → Salva Unhas Suave Azul 7x15cm (10un) [V100082]
  39: "/products/v100082-159982556",
  // Pano QuickStar Micro Azul 40x38cm (5 Panos) [V100253] → Pano MicronQuick Azul (5un) [V152105] — Vileda QuickStar Micro succeeded by MicronQuick (blue, 5 un) (medium)
  40: "/products/v152105-159983126",
  // Pano QuickStar Micro Vermelho 40x38cm (5 Panos) [V100254] → Pano MicronQuick Vermelho (5un) [V152106] — Vileda QuickStar Micro succeeded by MicronQuick (red, 5 un) (medium)
  41: "/products/v152106-159983129",
  // Pano Seca Mais Pré-cortado Amarelo 25x1000cm (1 Rolo) [V121439] → Pano Seca Mais em Rolo Amarelo (25x1000cm) [V145631] — same Vileda Seca Mais yellow 25x1000cm roll (medium)
  42: "/products/v145631-162696645",
  // Luvas LiteTuff "L" (100 Unidades) [V137967] → Luvas LiteTuff grandes (100un) [V137967]
  43: "/products/v137967-159983004",
  // Luvas LiteTuff "M" (100 Unidades) [V137966] → Luvas LiteTuff médias (100un) [V137966]
  44: "/products/v137966-159982999",
  // Luvas Fortes "L" (10 Pares) [V120261] → Luvas Fortes Grandes (10 pares) [V120261]
  45: "/products/v120261-159982833",
  // Luvas Fortes "S" (10 Pares) [V120259] → Luvas Fortes Pequenas (10 pares) [V120259]
  46: "/products/v120259-159982825",
  // Luvas Fortes "M" (10 Pares) [V120260] → Luvas Fortes Médias (10 pares) [V120260]
  47: "/products/v120260-159982828",
  // MiraClean Maxi 12x7,5cm (8 Unidades) [V113034] → Esponja Miraclean Maxi 12x7,5cm (8un) [V113034]
  48: "/products/v113034-159982760",
  // Recarga Esfregona MicroCott 31cm (Unidade) [V122956] → Recarga Esfregona Microcott [V122956]
  49: "/products/v122956-159982909",
  // Cabo de Vassoura/Esfregona Profissional 138cm (Unidade) [V100275] → Cabo de Vassoura/Esfregona Profissional [V100275]
  50: "/products/v100275-159982660",
  // Cabo Mop Mopa Alumínio 150cm (Unidade) [V111529] → Cabo Mop Mopa Alumínio Ultramop [V111529]
  51: "/products/v111529-159982740",
  // Pinça Mopa Vileda 14cm (Unidade) [V101202] → Pinça Mopa Industrial Eco [HG3003] — mop clip (Vileda one not sold any more) (medium)
  52: "/products/hg3003-159978621",
  // Injecção/Extracção Nilfisk AX 410 [AX-410] → Maquina Injecção/ExtracçãoAX 14 Nilfisk [NES1512405101] — Nilfisk AX 410 gone; same AX injection/extraction family, AX 14 (medium)
  53: "/products/nes1512405101-211763059",
  // 123 (inactive) → category (test product (“123”))
  54: "/categories/maquinas-de-limpeza",
  // Máquina de lavar a roupa LA-14 TP 2 E FAGOR [M-19058420] → Máquina de Lavar a Roupa LA-14 TP 2 E Fagor [M-19058420] — same model
  55: "/products/m-19058420-159979804",
  // Máquina de Lavar Loiça de Cúpula Sammic Ax-100 [M-1303300] → Máquina de Lavar Louça AX-50 Sammic [M-1303180] — Sammic AX-100 is only a draft; same Sammic AX dishwasher range, AX-50 (medium)
  56: "/products/m-1303180-159979779",
  // Máquina de lavar a roupa LA-18 TP E [M-19034353] → Máquina de Lavar a Roupa LA-14 TP 2 E Fagor [M-19058420] — LA-18 TP2 E is only a draft (M-19058399); nearest Fagor LA-TP washer, LA-14 TP 2 E (medium)
  58: "/products/m-19058420-159979804",
  // rolo autocorte ecologic goma camps 1f 150m 6 rolos (inactive) → Papel Autocorte GC Ecologic 1F 150m (6 rolos) [PA3265]
  159: "/products/pa3265-159981423",
  // papel higienico domestico renova 2f 96 rolos (inactive) → Papel Higiénico Renova 2F (96 rolos) [PB3010]
  160: "/products/pb3010-159981433",
  // papel higienico jumbo 12 rolos (inactive) → Papel Higiénico Jumbo (12 rolos) [PB3021]
  161: "/products/pb3021-159981440",
  // papel higienico jumbo eco renova 2f 180m 12 rolos (inactive) → Papel Higiénico Jumbo Renova Eco 2F 180m (12 rolos) [PB3023]
  162: "/products/pb3023-159981443",
  // papel higienico jumbo amoos 2f 120m 18 rolos (inactive) → Papel Higiénico Jumbo Amoos 2F 120m (18 rolos) [PB3024]
  163: "/products/pb3024-159981448",
  // papel higienico jumbo renova 2f 170m 12 rolos (inactive) → Papel Higiénico Jumbo Renova 2F 170m (12 rolos) [PB3025]
  164: "/products/pb3025-159981453",
  // papel higienico jumbo amoos 2f 180m 12 rolos (inactive) → Papel Higiénico Jumbo Amoos 2F 180m (12 rolos) [PB3029]
  165: "/products/pb3029-159981466",
  // papel higienico celea 2f 56m 42 rolos (inactive) → Papel Higiénico Celea 2F 56m (42 rolos) [PB3037]
  166: "/products/pb3037-159981488",
  // guardanapos pasta smart 33x33cm 30 macos x 100 folhas (inactive) → category (“Pasta Smart” napkins not sold any more)
  167: "/categories/papel",
  // guardanapos 33x33cm 30 macos inativo (inactive) → Guardanapos Celea 33x33cm (30 maços x 100) [PC3041] — same 33x33cm napkin, 30 packs x 100 (medium)
  168: "/products/pc3041-159981518",
  // sacos para talheres branco 27x08x3 5cm 2000un (inactive) → Sacos para Talheres Branco 27x08x3,5cm (2000un) [PD3206]
  169: "/products/pd3206-159981628",
  // sacos para pao branco 25x10x6cm 1000un (inactive) → Sacos para Pão Branco 25x10x6cm (1000un) [PD3207]
  170: "/products/pd3207-159981631",
  // lencos faciais 100un (inactive) → Lenços Faciais (100un) [PD3223]
  171: "/products/pd3223-159981679",
  // rolo industrial amoos 2f 400m 2 rolos (inactive) → Rolo Industrial Amoos 2F 400m (2 rolos) [PE3105]
  172: "/products/pe3105-159981686",
  // rolo industrial air laid 130m 2 rolos (inactive) → Rolo Industrial Air Laid 130m (2 rolos) [PE3111]
  173: "/products/pe3111-159981701",
  // papel chamine tt 2f 6 rolos (inactive) → Papel Chaminé TT 2F (6 rolos) [PF3108]
  174: "/products/pf3108-159981725",
  // papel chamine amoos 2f 129m 6 rolos (inactive) → category (no Amoos chimney roll)
  175: "/categories/papel",
  // rolo de marquesa tnt 0 5x100m 8 rolos (inactive) → Rolo de Marquesa TNT 0,5x100m (10 rolos) [PG3162] — same TNT 0,5x100m couch roll, 10-roll pack (medium)
  176: "/products/pg3162-159981755",
  // embalagem plastica para sopa pequena com tampa 50un (inactive) → Embalagem Plástica para Sopa Pequena com Tampa (50un) [PP0450]
  177: "/products/pp0450-159981763",
  // toalhetes 30x45cm (inactive) → Toalhetes 30x45cm [PT2029]
  178: "/products/pt2029-159981819",
  // toalhetes 30x43cm 1000un (inactive) → Toalhetes 30x43cm (1000un) [PT2532]
  179: "/products/pt2532-159981871",
  // luvas latex com po m 100un (inactive) → Luvas Látex com Pó M (100un) [RL1002]
  180: "/products/rl1002-159982080",
  // luvas de nitrilo azul s 100 un (inactive) → Luvas de Nitrilo Azul S (100 un) [RL1061]
  181: "/products/rl1061-159982140",
  // luvas de nitrilo azul m 100 un (inactive) → Luvas de Nitrilo Azul M (100 un) [RL1062]
  182: "/products/rl1062-159982143",
  // luvas de nitrilo azul l 100 un (inactive) → Luvas de Nitrilo Azul L (100 un) [RL1063]
  183: "/products/rl1063-159982146",
  // luvas de nitrilo sem po m preto 100un (inactive) → Luvas de Nitrilo sem Pó M Preto (100un) [RL1066]
  184: "/products/rl1066-159982153",
  // luvas de nitrilo sem po l preto 100un (inactive) → Luvas de Nitrilo sem Pó L Preto (100un) [RL1068]
  185: "/products/rl1068-159982156",
  // luvas nitrilo sem po xl preto 100un (inactive) → Luvas de Nitrilo sem Pó XL Preto (100un) [RL1069]
  186: "/products/rl1069-160058139",
  // barrete circular em polipropileno branco 100un (inactive) → Barrete Circular em Polipropileno Branco (100un) [RP2006]
  187: "/products/rp2006-159982170",
  // avental de pe branco 100un (inactive) → Avental de PE Branco (100un) [RP2100]
  188: "/products/rp2100-159982181",
  // sacos lixo preto 80x120 10kg (inactive) → Sacos Lixo Preto 80x120 (10Kg) [SA4003]
  189: "/products/sa4003-159982236",
  // sacos lixo preto 100x120 com fole 10kg (inactive) → Sacos Lixo Preto 100x120 com Fole (10Kg) [SA4004]
  190: "/products/sa4004-159982239",
  // rolo lixo preto 85x105 bd 10 sacos x 30 rolos (inactive) → Rolo Lixo Preto 85x105 BD (10 sacos x 30 rolos ) [SR2001]
  191: "/products/sr2001-159982329",
  // rolo lixo preto 60x80 40 rolos x 10 sacos (inactive) → Rolo Lixo Preto 60x80 (50 rolos x 10 sacos) [SR4502] — same black 60x80 roll, 50-roll pack (medium)
  192: "/products/sr4502-159982348",
  // rolo lixo 80x90 preto 40 rolos x 10 sacos (inactive) → Rolo Lixo 80x90 Preto (40 rolos x 10 sacos) [SR4509]
  193: "/products/sr4509-159982355",
  // rolo lixo 52x60 preto 55 rolos x 20 sacos (inactive) → Rolo Lixo 52x60 Preto (55 rolos x 20 sacos) [SR4510]
  194: "/products/sr4510-159982359",
  // gaze descartavel impregnada 50un (inactive) → Gaze Descartável Impregnada (50un) [V100553]
  195: "/products/v100553-159982673",
  // recarga esfregona microcott (inactive) → Recarga Esfregona Microcott [V122956]
  196: "/products/v122956-159982909",
  // vassoura de pelo macio 2em1 naturals 34cm (inactive) → Vassoura de Pelo Macio 2em1 Naturals 34cm [V131924]
  197: "/products/v131924-159982963",
  // recarga esfregona profissional classica azul (inactive) → Recarga Esfregona Profissional Classica Azul [V137904]
  198: "/products/v137904-159982993",
  // mopa swep hygieneplus (inactive) → SWEP Mopa HygienePlus [V140695]
  199: "/products/v140695-159983044",
  // blocos para sanitas (inactive) → Blocos para Sanitas (2und) [DZ2012]
  200: "/products/dz2012-200108487",
  // vassoura pvc grande despontada (inactive) → Vassoura PVC Grande Despontada [HB2602]
  201: "/products/hb2602-159978448",
  // esfregona de algodao gigante (inactive) → Esfregona de Algodão Gigante [HF2601]
  202: "/products/hf2601-159978595",
  // Esfregona Microfibras [HF2605] → Esfregona Microfibras [HF2605]
  203: "/products/hf2605-173714785",
  // Cabo Metálico com Rosca 1,40m [HH3101] → Cabo Metálico com Rosca 1,40m [HH3101]
  204: "/products/hh3101-159978626",
  // Cabo Mopa Alumínio Anodizado 1,40m [HH3510] → Cabo Mopa Alumínio Anodizado 1,40m [HH3510]
  205: "/products/hh3510-159978633",
  // Pano Microfibra Wonder Azul 40x30 (6un) [HR1001] → Pano Microfibra Wonder Azul 40x30 (6un) [HR1001]
  206: "/products/hr1001-159978838",
  // Pano Microfibra Wonder Amarelo 40x30 (6un) [HR1003] → Pano Microfibra Wonder Amarelo 40x30 (6un) [HR1003]
  207: "/products/hr1003-159978845",
  // Salva unhas profissional Celea 7x14cm (6un) [HT8024] → Salva unhas profissional Celea 7x14cm (6un) [HT8024]
  208: "/products/ht8024-159978923",
  // Película aderente 0,30 x 300 (1 rolo) [HT9001] → Película aderente 0,30 x 300 (1 rolo) [HT9001]
  209: "/products/ht9001-159978940",
  // Rolo Folha Alumínio 0,30x200m [HT9011] → Rolo Folha Alumínio 0,30x200m [HT9011]
  210: "/products/ht9011-159978948",
  // Toalhas de Mão Zig-Zag Flush Renova 2F 22x21cm (30 maços x 180 folhas) (Inativo) [PA3005] → Toalha de Mãos Zig-Zag Renova Flush 22x21cm 2F (20 maços x 180 folhas) [PA3008] — same Renova Flush 22x21cm, 20-pack (medium)
  211: "/products/pa3008-197521047",
  // Toalhas de Mão Zig-Zag 2F 21x19cm (20 maços) -2600 folhas [PA3006] → Toalha de Mãos Zig-Zag 2F 21x19cm (20 maços) [PA3006]
  212: "/products/pa3006-162698146",
  // Toalhas de Mão Zig-Zag Flush Renova 2F 22x21cm (180 folhas x 20 maços) [PA3008] → Toalha de Mãos Zig-Zag Renova Flush 22x21cm 2F (20 maços x 180 folhas) [PA3008]
  213: "/products/pa3008-197521047",
  // Toalhas de Mão V Eco Celea 2F 21x20,5cm (20 maços x 190 folhas) [PA3011] → Toalha de Mãos Celea Eco 2F 21x20,5cm (20 maços x 190 folhas) [PA3011]
  214: "/products/pa3011-159981381",
  // Toalhas de Mão Zig-Zag Amoos 2F 21x22cm (20 maços) [PA3023] → Toalha de Mãos Zig-Zag Amoos 2F 21x22cm (20 maços) [PA3023]
  215: "/products/pa3023-159981400",
  // Rolo Autocorte Amoos 2F 160m (6 rolos) [PA3262] → Papel Autocorte Amoos 2F 160m (6 rolos) [PA3262]
  216: "/products/pa3262-159981414",
  // Rolo Autocorte Ecologic Goma Camps 2F 150m (6 rolos) [PA3264] → Papel Autocorte GC Ecologic 2F 150m (6 rolos) [PA3264]
  217: "/products/pa3264-159981420",
  // optimax detergente 20l (inactive) → Optimax Detergente (20L) [100842643]
  218: "/products/100842643-159976003",
  // hypofoam vf6 20l (inactive) → Hypofoam VF6 (20L) [100882635]
  219: "/products/100882635-159976039",
  // sprint limpador clorado 6x2l (inactive) → Sprint Limpador Clorado (6x2L) [100890635]
  220: "/products/100890635-159976048",
  // soft care all purpose foam ic 4x1 3l (inactive) → Soft Care All Purpose Foam IC (4x1,3L) [100940173]
  221: "/products/100940173-159976068",
  // detergente lavagem automatica de louca 5l (inactive) → Detergente Lavagem Automática de Louça (5L) [406150]
  222: "/products/406150-159976240",
  // optimum ultra extra higiene 5l (inactive) → Optimum Ultra Extra Higiene (6x2L) [100905199] — same Optimum Ultra Extra Higiene, 6x2L pack (medium)
  223: "/products/100905199-159976053",
  // clax hypo 42a1 20l (inactive) → Clax Hypo 42A1 (20L) [6973310]
  224: "/products/6973310-159976381",
  // suma ultra l2 20l (inactive) → Suma Ultra L2 (20L) [7010074]
  225: "/products/7010074-159976415",
  // suma light d1 2 5l (inactive) → Suma Light D1.2 (5L) [7508229]
  226: "/products/7508229-159976443",
  // jontec 300 5l (inactive) → Jontec 300 (5L) [7512925]
  227: "/products/7512925-159976669",
  // oxivir plus 5l (inactive) → Oxivir Plus (5L) [7513452]
  228: "/products/7513452-159976725",
  // suma chlorsan d10 4 5l (inactive) → Suma Chlorsan D10.4 (5L) [7516659]
  229: "/products/7516659-159976900",
  // clax 100 22a1 20l (inactive) → Clax 100 22A1 (20L) [7518139]
  230: "/products/7518139-159977048",
  // germatol desinfectante 5l (inactive) → Germatol Desinfectante (5L) [7518484]
  231: "/products/7518484-159977065",
  // suma combi la2 5l (inactive) → Suma Combi LA2 (5L) [7521868]
  232: "/products/7521868-159977158",
  // dry wipes recargas dispensador de toalhetes 6x125 (inactive) → Dry Wipes Recargas Dispensador de Toalhetes (6x125) [7523545]
  233: "/products/7523545-159977213",
  // doseador manual branco intellicare (inactive) → Doseador Manual Branco IntelliCARE [7524178]
  234: "/products/7524178-159977224",
  // dispensador jumbo abs smart branco (inactive) → Dispensador Jumbo ABS Smart Branco [AE57002]
  235: "/products/ae57002-159977390",
  // suporte toalhas abs smart branco (inactive) → Suporte Toalhas ABS Smart Branco [AH37002]
  236: "/products/ah37002-159977418",
  // gel de banho com alantoina 5 litros (inactive) → Gel de Banho com Alantoína (5 Litros) [BA1012]
  237: "/products/ba1012-159977478",
  // amaciador para roupa 5l (inactive) → Amaciador para Roupa (5L) [DA1351]
  238: "/products/da1351-159977599",
  // lixivia 5 (inactive) → Lixívia 5% [DB1501]
  239: "/products/db1501-159977658",
  // lixivia gel 5l (inactive) → Lixívia Gel (5L) [DB1505]
  240: "/products/db1505-159977668",
  // lixivia tradicional 5l (inactive) → Lixívia Tradicional (5L) [DB1508]
  241: "/products/db1508-159977670",
  // lixivia com detergente 5l (inactive) → Lixívia com Detergente (5L) [DB1511]
  242: "/products/db1511-159977675",
  // hipoclorito de sodio 6kg (inactive) → Hipoclorito de Sódio (6Kg) [DB1522]
  243: "/products/db1522-159977679",
  // sunlight professional limao 10l (inactive) → Sunlight Professional Limão (10L) [DB50963]
  244: "/products/db50963-159977684",
  // detergente lava tudo lavanda 5l (inactive) → Detergente Lava Tudo Lavanda (5L) [DC1103]
  245: "/products/dc1103-159977693",
  // detergente lava tudo floral 5l (inactive) → Detergente Lava Tudo Floral (5L) [DC1107]
  246: "/products/dc1107-159977698",
  // detergente desinfetante 5l (inactive) → Detergente Desinfetante (5L) [DC1201]
  247: "/products/dc1201-159977699",
  // agua destilada 5l (inactive) → Água Destilada (5L) [DC1220]
  248: "/products/dc1220-159977706",
  // detergente lava tudo citric 5l (inactive) → Detergente Lava Tudo Citric (5L) [DC9005]
  249: "/products/dc9005-159977708",
  // swarfega orange 4l (inactive) → Swarfega Orange (4L) [DI1040]
  250: "/products/di1040-159977739",
  // lava loica manual 1l (inactive) → category (no 1L manual dish detergent)
  251: "/categories/detergentes",
  // lava loica manual concentrado 5l (inactive) → Lava Loiça Manual Concentrado (5L) [DL1001]
  252: "/products/dl1001-159978024",
  // lava loica manual super concentrado 5l (inactive) → Lava Loiça Manual Super Concentrado (5L) [DL1003]
  253: "/products/dl1003-159978029",
  // super desengordurante 5l (inactive) → Super Desengordurante (5L) [DL1021]
  254: "/products/dl1021-159978033",
  // lava loica maquina 5l 6kg (inactive) → Lava Loiça Máquina (5L/6Kg) [DL1050]
  255: "/products/dl1050-159978043",
  // desengordurante multiusos 750ml (inactive) → Desengordurante Multiusos (750ml) [DL1092]
  256: "/products/dl1092-159978066",
  // gel de maos 5l (inactive) → Gel de Maos (5L) [DM1201]
  257: "/products/dm1201-159978079",
  // sabonete liquido 5l (inactive) → Sabonete Líquido (5L) [DM1206]
  258: "/products/dm1206-159978089",
  // blocos para sanitas (inactive) → Blocos para Sanitas (2und) [DZ2012]
  259: "/products/dz2012-200108487",
  // vassoura pvc grande despontada (inactive) → Vassoura PVC Grande Despontada [HB2602]
  260: "/products/hb2602-159978448",
  // esfregona de algodao gigante (inactive) → Esfregona de Algodão Gigante [HF2601]
  261: "/products/hf2601-159978595",
  // esfregona microfibras (inactive) → Esfregona Microfibras [HF2605]
  262: "/products/hf2605-173714785",
  // cabo metalico com rosca 1 40m (inactive) → Cabo Metálico com Rosca 1,40m [HH3101]
  263: "/products/hh3101-159978626",
  // cabo mopa aluminio anodizado 1 40m (inactive) → Cabo Mopa Alumínio Anodizado 1,40m [HH3510]
  264: "/products/hh3510-159978633",
  // pano microfibra wonder azul 40x30 6un (inactive) → Pano Microfibra Wonder Azul 40x30 (6un) [HR1001]
  265: "/products/hr1001-159978838",
  // pano microfibra wonder amarelo 40x30 6un (inactive) → Pano Microfibra Wonder Amarelo 40x30 (6un) [HR1003]
  266: "/products/hr1003-159978845",
  // salva unhas profissional celea 7x14cm 6un (inactive) → Salva unhas profissional Celea 7x14cm (6un) [HT8024]
  267: "/products/ht8024-159978923",
  // pelicula aderente 0 30 x 300 1 rolo (inactive) → Película aderente 0,30 x 300 (1 rolo) [HT9001]
  268: "/products/ht9001-159978940",
  // rolo folha aluminio 0 30x200m (inactive) → Rolo Folha Alumínio 0,30x200m [HT9011]
  269: "/products/ht9011-159978948",
  // toalhas de mao zig zag flush renova 2f 22x21cm 30 macos x 180 folhas inativo (inactive) → Toalha de Mãos Zig-Zag Renova Flush 22x21cm 2F (20 maços x 180 folhas) [PA3008] — same Renova Flush 22x21cm, 20-pack (medium)
  270: "/products/pa3008-197521047",
  // toalhas de mao zig zag 2f 21x19cm 20 macos 2600 folhas (inactive) → Toalha de Mãos Zig-Zag 2F 21x19cm (20 maços) [PA3006]
  271: "/products/pa3006-162698146",
  // toalhas de mao zig zag flush renova 2f 22x21cm 180 folhas x 20 macos (inactive) → Toalha de Mãos Zig-Zag Renova Flush 22x21cm 2F (20 maços x 180 folhas) [PA3008]
  272: "/products/pa3008-197521047",
  // toalhas de mao v eco celea 2f 21x20 5cm 20 macos x 190 folhas (inactive) → Toalha de Mãos Celea Eco 2F 21x20,5cm (20 maços x 190 folhas) [PA3011]
  273: "/products/pa3011-159981381",
  // toalhas de mao zig zag amoos 2f 21x22cm 20 macos (inactive) → Toalha de Mãos Zig-Zag Amoos 2F 21x22cm (20 maços) [PA3023]
  274: "/products/pa3023-159981400",
  // rolo autocorte amoos 2f 160m 6 rolos (inactive) → Papel Autocorte Amoos 2F 160m (6 rolos) [PA3262]
  275: "/products/pa3262-159981414",
  // rolo autocorte ecologic goma camps 2f 150m 6 rolos (inactive) → Papel Autocorte GC Ecologic 2F 150m (6 rolos) [PA3264]
  276: "/products/pa3264-159981420",
}

// Old attachment (technical/product sheet PDF) id → the old product it belonged to, so
// /base/index.php?controller=attachment&id_attachment=N lands on that product's new page.
export const LEGACY_ATTACHMENTS: Record<number, number> = {
  2: 17, // 137696
  3: 1, // DX1001
  4: 2, // DX1002
  5: 3, // DX1003
  6: 4, // DX1004
  7: 5, // DX1005
  8: 20, // M-19006260
  9: 24, // M-19007372
  10: 23, // M-19008858
  12: 22, // M-1302200
  13: 21, // M-3030382
  14: 16, // V100185
  15: 14, // V121564
  16: 15, // V121576
  17: 10, // V127937
  18: 11, // V127938
  19: 12, // V129454
  20: 13, // V129456
  21: 6, // V138751
  22: 7, // V138752
  23: 8, // V138753
  24: 9, // V138754
  25: 17, // 137696
  26: 16, // V100185
  27: 14, // V121564
  28: 15, // V121576
  29: 10, // V127937
  30: 11, // V127938
  31: 12, // V129454
  32: 13, // V129456
  33: 6, // V138751
  34: 7, // V138752
  35: 8, // V138753
  36: 9, // V138754
  38: 31, // VL-500
  39: 32, // N- 56380056
  40: 33, // SC-400E
  41: 34, // VP300 ECO
  42: 35, // NAX-14
  43: 36, // V100549
  44: 36, // V100549
  45: 37, // V100232
  46: 37, // V100232
  47: 38, // 100086
  48: 38, // 100086
  49: 39, // V100082
  50: 39, // V100082
  51: 40, // V100253
  52: 40, // V100253
  53: 41, // V100254
  54: 41, // V100254
  55: 42, // V121439
  56: 42, // V121439
  57: 43, // V137967
  58: 43, // V137967
  60: 44, // V137966
  61: 44, // V137966
  62: 45, // V120261
  63: 45, // V120261
  64: 46, // V120259
  65: 46, // V120259
  66: 47, // V120260
  67: 47, // V120260
  68: 48, // V113034
  69: 48, // V113034
  70: 49, // V122956
  71: 49, // V122956
  72: 50, // V100275
  73: 50, // V100275
  74: 51, // V111529
  75: 51, // V111529
  76: 53, // AX-410
  77: 56, // M-1303300
  80: 58, // M-19034353
}

// Old category id → new category handle.
export const LEGACY_CATEGORIES: Record<number, string> = {
  3: "detergentes",
  12: "utensilios-limpeza",
  13: "equipamento-hoteleiro",
  15: "maquinas-de-limpeza",
  16: "utensilios-limpeza",
  17: "utensilios-limpeza",
  18: "utensilios-limpeza",
  19: "utensilios-limpeza",
  20: "utensilios-limpeza",
  21: "utensilios-limpeza",
  22: "utensilios-limpeza",
  23: "utensilios-limpeza",
  24: "sacos",
  89: "utensilios-limpeza",
  90: "utensilios-limpeza",
  91: "utensilios-limpeza",
  92: "utensilios-limpeza",
}
