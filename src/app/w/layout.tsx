import { AuthGuard } from '@/components/auth/auth-guard'

export default function WorkspaceRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>
}
