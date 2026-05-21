import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { File } from "expo-file-system";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { Card } from "../components/Card";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { RootStackParamList } from "../navigation/types";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/radius";
import { Spacing } from "../theme/spacing";
import { pickImageFromLibrary, looksLikeUrl } from "../utils/images";
import { clamp100 } from "../utils/validation";

const CATEGORIES = [
  "Tecnología y Electrónica",
  "Ropa y Moda",
  "Alimentos y Bebidas",
  "Belleza y Cuidado Personal",
  "Hogar y Muebles",
  "Juguetes y Entretenimiento",
  "Deportes y Fitness",
  "Joyería y Accesorios",
  "Salud y Farmacia",
  "Materiales y Construcción",
] as const;

const COUNTRIES = [
  "México",
  "Guatemala",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panamá",
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Perú",
  "Bolivia",
  "Chile",
  "Argentina",
  "Uruguay",
] as const;

const STATES_BY_COUNTRY: Record<string, readonly string[]> = {
  México: [
    "CDMX",
    "Jalisco",
    "Nuevo León",
    "Estado de México",
    "Puebla",
    "Guanajuato",
    "Querétaro",
    "Yucatán",
    "Veracruz",
    "Baja California",
  ],
  Guatemala: ["Guatemala", "Sacatepéquez", "Quetzaltenango", "Escuintla", "Petén"],
  "El Salvador": ["San Salvador", "La Libertad", "Santa Ana", "San Miguel", "Sonsonate"],
  Honduras: ["Francisco Morazán", "Cortés", "Atlántida", "Comayagua", "Choluteca"],
  Nicaragua: ["Managua", "León", "Granada", "Masaya", "Matagalpa"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia", "Puntarenas"],
  Panamá: ["Panamá", "Panamá Oeste", "Colón", "Chiriquí", "Veraguas"],
  Colombia: ["Cundinamarca", "Antioquia", "Valle del Cauca", "Atlántico", "Santander"],
  Venezuela: ["Distrito Capital", "Miranda", "Zulia", "Carabobo", "Lara"],
  Ecuador: ["Pichincha", "Guayas", "Azuay", "Manabí", "Tungurahua"],
  Perú: ["Lima", "Arequipa", "La Libertad", "Piura", "Cusco"],
  Bolivia: ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Tarija"],
  Chile: ["Región Metropolitana", "Valparaíso", "Biobío", "Araucanía", "Antofagasta"],
  Argentina: ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza"],
  Uruguay: ["Montevideo", "Canelones", "Maldonado", "Salto", "Colonia"],
};

type SocialState = {
  whatsapp: string;
  instagram: string;
  facebook: string;
  web: string;
};

type CatalogSlot = {
  title: string;
  images: string[];
  inputUrl: string;
};

type ProfileSnapshot = {
  savedAtIso: string;
  photoUrl: string | null;
  name: string;
  description: string;
  social: SocialState;
  catalogImageUrls: string[];
};

function makeSlots(): CatalogSlot[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    title: `Carrusel ${i + 1}`,
    images: [],
    inputUrl: "",
  }));
}

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingProfile">;

