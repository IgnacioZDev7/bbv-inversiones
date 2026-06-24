from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Pagina igual que el PageNumberPagination por defecto, pero respeta
    el ?page_size=N que ya envían los clientes del frontend (antes se
    ignoraba silenciosamente y siempre paginaba de 10 en 10)."""

    page_size_query_param = "page_size"
    max_page_size = 500
