import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text


# Carrega as variáveis do arquivo .env
load_dotenv()


# =========================
# Configuração da API
# =========================

app = FastAPI(title="Mini Sales Pipeline API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Conexão com PostgreSQL
# =========================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não encontrada. Verifique o arquivo .env."
    )

engine = create_engine(DATABASE_URL)


# =========================
# Dashboard
# =========================

@app.get("/dashboard")
def dashboard():

    with engine.connect() as connection:

        # =========================
        # KPIs
        # =========================

        kpis = connection.execute(
            text("""
                SELECT
                    COUNT(*) AS total_vendas,
                    SUM(valor) AS faturamento_total,
                    AVG(valor) AS ticket_medio,
                    COUNT(DISTINCT vendedor) AS total_vendedores
                FROM vendas;
            """)
        ).mappings().one()


        # =========================
        # Faturamento por canal
        # =========================

        canais = connection.execute(
            text("""
                SELECT
                    canal,
                    SUM(valor) AS faturamento
                FROM vendas
                GROUP BY canal
                ORDER BY faturamento DESC;
            """)
        ).mappings().all()


        # =========================
        # Ranking cidade x canal
        # =========================

        ranking_cidades = connection.execute(
            text("""
                SELECT
                    ROW_NUMBER() OVER (
                        PARTITION BY canal
                        ORDER BY faturamento_total DESC
                    ) AS ranking,
                    cidade,
                    canal,
                    faturamento_total
                FROM (
                    SELECT
                        cidade,
                        canal,
                        SUM(valor) AS faturamento_total
                    FROM vendas
                    GROUP BY cidade, canal
                ) v
                ORDER BY canal, ranking;
            """)
        ).mappings().all()


        # =========================
        # Vendas por dia
        # =========================

        vendas_por_dia = connection.execute(
            text("""
                SELECT
                    data_venda,
                    COUNT(*) AS quantidade,
                    SUM(valor) AS faturamento
                FROM vendas
                GROUP BY data_venda
                ORDER BY data_venda;
            """)
        ).mappings().all()


        # =========================
        # Ranking vendedores
        # =========================

        vendedores = connection.execute(
            text("""
                SELECT
                    vendedor,
                    SUM(valor) AS faturamento
                FROM vendas
                GROUP BY vendedor
                ORDER BY faturamento DESC;
            """)
        ).mappings().all()


        # =========================
        # Vendas por produto
        # =========================

        produtos = connection.execute(
            text("""
                SELECT
                    produto,
                    SUM(valor) AS faturamento
                FROM vendas
                GROUP BY produto
                ORDER BY faturamento DESC;
            """)
        ).mappings().all()


    # =========================
    # Resposta da API
    # =========================

    return {
        "kpis": dict(kpis),
        "faturamento_por_canal": [
            dict(row) for row in canais
        ],
        "ranking_cidades": [
            dict(row) for row in ranking_cidades
        ],
        "vendas_por_dia": [
            dict(row) for row in vendas_por_dia
        ],
        "ranking_vendedores": [
            dict(row) for row in vendedores
        ],
        "vendas_por_produto": [
            dict(row) for row in produtos
        ],
    }