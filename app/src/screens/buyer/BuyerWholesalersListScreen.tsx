"use client";

import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FooterBrand } from "../../components/FooterBrand";
import { supabase } from "../../lib/supabase";
import type { BuyerStackParamList, BuyerTabParamList } from "../../navigation/buyer/types";
import { Colors } from "../../theme/colors";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";

type Props = BottomTabScreenProps<BuyerTabParamList, "WholesalersList">;

type BannerRow = {
  id: string;
  url_imagen: string;
  link_destino: string | null;
  activo: boolean;
  created_at: string;
  orden: number;
};

type WholesalerRow = {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  foto_perfil_url: string | null;
  pais: string | null;
  estado_provincia: string | null;
  categoria: string | null;
  verificado: boolean;
  acceso: boolean;
  fecha_aprobacion: string | null;
};

type ProvinceGroup = { state: string; wholesalers: WholesalerRow[] };
type CountryGroup = { country: string; provinces: ProvinceGroup[] };

const COUNTRIES: { code: string; name: string }[] = [
  { code: "mx", name: "México" },
  { code: "gt", name: "Guatemala" },
  { code: "sv", name: "El Salvador" },
  { code: "hn", name: "Honduras" },
  { code: "ni", name: "Nicaragua" },
  { code: "cr", name: "Costa Rica" },
  { code: "pa", name: "Panamá" },
  { code: "co", name: "Colombia" },
  { code: "ve", name: "Venezuela" },
  { code: "ec", name: "Ecuador" },
  { code: "pe", name: "Perú" },
  { code: "cl", name: "Chile" },
  { code: "ar", name: "Argentina" },
  { code: "uy", name: "Uruguay" },
];

