# Parcial I – Patrones Arquitectónicos Avanzados

Este repositorio presenta la solución al **Parcial I de Patrones Arquitectónicos Avanzados**, cuyo objetivo fue **diseñar e implementar el despliegue completo de una aplicación monolítica de gestión de pedidos** con separación de entornos **dev** y **prod**.

La aplicación integra:

- **Backend y Frontend**: monolito en **Node.js/Express**, que expone APIs REST (`patrones/api/*`) y sirve frontend estático (`/patrones`).
- **Base de datos**: **PostgreSQL** desplegado en Kubernetes con persistencia.
- **Infraestructura**: Kubernetes + Helm + ArgoCD (GitOps).
- **CI/CD**: GitHub Actions que automatizan build, empaquetado y publicación de charts en GitHub Pages.
- **Separación de entornos**: Dev y Prod, cada uno con su `values.yaml` y su `Application` en ArgoCD.

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
   - Ingress NGINX expone:
     - **Prod** en `/patrones`.
     - **Dev** en `/patrones-dev`.

4. **Helm**
   - Chart definido en `charts/patrones`.
   - Templates parametrizados: despliegue app, postgres, service, ingress, pvc, secrets, hpa.
   - `values.yaml` (prod) y `values-dev.yaml` (dev) controlan imagen, puertos, recursos y credenciales.

5. **ArgoCD (GitOps)**
   - Dos `Application`:
     - `patrones` (prod) → namespace `default`.
     - `patrones-dev` (dev) → namespace `patrones-dev`.
   - Ambas sincronizan desde el repo Helm (`https://juangomeper.github.io/helm-chart/`).
   - Sync automático con `prune` y `selfHeal`.

6. **CI/CD (GitHub Actions)**
   - **Branch `main` (Prod)**:
     - Publica imágenes Docker con tags `1.0.X`.
     - Empaqueta charts con versiones `1.0.X`.
   - **Branch `dev` (Dev)**:
     - Publica imágenes Docker con tags `1.0.X-dev`.
     - Empaqueta charts con versiones `1.0.X-dev`.
   - ArgoCD detecta el cambio y sincroniza automáticamente en cada entorno.

---

## Estructura de repositorios

### **Repo App**
Código fuente, Dockerfile y workflow de CI/CD.
```
/public/index.html
/sql/schema.sql
server.js
db.js
Dockerfile
docker-compose.yml
.github/workflows/docker-build.yaml
```

### **Repo de manifiestos / chart**
```
charts/patrones/
  Chart.yaml
  values.yaml
  values-dev.yaml
  templates/
    app-argocd.yaml
    app-argocd-dev.yaml
    patrones-despliegue-1.yaml
    patrones-services.yaml
    patrones-ingress.yaml
    patrones-hpa.yaml
    postgres-deployment.yaml
    postgres-secret.yaml
    postgres-pvc.yaml
    postgres-services.yaml
```

### **Repo Helm (GitHub Pages)**
Publica paquetes y `index.yaml`.
```
index.yaml
patrones-1.0.41.tgz
patrones-1.0.42.tgz
patrones-1.0.43-dev.tgz
patrones-1.0.44-dev.tgz
patrones-1.0.45-dev.tgz
patrones-1.0.52.tgz
patrones-1.0.54-dev.tgz
...
```

---

## Instalación manual con Helm

### **Prod**
```bash
helm repo add juangomeper https://juangomeper.github.io/helm-chart/
helm repo update
helm install patrones juangomeper/patrones   --version 1.0.52   -f values.yaml   -n default --create-namespace
```

### **Dev**
```bash
helm repo add juangomeper https://juangomeper.github.io/helm-chart/
helm repo update
helm install patrones-dev juangomeper/patrones   --version 1.0.54-dev   -f values-dev.yaml   -n patrones-dev --create-namespace
```

---

## Configuración en ArgoCD

### **Prod (`app-argocd.yaml`)**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: patrones
  namespace: argocd
spec:
  project: default
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  source:
    repoURL: https://juangomeper.github.io/helm-chart/
    chart: patrones
    targetRevision: "*"
    helm:
      valueFiles:
        - values.yaml
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### **Dev (`app-argocd-dev.yaml`)**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: patrones-dev
  namespace: argocd
spec:
  destination:
    server: https://kubernetes.default.svc
    namespace: patrones-dev
  project: default
  source:
    repoURL: https://juangomeper.github.io/helm-chart/
    chart: patrones
    targetRevision: "*-dev"
    helm:
      valueFiles:
        - values.yaml
        - values-dev.yaml
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

---

## Endpoints de acceso

Suponiendo `http://<EXTERNAL-IP>`:

- **Prod**
  - Frontend → `/patrones`
  - Healthcheck → `/patrones/health`
  - API Usuarios → `/patrones/api/users`
  - API Productos → `/patrones/api/products`
  - API Pedidos → `/patrones/api/orders`

- **Dev**
  - Frontend → `/patrones-dev`
  - Healthcheck → `/patrones-dev/health`
  - API Usuarios → `/patrones-dev/api/users`
  - API Productos → `/patrones-dev/api/products`
  - API Pedidos → `/patrones-dev/api/orders`

---

## Buenas prácticas aplicadas

- Uso de **Secrets** para credenciales.
- **PVC** para datos persistentes de PostgreSQL.
- Definición de `requests` y `limits` en pods.
- **Probes** (`startup`, `readiness`) para salud de la app.
- **Autoscaling** con HPA (CPU).
- Automatización total con **CI/CD + GitOps (ArgoCD)**.
- **Separación de entornos** (`dev` y `prod`) con values dedicados.

---