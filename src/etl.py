import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv("data/vendas.csv")


print("Dados Carregados")
print(df)

engine = create_engine(
    "postgresql+psycopg2://rafael:postgres123@localhost:5432/datawarehouse"
)

df.to_sql(
    "vendas",
    engine,
    schema = "public",
    if_exists = "replace",
    index = False
)

print("\n Dados enviados ao PostgresSQL")