const PROVINCES_BY_COUNTRY: Record<string, readonly string[]> = {
  México: [
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Ciudad de México",
    "Coahuila",
    "Colima",
    "Durango",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "Estado de México",
    "Michoacán",
    "Morelos",
    "Nayarit",
    "Nuevo León",
    "Oaxaca",
    "Puebla",
    "Querétaro",
    "Quintana Roo",
    "San Luis Potosí",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz",
    "Yucatán",
    "Zacatecas",
  ],
  Guatemala: [
    "Alta Verapaz",
    "Baja Verapaz",
    "Chimaltenango",
    "Chiquimula",
    "El Progreso",
    "Escuintla",
    "Guatemala",
    "Huehuetenango",
    "Izabal",
    "Jalapa",
    "Jutiapa",
    "Petén",
    "Quetzaltenango",
    "Quiché",
    "Retalhuleu",
    "Sacatepéquez",
    "San Marcos",
    "Santa Rosa",
    "Sololá",
    "Suchitepéquez",
    "Totonicapán",
    "Zacapa",
  ],
  "El Salvador": [
    "Ahuachapán",
    "Cabañas",
    "Chalatenango",
    "Cuscatlán",
    "La Libertad",
    "La Paz",
    "La Unión",
    "Morazán",
    "San Miguel",
    "San Salvador",
    "San Vicente",
    "Santa Ana",
    "Sonsonate",
    "Usulután",
  ],
  Honduras: [
    "Atlántida",
    "Choluteca",
    "Colón",
    "Comayagua",
    "Copán",
    "Cortés",
    "El Paraíso",
    "Francisco Morazán",
    "Gracias a Dios",
    "Intibucá",
    "Islas de la Bahía",
    "La Paz",
    "Lempira",
    "Ocotepeque",
    "Olancho",
    "Santa Bárbara",
    "Valle",
    "Yoro",
  ],
  Nicaragua: [
    "Boaco",
    "Carazo",
    "Chinandega",
    "Chontales",
    "Costa Caribe Norte",
    "Costa Caribe Sur",
    "Estelí",
    "Granada",
    "Jinotega",
    "León",
    "Madriz",
    "Managua",
    "Masaya",
    "Matagalpa",
    "Nueva Segovia",
    "Rivas",
    "Río San Juan",
  ],
  "Costa Rica": ["Alajuela", "Cartago", "Guanacaste", "Heredia", "Limón", "Puntarenas", "San José"],
  Panamá: [
    "Bocas del Toro",
    "Chiriquí",
    "Coclé",
    "Colón",
    "Darién",
    "Herrera",
    "Los Santos",
    "Panamá",
    "Panamá Oeste",
    "Veraguas",
  ],
  Colombia: [
    "Amazonas",
    "Antioquia",
    "Arauca",
    "Atlántico",
    "Bogotá D.C.",
    "Bolívar",
    "Boyacá",
    "Caldas",
    "Caquetá",
    "Casanare",
    "Cauca",
    "Cesar",
    "Chocó",
    "Córdoba",
    "Cundinamarca",
    "Guainía",
    "Guaviare",
    "Huila",
    "La Guajira",
    "Magdalena",
    "Meta",
    "Nariño",
    "Norte de Santander",
    "Putumayo",
    "Quindío",
    "Risaralda",
    "San Andrés y Providencia",
    "Santander",
    "Sucre",
    "Tolima",
    "Valle del Cauca",
    "Vaupés",
    "Vichada",
  ],
  Venezuela: [
    "Distrito Capital",
    "Amazonas",
    "Anzoátegui",
    "Apure",
    "Aragua",
    "Barinas",
    "Bolívar",
    "Carabobo",
    "Cojedes",
    "Delta Amacuro",
    "Falcón",
    "Guárico",
    "Lara",
    "Mérida",
    "Miranda",
    "Monagas",
    "Nueva Esparta",
    "Portuguesa",
    "Sucre",
    "Táchira",
    "Trujillo",
    "La Guaira",
    "Yaracuy",
    "Zulia",
  ],
  Ecuador: [
    "Azuay",
    "Bolívar",
    "Cañar",
    "Carchi",
    "Chimborazo",
    "Cotopaxi",
    "El Oro",
    "Esmeraldas",
    "Galápagos",
    "Guayas",
    "Imbabura",
    "Loja",
    "Los Ríos",
    "Manabí",
    "Morona Santiago",
    "Napo",
    "Orellana",
    "Pastaza",
    "Pichincha",
    "Santa Elena",
    "Santo Domingo de los Tsáchilas",
    "Sucumbíos",
    "Tungurahua",
    "Zamora Chinchipe",
  ],
  Perú: [
    "Amazonas",
    "Áncash",
    "Apurímac",
    "Arequipa",
    "Ayacucho",
    "Cajamarca",
    "Callao",
    "Cusco",
    "Huancavelica",
    "Huánuco",
    "Ica",
    "Junín",
    "La Libertad",
    "Lambayeque",
    "Lima",
    "Loreto",
    "Madre de Dios",
    "Moquegua",
    "Pasco",
    "Piura",
    "Puno",
    "San Martín",
    "Tacna",
    "Tumbes",
    "Ucayali",
  ],
  Chile: [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana de Santiago",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes",
  ],
  Argentina: [
    "Buenos Aires",
    "CABA",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán",
  ],
  Uruguay: [
    "Artigas",
    "Canelones",
    "Cerro Largo",
    "Colonia",
    "Durazno",
    "Flores",
    "Florida",
    "Lavalleja",
    "Maldonado",
    "Montevideo",
    "Paysandú",
    "Río Negro",
    "Rivera",
    "Rocha",
    "Salto",
    "San José",
    "Soriano",
    "Tacuarembó",
    "Treinta y Tres",
  ],
};