function SelectField(props: {
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = props.value?.trim().length > 0 ? props.value : props.placeholder;
  const muted = props.value?.trim().length > 0 ? styles.selectText : styles.selectPlaceholder;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{props.label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.select, props.error ? styles.inputError : null]}
      >
        <Text style={muted} numberOfLines={1}>
          {display}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{props.label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </Pressable>
          </View>
          <FlatList
            data={[...props.options]}
            keyExtractor={(item) => item}
            ItemSeparatorComponent={() => <View style={styles.modalSep} />}
            renderItem={({ item }) => {
              const active = item === props.value;
              return (
                <Pressable
                  onPress={() => {
                    props.onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.modalRow, active ? styles.modalRowActive : null]}
                >
                  <Text style={[styles.modalRowText, active ? styles.modalRowTextActive : null]}>
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function fileExtFromUri(uri: string): string {
  const clean = uri.split("?")[0] ?? uri;
  const parts = clean.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "jpg";
  const safe = ext.toLowerCase();
  if (safe.length > 6) return "jpg";
  return safe || "jpg";
}

function mimeFromUri(uri: string): string {
  const ext = fileExtFromUri(uri);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Network request failed");
    return await res.arrayBuffer();
  }

  if (uri.startsWith("file://")) {
    const file = new File(uri);
    return await file.arrayBuffer();
  }

  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.onload = () => {
      const ok = xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300);
      if (!ok) {
        reject(new Error("Network request failed"));
        return;
      }
      resolve(xhr.response as ArrayBuffer);
    };
    xhr.responseType = "arraybuffer";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

async function uploadToBucket(bucket: string, path: string, uri: string) {
  let body: ArrayBuffer;
  try {
    body = await uriToArrayBuffer(uri);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new Error("No se pudo leer la imagen seleccionada. " + msg);
  }
  const contentType = mimeFromUri(uri);

  let upload:
    | Awaited<ReturnType<ReturnType<typeof supabase.storage.from>["upload"]>>
    | null = null;
  try {
    upload = await supabase.storage.from(bucket).upload(path, body, {
      contentType,
      upsert: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new Error("No se pudo conectar con Supabase Storage. " + msg);
  }

  if (upload?.error) throw new Error(upload.error.message);

  const pub = supabase.storage.from(bucket).getPublicUrl(path);
  if (!pub.data.publicUrl) throw new Error("No public URL");
  return pub.data.publicUrl;
}

export function OnboardingProfileScreen({ navigation }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [social, setSocial] = useState<SocialState>({
    whatsapp: "",
    instagram: "",
    facebook: "",
    web: "",
  });
  const [slots, setSlots] = useState<CatalogSlot[]>(() => makeSlots());
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<ProfileSnapshot | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const effectivePhoto = useMemo(() => {
    if (profilePhotoUri) return profilePhotoUri;
    if (looksLikeUrl(profilePhotoUrl)) return profilePhotoUrl.trim();
    return null;
  }, [profilePhotoUri, profilePhotoUrl]);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    if (!effectivePhoto) out.photo = "Carga una foto (selector o URL).";
    if (!name.trim()) out.name = "Ingresa el nombre del perfil.";
    if (!description.trim()) out.description = "Ingresa una descripción.";
    if (!category.trim()) out.category = "Selecciona una categoría.";
    if (!country.trim()) out.country = "Selecciona un país.";
    if (!stateProvince.trim()) out.state = "Ingresa provincia/estado.";
    return out;
  }, [category, country, description, effectivePhoto, name, stateProvince]);

  const canSubmit = Object.keys(errors).length === 0;

  const stateOptions = useMemo<readonly string[]>(() => {
    if (!country) return [];
    return STATES_BY_COUNTRY[country] ?? [];
  }, [country]);

  useEffect(() => {
    if (!country) return;
    if (stateProvince && stateOptions.includes(stateProvince)) return;
    setStateProvince("");
  }, [country, stateOptions, stateProvince]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) navigation.replace("Register");
  }, [isAuthLoading, navigation, user]);

  useEffect(() => {
    let cancelled = false;
    if (isAuthLoading) return;
    if (!user) return;

    (async () => {
      setIsHydrating(true);
      try {
        const wholesalerRes = await supabase
          .from("wholesalers")
          .select(
            "company_name,description,logo_url,whatsapp,instagram,facebook,website,category,country,state_province",
          )
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        const catalogRes = await supabase
          .from("catalogs")
          .select("image_url,display_order")
          .eq("wholesaler_id", user.id)
          .order("display_order", { ascending: true })
          .limit(5);

        if (cancelled) return;

        if (wholesalerRes.data) {
          setName((wholesalerRes.data.company_name ?? "").toString());
          setDescription((wholesalerRes.data.description ?? "").toString());
          setProfilePhotoUri(null);
          setProfilePhotoUrl((wholesalerRes.data.logo_url ?? "").toString());
          setCategory((wholesalerRes.data.category ?? "").toString());
          setCountry((wholesalerRes.data.country ?? "").toString());
          setStateProvince((wholesalerRes.data.state_province ?? "").toString());
          setSocial({
            whatsapp: (wholesalerRes.data.whatsapp ?? "").toString(),
            instagram: (wholesalerRes.data.instagram ?? "").toString(),
            facebook: (wholesalerRes.data.facebook ?? "").toString(),
            web: (wholesalerRes.data.website ?? "").toString(),
          });
        }

        const images = (catalogRes.data ?? [])
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((x) => x.image_url)
          .filter((u) => typeof u === "string" && u.length > 0)
          .slice(0, 5);

        setSlots((prev) => {
          const base = prev.length === 5 ? prev : makeSlots();
          return base.map((s, i) => ({
            ...s,
            inputUrl: "",
            images: images[i] ? [images[i]!] : [],
          }));
        });

        setTouched(false);
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user]);

  async function pickProfilePhoto() {
    const uri = await pickImageFromLibrary();
    if (!uri) return;
    setProfilePhotoUri(uri);
    setProfilePhotoUrl("");
  }

  async function pickCatalogImage(slotIndex: number) {
    const uri = await pickImageFromLibrary();
    if (!uri) return;
    setSlots((prev) =>
      prev.map((s, i) => (i === slotIndex ? { ...s, images: [uri, ...s.images] } : s)),
    );
  }

  function addCatalogUrl(slotIndex: number) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== slotIndex) return s;
        const url = s.inputUrl.trim();
        if (!looksLikeUrl(url)) return s;
        return { ...s, inputUrl: "", images: [url, ...s.images] };
      }),
    );
  }

  function removeCatalogImage(slotIndex: number, imageIndex: number) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== slotIndex) return s;
        return { ...s, images: s.images.filter((_, idx) => idx !== imageIndex) };
      }),
    );
  }

  async function submit() {
    setTouched(true);
    if (!canSubmit) {
      const first =
        errors.photo ??
        errors.name ??
        errors.description ??
        errors.category ??
        errors.country ??
        errors.state ??
        "Revisa el formulario.";
      Alert.alert("Revisa el formulario", first);
      return;
    }
    if (!user) return;
    if (!effectivePhoto) return;

    const flatImages: string[] = [];
    for (const slot of slots) {
      for (const img of slot.images) {
        flatImages.push(img);
        if (flatImages.length >= 5) break;
      }
      if (flatImages.length >= 5) break;
    }

    setIsSaving(true);
    try {
      const profilePath = `${user.id}/profile-${Date.now()}.${fileExtFromUri(effectivePhoto)}`;
      const profilePublicUrl = await uploadToBucket("profiles", profilePath, effectivePhoto);

      const updateWholesaler = await supabase
        .from("wholesalers")
        .update({
          company_name: name.trim(),
          description: description.trim(),
          logo_url: profilePublicUrl,
          category: category.trim(),
          country: country.trim(),
          state_province: stateProvince.trim(),
          whatsapp: social.whatsapp.trim() || null,
          instagram: social.instagram.trim() || null,
          facebook: social.facebook.trim() || null,
          website: social.web.trim() || null,
        })
        .eq("id", user.id);

      if (updateWholesaler.error) {
        throw new Error(updateWholesaler.error.message ?? "No se pudo guardar el perfil.");
      }

      const del = await supabase.from("catalogs").delete().eq("wholesaler_id", user.id);
      if (del.error) throw new Error(del.error.message ?? "No se pudo reiniciar el catálogo.");

      const catalogUrls: string[] = [];
      for (let i = 0; i < flatImages.length; i++) {
        const uri = flatImages[i]!;
        const path = `${user.id}/catalog-${Date.now()}-${i + 1}.${fileExtFromUri(uri)}`;
        const publicUrl = await uploadToBucket("catalogs", path, uri);
        catalogUrls.push(publicUrl);
      }

      if (catalogUrls.length > 0) {
        const insert = await supabase.from("catalogs").insert(
          catalogUrls.map((u, i) => ({
            wholesaler_id: user.id,
            image_url: u,
            display_order: i + 1,
          })),
        );
        if (insert.error) {
          throw new Error(insert.error.message ?? "No se pudo guardar el catálogo.");
        }
      }

      const snapshot: ProfileSnapshot = {
        savedAtIso: new Date().toISOString(),
        photoUrl: profilePublicUrl,
        name: name.trim(),
        description: description.trim(),
        social: {
          whatsapp: social.whatsapp.trim(),
          instagram: social.instagram.trim(),
          facebook: social.facebook.trim(),
          web: social.web.trim(),
        },
        catalogImageUrls: catalogUrls,
      };
      setSaved(snapshot);
      Alert.alert("Guardado", "Perfil y catálogo guardados en Supabase.");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Error inesperado.";
      Alert.alert("Error", msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Esta es la información que verán los usuarios</Text>
            <Pressable
              onPress={async () => {
                try {
                  await supabase.auth.signOut();
                } finally {
                  navigation.reset({ index: 0, routes: [{ name: "Register" }] });
                }
              }}
              hitSlop={10}
            >
              <Text style={styles.signOut}>Cerrar sesión</Text>
            </Pressable>
          </View>
          <Text style={styles.headerSubtitle}>Formulario conectado a Supabase (DB + Storage).</Text>
          {isHydrating ? <Text style={styles.headerSubtitle}>Cargando datos guardados…</Text> : null}
        </View>

        {saved ? (
          <Card style={styles.section}>
            <View style={styles.savedRow}>
              <Text style={styles.sectionTitle}>Guardado</Text>
              <View style={styles.savedPill}>
                <Text style={styles.savedPillText}>
                  {new Date(saved.savedAtIso).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.previewRow}>
              <View style={styles.previewPhotoBox}>
                {saved.photoUrl ? <Image source={{ uri: saved.photoUrl }} style={styles.previewPhoto} /> : null}
              </View>
              <View style={styles.previewMeta}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {saved.name}
                </Text>
                <Text style={styles.previewDesc} numberOfLines={3}>
                  {saved.description}
                </Text>
                <Text style={styles.previewSmall}>
                  Catálogo: {saved.catalogImageUrls.length} imagen(es)
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Foto de perfil</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoBox}>
              {effectivePhoto ? (
                <Image source={{ uri: effectivePhoto }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>Sin foto</Text>
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <AppButton label="Seleccionar foto" onPress={pickProfilePhoto} />
              <AppInput
                label="o URL de imagen"
                value={profilePhotoUrl}
                onChangeText={(v) => {
                  setProfilePhotoUrl(v);
                  if (v.trim().length > 0) setProfilePhotoUri(null);
                }}
                placeholder="https://..."
                error={touched ? errors.photo : undefined}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del perfil</Text>
          <AppInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Nombre público"
            autoCapitalize="words"
            error={touched ? errors.name : undefined}
          />
          <AppInput
            label="Descripción (100 caracteres)"
            value={description}
            onChangeText={(v) => setDescription(clamp100(v))}
            placeholder="Descripción breve"
            multiline
            maxLength={100}
            error={touched ? errors.description : undefined}
          />
          <Text style={styles.counter}>{description.length}/100</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación y categoría</Text>
          <SelectField
            label="Categoría (exacta para App 1)"
            value={category}
            placeholder="Selecciona"
            options={CATEGORIES}
            onChange={setCategory}
            error={touched ? errors.category : undefined}
          />
          <SelectField
            label="País"
            value={country}
            placeholder="Selecciona"
            options={COUNTRIES}
            onChange={setCountry}
            error={touched ? errors.country : undefined}
          />
          <SelectField
            label="Provincia/Estado"
            value={stateProvince}
            placeholder={country ? "Selecciona" : "Selecciona país primero"}
            options={stateOptions}
            onChange={setStateProvince}
            error={touched ? errors.state : undefined}
          />
          <Text style={styles.helper}>
            Para aparecer en App 1, el admin debe darte acceso (access_expires_at) y estos valores deben coincidir
            con los filtros.
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Redes sociales</Text>
          <AppInput
            label="WhatsApp"
            value={social.whatsapp}
            onChangeText={(v) => setSocial((s) => ({ ...s, whatsapp: v }))}
            placeholder="https://wa.me/..."
          />
          <AppInput
            label="Instagram"
            value={social.instagram}
            onChangeText={(v) => setSocial((s) => ({ ...s, instagram: v }))}
            placeholder="https://instagram.com/..."
          />
          <AppInput
            label="Facebook"
            value={social.facebook}
            onChangeText={(v) => setSocial((s) => ({ ...s, facebook: v }))}
            placeholder="https://facebook.com/..."
          />
          <AppInput
            label="Web"
            value={social.web}
            onChangeText={(v) => setSocial((s) => ({ ...s, web: v }))}
            placeholder="https://..."
          />
        </Card>

        <View style={styles.catalogHeader}>
          <Text style={styles.headerTitle}>Catálogo</Text>
          <Text style={styles.headerSubtitle}>5 carruseles. Agrega imágenes por URL o seleccionador.</Text>
        </View>

        {slots.map((slot, slotIndex) => (
          <Card key={slot.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{slot.title}</Text>
            <View style={styles.catalogControls}>
              <View style={styles.catalogControlsLeft}>
                <AppInput
                  label="Agregar URL"
                  value={slot.inputUrl}
                  onChangeText={(v) =>
                    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, inputUrl: v } : s)))
                  }
                  placeholder="https://..."
                />
              </View>
              <View style={styles.catalogControlsRight}>
                <AppButton label="Añadir URL" onPress={() => addCatalogUrl(slotIndex)} />
                <AppButton label="Seleccionar" variant="ghost" onPress={() => pickCatalogImage(slotIndex)} />
              </View>
            </View>

            {slot.images.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Sin imágenes aún</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
                {slot.images.map((uri, imageIndex) => (
                  <View key={`${slot.title}_${imageIndex}_${uri}`} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <Pressable
                      onPress={() => removeCatalogImage(slotIndex, imageIndex)}
                      style={styles.thumbRemove}
                      hitSlop={10}
                    >
                      <Text style={styles.thumbRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </Card>
        ))}

        <AppButton label="Guardar" onPress={submit} loading={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.paper },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  error: {
    fontSize: 12,
    color: Colors.primaryBright,
    fontWeight: "700",
  },
  inputError: {
    borderColor: Colors.primaryBright,
  },
  select: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.ink,
    flex: 1,
  },
  selectPlaceholder: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.inkMuted,
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.inkMuted,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  modalHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.ink,
    flex: 1,
  },
  modalClose: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.primary,
  },
  modalRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  modalRowActive: {
    backgroundColor: "rgba(224,0,0,0.08)",
  },
  modalRowText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.ink,
  },
  modalRowTextActive: {
    color: Colors.primary,
  },
  modalSep: {
    height: 1,
    backgroundColor: Colors.border,
  },
  header: {
    paddingTop: Spacing.md,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  catalogHeader: {
    paddingTop: 4,
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.ink,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  signOut: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
  },
  helper: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  savedPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  previewPhotoBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  previewPhoto: {
    width: "100%",
    height: "100%",
  } as ImageStyle,
  previewMeta: {
    flex: 1,
    gap: 6,
  },
  previewName: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.ink,
  },
  previewDesc: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  previewSmall: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoBox: {
    width: 112,
    height: 112,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    backgroundColor: Colors.surfaceMuted,
  },
  photo: {
    width: "100%",
    height: "100%",
  } as ImageStyle,
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
  photoActions: {
    flex: 1,
    gap: 12,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
  catalogControls: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  catalogControlsLeft: {
    flex: 1,
  },
  catalogControlsRight: {
    width: 130,
    gap: 10,
  },
  emptyBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.inkMuted,
  },
  carousel: {
    gap: 12,
    paddingVertical: 4,
  },
  thumbWrap: {
    width: 150,
    height: 110,
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  thumb: {
    width: "100%",
    height: "100%",
  } as ImageStyle,
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemoveText: {
    color: Colors.paper,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 18,
  },
});
