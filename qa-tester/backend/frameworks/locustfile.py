from locust import HttpUser, task, between


class BBVUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def list_empresas(self):
        self.client.get("/api/empresas/", name="GET /empresas/")

    @task(2)
    def list_reportes(self):
        self.client.get("/api/reportes/?page_size=10", name="GET /reportes/")

    @task(1)
    def get_indicadores(self):
        self.client.get("/api/indicadores/", name="GET /indicadores/")
