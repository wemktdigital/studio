import MainLayout from '@/components/slack/main-layout'

export default async function ChannelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string; channelId: string }>
}) {
  const resolvedParams = await params
  console.log('🔍 ChannelLayout: Params:', resolvedParams);
  
  return (
    <MainLayout workspaceId={resolvedParams.workspaceId} channelId={resolvedParams.channelId}>
      {children}
    </MainLayout>
  )
}
