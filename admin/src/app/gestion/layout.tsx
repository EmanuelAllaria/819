import { AdminShell } from "@/components/AdminShell";

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell title="Gestión de datos">{children}</AdminShell>;
}

