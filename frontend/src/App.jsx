import "./App.css"

const vendas = [
  { vendedor: "Ana", valor: 3500 },
  { vendedor: "Carlos", valor: 120 },
  { vendedor: "Ana", valor: 250 },
  { vendedor: "Joao", valor: 1200 },
  { vendedor: "Carlos", valor: 3800 },
  { vendedor: "Ana", valor: 150 },
  { vendedor: "Joao", valor: 300 },
  { vendedor: "Carlos", valor: 1400 },
  { vendedor: "Ana", valor: 3600 },
  { vendedor: "Joao", valor: 130 },
]

const formatBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function App() {
  const totalVendas = vendas.length
  const faturamento = vendas.reduce((total, venda) => total + venda.valor, 0)
  const ticketMedio = faturamento / totalVendas

  // Agrupa por vendedor para o ranking
  const porVendedor = Object.values(
    vendas.reduce((acc, venda) => {
      if (!acc[venda.vendedor]) {
        acc[venda.vendedor] = { vendedor: venda.vendedor, total: 0, qtd: 0 }
      }
      acc[venda.vendedor].total += venda.valor
      acc[venda.vendedor].qtd += 1
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const maiorTotal = porVendedor[0]?.total ?? 1

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-text">
          <span className="eyebrow">Relatório Comercial</span>
          <h1>Mini Sales Analytics</h1>
        </div>
        <div className="header-meta">
          <span>Período</span>
          <strong>Consolidado</strong>
        </div>
      </header>

      <section className="kpis">
        <div className="kpi">
          <span className="kpi-label">Vendas realizadas</span>
          <strong className="kpi-value">{totalVendas}</strong>
        </div>

        <div className="kpi kpi--primary">
          <span className="kpi-label">Faturamento total</span>
          <strong className="kpi-value">{formatBRL(faturamento)}</strong>
        </div>

        <div className="kpi">
          <span className="kpi-label">Ticket médio</span>
          <strong className="kpi-value">{formatBRL(ticketMedio)}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel ranking">
          <h2>Ranking por vendedor</h2>
          <ul className="ranking-list">
            {porVendedor.map((v) => (
              <li key={v.vendedor}>
                <div className="ranking-row">
                  <span className="ranking-name">{v.vendedor}</span>
                  <span className="ranking-value">{formatBRL(v.total)}</span>
                </div>
                <div className="ranking-bar-track">
                  <div
                    className="ranking-bar-fill"
                    style={{ width: `${(v.total / maiorTotal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel table-panel">
          <h2>Vendas detalhadas</h2>
          <table>
            <thead>
              <tr>
                <th>Vendedor</th>
                <th className="align-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda, index) => (
                <tr key={index}>
                  <td>{venda.vendedor}</td>
                  <td className="align-right">{formatBRL(venda.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default App