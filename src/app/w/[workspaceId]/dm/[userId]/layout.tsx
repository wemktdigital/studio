import MainLayout from '@/components/slack/main-layout'

export default async function DirectMessageLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string; userId: string }>
}) {
  const resolvedParams = await params
  
  return (
    <MainLayout workspaceId={resolvedParams.workspaceId}>
      {children}
    </MainLayout>
  )
}
