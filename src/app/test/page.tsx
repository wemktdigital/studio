export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste da Aplicação</h1>
      <p>Se você está vendo esta página, a aplicação está funcionando!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
