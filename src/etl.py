import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine


# Carrega as variáveis do arquivo .env
load_dotenv()


# =========================
# Carrega os dados
# =========================

df = pd.read_csv("data/vendas.csv")

print("Dados carregados:")
print(df)


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
# Envia os dados para o PostgreSQL
# =========================

df.to_sql(
    "vendas",
    engine,
    schema="public",
    if_exists="replace",
    index=False,
)


print("\n✅ Dados enviados ao PostgreSQL!")