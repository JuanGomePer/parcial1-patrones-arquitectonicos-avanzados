# 📦 Parcial I – Patrones Arquitectónicos Avanzados

Este repositorio presenta la solución al **Parcial I de Patrones Arquitectónicos Avanzados**, cuyo objetivo fue **diseñar e implementar el despliegue completo de una aplicación monolítica de gestión de pedidos**.  

La aplicación integra:

- **Backend y Frontend**: monolito en **Node.js/Express**, que expone APIs REST (`/api/*`) y sirve frontend estático (`/public`).
- **Base de datos**: **PostgreSQL** desplegado en Kubernetes con persistencia.
- **Infraestructura**: Kubernetes + Helm + ArgoCD (GitOps).
- **CI/CD**: GitHub Actions que automatizan build, empaquetado y publicación de charts.

---

## Arquitectura general

1. **Aplicación (monolito Node.js)**  
   - API: usuarios, productos y pedidos.  
   - Frontend: servido desde el mismo contenedor (estáticos).  
   - Healthcheck: `/health`.  

2. **Base de datos (PostgreSQL)**  
   - `Deployment` + `Service` (`postgres-service`).  
   - Variables sensibles en `Secret` (`postgres-secret`).  
   - Persistencia en `PVC` (`postgres-pvc`).  

3. **Kubernetes**  
   - Recursos: `Deployment`, `Service`, `Ingress`, `Secret`, `PVC`, `HPA`.  
   - Escalabilidad automática con `HorizontalPodAutoscaler`.  
   - Ingress NGINX expone la app en la ruta base `/patrones`.  

4. **Helm**  
   - Chart definido en `charts/patrones`.  
   - Templates parametrizados: despliegue app, postgres, service, ingress, pvc, secrets, hpa.  
   - `values.yaml` controla imagen, puertos, recursos y credenciales.  

5. **ArgoCD (GitOps)**  
   - Lee los releases Helm desde GitHub Pages (`helm-chart`).  
   - Aplica sincronización automática en el cluster.  

6. **CI/CD (GitHub Actions)**  
   - Compila y publica imagen Docker en DockerHub.  
   - Actualiza `values.yaml` y `Chart.yaml`.  
   - Empaqueta chart (`.tgz`) y lo publica en GitHub Pages (`helm repo`).  
   - ArgoCD detecta nueva versión y despliega.  

---

## Estructura de repositorios

- **App (este repo)**  
  Código fuente, Dockerfile y workflow de CI/CD.
  ```
  /public/index.html
  /sql/schema.sql
  server.js
  db.js
  Dockerfile
  .github/workflows/docker-build.yaml
  ```

- **Repo de manifiestos / chart**  
  ```
  charts/patrones/
    Chart.yaml
    values.yaml
    templates/
      patrones-despliegue-1.yaml
      patrones-services.yaml
      patrones-ingress.yaml
      postgres-deployment.yaml
      postgres-secret.yaml
      postgres-pvc.yaml
  app-argocd.yaml
  ```

- **Repo Helm (GitHub Pages)**  
  Publica paquetes y `index.yaml`.
  ```
  index.yaml
  patrones-1.0.37.tgz
  patrones-1.0.38.tgz
  patrones-1.0.39.tgz
  patrones-1.0.40.tgz
  patrones-1.0.41.tgz
  ```

---

## Recursos Kubernetes implementados

- **App Node.js**
  - `Deployment` (con probes en `/health`).
  - `Service` tipo ClusterIP.
  - `HPA` basado en CPU (requiere `metrics-server`).
  - `Ingress` expone `/patrones`, `/patrones/api/*`, `/patrones/health`.

- **PostgreSQL**
  - `Deployment` + `Service` (`postgres-service`).
  - `Secret`: usuario, password y nombre BD.
  - `PVC`: persistencia de 1Gi.

- **ArgoCD**
  - `Application` (`app-argocd.yaml`) apunta al repo Helm.  
  - `syncPolicy`: automático, con prune y selfHeal.

---

## Flujo CI/CD

1. Push a `main` en repo de la app.  
2. Workflow de GitHub Actions:
   - Build + push Docker image.  
   - Actualiza chart (`values.yaml`, `Chart.yaml`).  
   - Empaqueta y publica chart en GitHub Pages.  
3. ArgoCD detecta nueva versión y sincroniza en el cluster.  

> **Resultado**: despliegue automático sin intervención manual.

---

## Comandos útiles

### Helm
```bash
helm repo add juangomeper https://juangomeper.github.io/helm-chart/
helm repo update
helm search repo juangomeper/patrones
helm upgrade --install mi-release juangomeper/patrones -n default --create-namespace
```

### kubectl
```bash
kubectl get pods,svc,ingress,hpa
kubectl describe deployment patrones
kubectl logs <pod>
kubectl top pods
```

### Conexión a PostgreSQL
```bash
kubectl run psql-client --rm -it --image=postgres:15 --restart=Never --   psql -h postgres-service -U postgres -d pedidosdb
```

---

## Endpoints de la aplicación

> Suponiendo `http://<EXTERNAL-IP>/patrones`

- **Frontend** → `/patrones`  
- **Healthcheck** → `/patrones/health`  
- **Usuarios**  
  - `GET  /patrones/api/users`  
  - `POST /patrones/api/users`  
- **Productos**  
  - `GET  /patrones/api/products`  
  - `POST /patrones/api/products`  
  - `PUT  /patrones/api/products/:id`  
  - `DELETE /patrones/api/products/:id`  
- **Pedidos**  
  - `GET  /patrones/api/orders`  
  - `POST /patrones/api/orders`

---

## Buenas prácticas aplicadas

- Uso de **Secrets** para credenciales.  
- **PVC** para datos persistentes de PostgreSQL.  
- Definición de `requests` y `limits` en pods.  
- **Probes** (`startup`, `readiness`) para salud de la app.  
- **Autoscaling** con HPA (CPU).  
- Automatización total con **CI/CD + GitOps (ArgoCD)**.  

---

## Pendientes por implementar

- **Separación de entornos** (dev/prod) con `values-dev.yaml` / `values-prod.yaml`.  
- **Observabilidad** más robusta (dashboards, logs centralizados).  
- **Tests automáticos** en CI.  
