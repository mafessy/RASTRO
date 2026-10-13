"""
migrar_mysql_para_supabase.py — copia os dados do MySQL (Railway) para o
Postgres (Supabase), usando os próprios models do RASTRO.

Coloque este arquivo na raiz do projeto (ao lado de models.py) e rode:

    export SRC_URL="mysql+pymysql://USUARIO:SENHA@HOST:PORTA/BANCO?charset=utf8mb4"
    export DST_URL="postgresql://postgres.xxxx:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres"

    python migrar_mysql_para_supabase.py          # só mostra o plano (nada é gravado)
    python migrar_mysql_para_supabase.py --run    # executa a migração

O que ele faz:
  1. conta as linhas de cada tabela na origem;
  2. cria as tabelas no destino a partir do models.py (db.metadata.create_all);
  3. recusa continuar se o destino já tiver dados (evita duplicar);
  4. copia tudo em UMA transação (ou migra tudo, ou não migra nada),
     respeitando a ordem das chaves estrangeiras e mantendo os mesmos ids;
  5. acerta as sequences do Postgres (senão o próximo INSERT dá erro de id duplicado);
  6. confere as contagens origem x destino.

Senhas com caracteres especiais (@ : / # ?) precisam ser codificadas na URL
(ex.: @ vira %40).
"""

import argparse
import os
import sys

from sqlalchemy import create_engine, func, select, text

from models import db

BATCH = 500


def normalizar_destino(url):
    """Supabase entrega 'postgresql://...'; o SQLAlchemy precisa do driver explícito."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


def contar(conn, tabelas):
    return {t.name: conn.execute(select(func.count()).select_from(t)).scalar() for t in tabelas}


def acertar_sequences(conn, tabelas):
    for t in tabelas:
        pk = list(t.primary_key.columns)
        if len(pk) != 1 or pk[0].type.python_type is not int:
            continue
        col, tab = pk[0].name, t.name
        conn.execute(text(
            f'SELECT setval(pg_get_serial_sequence(\'"{tab}"\', \'{col}\'), '
            f'COALESCE(MAX("{col}"), 1), MAX("{col}") IS NOT NULL) FROM "{tab}"'
        ))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true", help="executa de verdade")
    args = ap.parse_args()

    src_url, dst_url = os.environ.get("SRC_URL"), os.environ.get("DST_URL")
    if not src_url or not dst_url:
        sys.exit("Defina SRC_URL (MySQL) e DST_URL (Postgres/Supabase).")

    src = create_engine(src_url, pool_pre_ping=True)
    dst = create_engine(normalizar_destino(dst_url), pool_pre_ping=True)
    tabelas = db.metadata.sorted_tables  # pais antes dos filhos

    with src.connect() as s:
        origem = contar(s, tabelas)

    print("Plano de migração (origem):")
    for nome, n in origem.items():
        print(f"  {nome:28s} {n:>8d} linhas")

    if not args.run:
        print("\nNada foi gravado. Rode com --run para migrar.")
        return

    db.metadata.create_all(dst)

    with dst.connect() as d:
        ocupadas = [nome for nome, n in contar(d, tabelas).items() if n]
    if ocupadas:
        sys.exit(f"O destino já tem dados em: {', '.join(ocupadas)}. Esvazie antes de rodar.")

    with src.connect() as s, dst.begin() as d:
        for t in tabelas:
            resultado = s.execute(select(t).execution_options(stream_results=True)).mappings()
            total = 0
            while True:
                lote = resultado.fetchmany(BATCH)
                if not lote:
                    break
                d.execute(t.insert(), [dict(r) for r in lote])
                total += len(lote)
            print(f"  copiada {t.name:28s} {total:>8d}")

        if d.dialect.name == "postgresql":
            acertar_sequences(d, tabelas)
            print("  sequences acertadas")

    with dst.connect() as d:
        destino = contar(d, tabelas)

    divergentes = [n for n in origem if origem[n] != destino[n]]
    if divergentes:
        sys.exit(f"ATENÇÃO: contagens diferentes em: {', '.join(divergentes)}")
    print("\nOK: todas as tabelas conferem (origem == destino).")


if __name__ == "__main__":
    main()