function byName(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function displayName(w: WholesalerRow): string {
  return w.nombre?.trim() ? w.nombre : "Mayorista";
}

function chunkCountryGroups(wholesalers: WholesalerRow[]): CountryGroup[] {
  const byCountry = new Map<string, WholesalerRow[]>();
  for (const w of wholesalers) {
    const country = w.pais ?? "—";
    const arr = byCountry.get(country) ?? [];
    arr.push(w);
    byCountry.set(country, arr);
  }

  const countries = [...byCountry.keys()].sort(byName);
  return countries.map((country) => {
    const items = (byCountry.get(country) ?? []).slice();
    items.sort(
      (a, b) =>
        byName(a.estado_provincia ?? "", b.estado_provincia ?? "") ||
        byName(a.nombre ?? "", b.nombre ?? ""),
    );

    const byState = new Map<string, WholesalerRow[]>();
    for (const w of items) {
      const state = w.estado_provincia ?? "—";
      const arr = byState.get(state) ?? [];
      arr.push(w);
      byState.set(state, arr);
    }
    const states = [...byState.keys()].sort(byName);

    return {
      country,
      provinces: states.map((state) => ({
        state,
        wholesalers: (byState.get(state) ?? [])
          .slice()
          .sort((a, b) => byName(a.nombre ?? "", b.nombre ?? "")),
      })),
    };
  });
}

function buildGroups(wholesalers: WholesalerRow[], selectedCountry: string | null): CountryGroup[] {
  if (!selectedCountry) return chunkCountryGroups(wholesalers);
  const items = wholesalers.slice().sort((a, b) => byName(a.nombre ?? "", b.nombre ?? ""));
  const byState = new Map<string, WholesalerRow[]>();
  for (const w of items) {
    const state = w.estado_provincia ?? "—";
    const arr = byState.get(state) ?? [];
    arr.push(w);
    byState.set(state, arr);
  }
  const baseStates = (PROVINCES_BY_COUNTRY[selectedCountry] ?? []).slice();
  const extraStates = [...byState.keys()].filter((s) => !baseStates.includes(s)).sort(byName);
  const states = [...baseStates, ...extraStates];
  return [
    {
      country: selectedCountry,
      provinces: states.map((state) => ({
        state,
        wholesalers: (byState.get(state) ?? []).slice().sort((a, b) => byName(a.nombre ?? "", b.nombre ?? "")),
      })),
    },
  ];
}

async function openLink(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {}
}

function CountryModal(props: {
  open: boolean;
  selected: string | null;
  onClose: () => void;
  onSelect: (country: string | null) => void;
}) {
  return (
    <Modal visible={props.open} transparent animationType="fade" onRequestClose={props.onClose}>
      <Pressable style={styles.modalOverlay} onPress={props.onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Filtrar Mayoristas Por País</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            <Pressable
              onPress={() => props.onSelect(null)}
              style={[styles.modalItem, props.selected === null ? styles.modalItemActive : null]}
            >
              <Text style={[styles.modalItemText, props.selected === null ? styles.modalItemTextActive : null]}>
                Todos
              </Text>
            </Pressable>
            {COUNTRIES.map((c) => {
              const active = props.selected === c.name;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => props.onSelect(active ? null : c.name)}
                  style={[styles.modalItem, active ? styles.modalItemActive : null]}
                >
                  <Text style={[styles.modalItemText, active ? styles.modalItemTextActive : null]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function BuyerWholesalersListScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const category = route.params?.category ?? null;
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const { width, height } = useWindowDimensions();

  const bannerWidth = Math.round(width * 0.7);
  const bannerHeight = Math.round(height * 0.15);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await supabase
        .from("banners")
        .select("id,url_imagen,link_destino,activo,orden,created_at")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!res.error) setBanners((res.data ?? []) as BannerRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();
      let q = supabase
        .from("wholesaler_profiles")
        .select(
          "id,nombre,descripcion,foto_perfil_url,pais,estado_provincia,categoria,verificado,acceso,fecha_aprobacion",
        )
        .eq("acceso", true)
        .gte("fecha_aprobacion", sinceIso)
        .order("pais", { ascending: true })
        .order("estado_provincia", { ascending: true })
        .order("nombre", { ascending: true });

      if (category) q = q.eq("categoria", category);
      if (selectedCountry) q = q.eq("pais", selectedCountry);

      const { data, error } = await q;
      if (cancelled) return;

      if (error) {
        setWholesalers([]);
        setIsLoading(false);
        return;
      }

      setWholesalers((data ?? []) as WholesalerRow[]);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, selectedCountry]);

  const countryGroups = useMemo(() => buildGroups(wholesalers, selectedCountry), [selectedCountry, wholesalers]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista de Mayoristas</Text>
        <Text style={styles.subtitle}>
          {category ? `Categoría: ${category}` : "Explora mayoristas por país y provincia."}
        </Text>
      </View>

      <View>
        <FlatList
          data={banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 12 }}
          snapToInterval={bannerWidth + 12}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (item.link_destino ? openLink(item.link_destino) : undefined)}
              style={{ width: bannerWidth, height: bannerHeight }}
            >
              <View style={styles.bannerCard}>
                <Image
                  source={{ uri: item.url_imagen }}
                  style={{ width: bannerWidth, height: bannerHeight }}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerText} numberOfLines={1}>
                    {item.link_destino ?? ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.filterRow}>
        <Pressable onPress={() => setCountryModalOpen(true)} style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={18} color={Colors.ink} />
          <Text style={styles.filterBtnText}>Filtrar Mayoristas Por País</Text>
        </Pressable>
        {selectedCountry ? (
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{selectedCountry}</Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.cardMuted}>
          <Text style={styles.helper}>Cargando...</Text>
        </View>
      ) : countryGroups.length === 0 ? (
        <View style={styles.cardMuted}>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.helper}>Prueba otra categoría o cambia el país.</Text>
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          {countryGroups.map((cg) => (
            <View key={cg.country} style={{ gap: 12 }}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>{cg.country}</Text>
                <Text style={styles.groupCount}>
                  {cg.provinces.reduce((acc, p) => acc + p.wholesalers.length, 0)} mayoristas
                </Text>
              </View>

              {cg.provinces.map((pg) => (
                <View key={`${cg.country}_${pg.state}`} style={{ gap: 10 }}>
                  <Text style={styles.stateTitle}>{pg.state}</Text>
                  <View style={styles.grid2}>
                    {pg.wholesalers.map((w) => (
                      <Pressable
                        key={w.id}
                        onPress={() => navigation.navigate("WholesalerProfile", { wholesalerId: w.id })}
                        style={styles.whCard}
                      >
                        <View style={styles.whImage}>
                          {w.foto_perfil_url ? (
                            <Image
                              source={{ uri: w.foto_perfil_url }}
                              style={styles.whImageFill}
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons name="storefront-outline" size={18} color={Colors.inkMuted} />
                          )}
                        </View>
                        <Text style={styles.whName} numberOfLines={1}>
                          {displayName(w)}
                        </Text>
                        <Text style={styles.whDesc} numberOfLines={2}>
                          {w.descripcion ?? "—"}
                        </Text>
                        <View style={styles.whBadges}>
                          {w.verificado ? (
                            <View style={styles.badgeVerified}>
                              <Ionicons name="checkmark" size={12} color={Colors.paper} />
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <FooterBrand />

      <CountryModal
        open={countryModalOpen}
        selected={selectedCountry}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(c) => {
          setSelectedCountry(c);
          setCountryModalOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.app },
  container: { paddingTop: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  header: { paddingHorizontal: Spacing.xl, gap: 6 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.ink },
  subtitle: { fontSize: 13, fontWeight: "700", color: Colors.inkMuted, lineHeight: 18 },
  bannerCard: {
    overflow: "hidden",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: { fontSize: 11, fontWeight: "900", color: Colors.paper },
  filterRow: { paddingHorizontal: Spacing.xl, flexDirection: "row", alignItems: "center", gap: 10 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
  },
  filterBtnText: { fontSize: 13, fontWeight: "900", color: Colors.ink },
  filterChip: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(211,47,47,0.30)",
    backgroundColor: "rgba(211,47,47,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: { fontSize: 12, fontWeight: "900", color: Colors.primary },
  cardMuted: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    padding: 16,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: Colors.ink },
  helper: { marginTop: 6, fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16 },
  groupHead: { paddingHorizontal: Spacing.xl, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  groupTitle: { fontSize: 16, fontWeight: "900", color: Colors.ink },
  groupCount: { fontSize: 12, fontWeight: "800", color: Colors.inkMuted },
  stateTitle: { paddingHorizontal: Spacing.xl, fontSize: 13, fontWeight: "900", color: Colors.inkMuted },
  grid2: { paddingHorizontal: Spacing.xl, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  whCard: {
    width: "48%",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    padding: 12,
    gap: 8,
  },
  whImage: {
    height: 96,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  whImageFill: { width: "100%", height: "100%" },
  whName: { fontSize: 13, fontWeight: "900", color: Colors.ink },
  whDesc: { fontSize: 12, fontWeight: "700", color: Colors.inkMuted, lineHeight: 16, minHeight: 32 },
  whBadges: { flexDirection: "row", justifyContent: "flex-end" },
  badgeVerified: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: Spacing.xl },
  modalCard: { borderRadius: Radius.xl, backgroundColor: Colors.paper, padding: 16, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 14, fontWeight: "900", color: Colors.ink },
  modalItem: {
    height: 44,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemActive: { backgroundColor: Colors.primary, borderColor: "rgba(0,0,0,0.10)" },
  modalItemText: { fontSize: 13, fontWeight: "900", color: Colors.ink },
  modalItemTextActive: { color: Colors.paper },
});
