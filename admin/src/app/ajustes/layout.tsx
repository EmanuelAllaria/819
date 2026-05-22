import { AdminShell } from "@/components/AdminShell";

export default function AjustesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell title="Ajustes de acceso">{children}</AdminShell>;
}

