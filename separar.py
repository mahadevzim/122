import re

def extrair_dados_linha(linha):
    cnpj_match = re.search(r'CNPJ:\s*([\d]+)', linha)
    razao_match = re.search(r'RAZÃO SOCIAL:\s*(.*?)\s*\|', linha)
    telefone_match = re.search(r'Telefone:\s*(\d+)', linha)

    if cnpj_match and razao_match and telefone_match:
        cnpj = cnpj_match.group(1).strip()
        razao = razao_match.group(1).strip()
        telefone = telefone_match.group(1).strip()
        return f"{cnpj},{razao},{telefone}"
    return None

def processar_arquivo(nome_arquivo):
    linhas_saida = []
    with open(nome_arquivo, "r", encoding="utf-8") as f:
        for linha in f:
            resultado = extrair_dados_linha(linha)
            if resultado:
                linhas_saida.append(resultado)

    with open(nome_arquivo, "w", encoding="utf-8") as f:
        for linha in linhas_saida:
            f.write(linha + "\n")

# Use o nome do arquivo .txt
processar_arquivo("lista.txt")
