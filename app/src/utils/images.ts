import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

export async function pickImageFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    allowsEditing: true,
  });

  if (result.canceled) return null;
  const asset = result.assets?.[0];
  const uri = asset?.uri ?? null;
  if (!uri) return null;

  if (uri.startsWith("content://")) {
    const fileName = asset?.fileName ?? `picked-${Date.now()}.jpg`;
    const ext = (fileName.split(".").pop() ?? "jpg").toLowerCase();
    const to = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") + `picked-${Date.now()}.${ext}`;
    if (!to) return uri;
    await FileSystem.copyAsync({ from: uri, to });
    return to;
  }

  return uri;
}

export function looksLikeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://");
}
