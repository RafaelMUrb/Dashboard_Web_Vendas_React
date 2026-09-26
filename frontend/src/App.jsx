import { useEffect, useState } from "react"
import "./App.css"

const API_URL = "http://localhost:8000/dashboard"

const formatBRL = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatBRLCompact = (v) => {
  const n = Number(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`
  return formatBRL(n)
}

// Rótulo curto pra caber em cima de cada ponto/barra (sem "R$", só o número)
const formatCompactValue = (v) => {
  const n = Number(v)
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n)}`
}

const formatDia = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })

const CANAL_COLORS = {
  Online: "#c9a24b",
  Marketplace: "#4f8fae",
  Loja: "#8b5fbf",
}
const canalColor = (canal, i) =>
  CANAL_COLORS[canal] ?? ["#c9a24b", "#4f8fae", "#8b5fbf", "#c9714f"][i % 4]

// Gráfico de linha do faturamento diário. O valor de cada dia aparece
// como rótulo em cima do próprio ponto.
function RevenueLine({ data }) {
  const width = 960
  const height = 200
  const padTop = 30
  const padBottom = 10
  const padSide = 16

  const valores = data.map((d) => Number(d.faturamento))
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x =
      padSide + (i / Math.max(data.length - 1, 1)) * (width - padSide * 2)
    const y =
      padTop +
      (height - padTop - padBottom) -
      ((Number(d.faturamento) - min) / range) * (height - padTop - padBottom)
    return { x, y, d }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")

  const baseline = height - padBottom
  const areaPath =
    `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline} ` +
    `L${points[0].x.toFixed(1)},${baseline} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="line-chart"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.3, 0.65].map((f) => (
        <line
          key={f}
          x1={padSide}
          x2={width - padSide}
          y1={padTop + f * (height - padTop - padBottom)}
          y2={padTop + f * (height - padTop - padBottom)}
          className="grid-line"
        />
      ))}

      <path d={areaPath} fill="url(#areaFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

      {points.map(({ x, y, d }, i) => {
        const label = formatCompactValue(d.faturamento)
        const pillWidth = Math.max(24, label.length * 6.4 + 8)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" className="line-point" />
            <g transform={`translate(${x}, ${y - 18})`}>
              <rect
                x={-pillWidth / 2}
                y={-9}
                width={pillWidth}
                height={16}
                rx={8}
                className="point-label-bg"
              />
              <text textAnchor="middle" dy="3" className="point-label">
                {label}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

// Gráfico de barras com a quantidade de vendas por dia — a altura da
// barra é a própria quantidade, então não tem leitura ambígua. O eixo
// com as datas fica aqui embaixo e serve para os dois gráficos, já que
// os dois usam a mesma escala horizontal (um dia embaixo do outro).
function QuantityBars({ data }) {
  const width = 960
  const height = 130
  const padTop = 22
  const padBottom = 46
  const padSide = 16

  const max = Math.max(...data.map((d) => Number(d.quantidade)), 1)
  const bandWidth = (width - padSide * 2) / data.length
  const barWidth = Math.min(20, bandWidth * 0.55)
  const baseline = height - padBottom

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="bar-chart"
      preserveAspectRatio="none"
    >
      <line x1={padSide} x2={width - padSide} y1={baseline} y2={baseline} className="grid-line" />

      {data.map((d, i) => {
        const cx = padSide + bandWidth * (i + 0.5)
        const qty = Number(d.quantidade)
        const barHeight = ((height - padTop - padBottom) * qty) / max
        const y = baseline - barHeight

        return (
          <g key={i}>
            <rect
              x={cx - barWidth / 2}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={3}
              className="bar-rect"
            />
            <text x={cx} y={y - 6} textAnchor="middle" className="bar-value">
              {qty}
            </text>
            <text
              x={cx}
              y={baseline + 16}
              textAnchor="end"
              className="axis-label"
              transform={`rotate(-55 ${cx} ${baseline + 16})`}
            >
              {formatDia(d.data_venda)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function BarList({ items, labelKey, valueKey, colorFn }) {
  const max = Math.max(...items.map((i) => Number(i[valueKey])), 1)
  return (
    <ul className="ranking-list">
      {items.map((item, i) => (
        <li key={item[labelKey]}>
          <div className="ranking-row">
            <span className="ranking-name">{item[labelKey]}</span>
            <span className="ranking-value">{formatBRL(item[valueKey])}</span>
          </div>
          <div className="ranking-bar-track">
            <div
              className="ranking-bar-fill"
              style={{
                width: `${(Number(item[valueKey]) / max) * 100}%`,
                background: colorFn ? colorFn(item, i) : undefined,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(setDashboard)
      .catch((error) => {
        console.error("Erro ao buscar dashboard:", error)
        setErro("Não foi possível carregar os dados do servidor.")
      })
  }, [])

  if (erro) {
    return (
      <div className="dashboard state-screen">
        <p className="state-message">{erro}</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="dashboard state-screen">
        <p className="state-message">Carregando dashboard…</p>
      </div>
    )
  }

  const { kpis, faturamento_por_canal, ranking_cidades, vendas_por_dia, ranking_vendedores, vendas_por_produto } =
    dashboard

  const cidadesPorCanal = ranking_cidades.reduce((acc, row) => {
    if (!acc[row.canal]) acc[row.canal] = []
    acc[row.canal].push(row)
    return acc
  }, {})

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

      <section className="kpis kpis-4">
        <div className="kpi">
          <span className="kpi-label">Vendas realizadas</span>
          <strong className="kpi-value">{kpis.total_vendas}</strong>
        </div>

        <div className="kpi kpi--primary">
          <span className="kpi-label">Faturamento total</span>
          <strong className="kpi-value">{formatBRL(kpis.faturamento_total)}</strong>
        </div>

        <div className="kpi">
          <span className="kpi-label">Ticket médio</span>
          <strong className="kpi-value">{formatBRL(kpis.ticket_medio)}</strong>
        </div>

        <div className="kpi">
          <span className="kpi-label">Vendedores ativos</span>
          <strong className="kpi-value">{kpis.total_vendedores}</strong>
        </div>
      </section>

      <div className="main-grid">
        <section className="content-grid row-chart">
          <div className="panel panel-wide">
            <h2>Faturamento diário</h2>
            <p className="panel-subtitle">Valor no ponto = faturamento · barras abaixo = quantidade de vendas</p>
            <div className="chart-stack">
              <div className="chart-frame chart-frame--line">
                <RevenueLine data={vendas_por_dia} />
              </div>
              <div className="chart-frame chart-frame--bars">
                <QuantityBars data={vendas_por_dia} />
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Faturamento por canal</h2>
            <div className="panel-body">
              <BarList
                items={faturamento_por_canal}
                labelKey="canal"
                valueKey="faturamento"
                colorFn={(item, i) => canalColor(item.canal, i)}
              />
            </div>
          </div>
        </section>

        <section className="content-grid row-lists">
          <div className="panel">
            <h2>Ranking de vendedores</h2>
            <div className="panel-body">
              <BarList items={ranking_vendedores} labelKey="vendedor" valueKey="faturamento" />
            </div>
          </div>

          <div className="panel">
            <h2>Vendas por produto</h2>
            <div className="panel-body">
              <BarList items={vendas_por_produto} labelKey="produto" valueKey="faturamento" />
            </div>
          </div>

          <div className="panel">
            <h2>Ranking de cidades por canal</h2>
            <div className="panel-body">
              <div className="cidades-grid">
                {Object.entries(cidadesPorCanal).map(([canal, cidades]) => (
                  <div key={canal} className="cidade-col">
                    <div className="cidade-col-header">
                      <span className="canal-dot" style={{ background: canalColor(canal) }} />
                      {canal}
                    </div>
                    <table>
                      <tbody>
                        {cidades.map((c) => (
                          <tr key={c.cidade}>
                            <td className="rank-number">{c.ranking}</td>
                            <td>{c.cidade}</td>
                            <td className="align-right">{formatBRLCompact(c.faturamento_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App