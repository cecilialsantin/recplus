# utils/chat_parser.py

import re

def parsear_chat_loyal(contenido_txt: str) -> dict:
    """
    Extrae información relevante desde un archivo de chat (formato Whaticket),
    para estructurarla como reclamo a automatizar en Loyal.

    :param contenido_txt: Contenido plano del archivo .txt
    :return: Diccionario con campos claves: cliente, contacto, resumen y chat_completo
    """

    resultado = {
        "cliente": None,
        "contacto": None,
        "resumen": None,
        "chat_completo": contenido_txt.strip()
    }

    # 🧠 Heurísticas simples (ajustables)
    cliente_match = re.search(r"cliente\s*[:\-]\s*(.+)", contenido_txt, re.IGNORECASE)
    contacto_match = re.search(r"(tel[eéfono]*|cel[uular]*|whatsapp)\s*[:\-]?\s*(\+?\d+)", contenido_txt, re.IGNORECASE)
    resumen_match = re.search(r"(motivo|problema|consulta|reclamo)\s*[:\-]\s*(.+)", contenido_txt, re.IGNORECASE)

    if cliente_match:
        resultado["cliente"] = cliente_match.group(1).strip()

    if contacto_match:
        resultado["contacto"] = contacto_match.group(2).strip()

    if resumen_match:
        resultado["resumen"] = resumen_match.group(2).strip()

    return resultado