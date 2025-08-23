# 📦 Parcial I – Patrones Arquitectónicos Avanzados

Este repositorio contiene la solución al **Parcial I de Patrones Arquitectónicos Avanzados**, cuyo objetivo es **diseñar e implementar el despliegue completo de una aplicación de gestión de pedidos** compuesta por base de datos, backend y frontend, utilizando **Helm** para empaquetar e **ArgoCD** para la entrega continua (**GitOps**).

---

## 📐 Arquitectura de la aplicación

La aplicación implementa un **sistema de gestión de pedidos** compuesto por:

- **Base de datos**: PostgreSQL (chart oficial de Bitnami).  
- **Backend**: API en **Java Spring Boot**, expuesta como servicio interno y conectada a PostgreSQL.  
- **Frontend**: Aplicación en **HTML estático**, desplegada en un contenedor Nginx y expuesta vía Ingress.  

El despliegue se gestiona en Kubernetes con la siguiente estructura:

```
charts/
 └── pedido-app/
      ├── Chart.yaml
      ├── values.yaml
      ├── values-dev.yaml
      ├── values-prod.yaml
      ├── charts/
      │    ├── db/        -> PostgreSQL
      │    ├── backend/   -> API Spring Boot
      │    └── frontend/  -> HTML estático en Nginx
environments/
 ├── dev/
 │    └── application.yaml   -> Definición ArgoCD para entorno dev
 └── prod/
      └── application.yaml   -> Definición ArgoCD para entorno prod
```

---

## ⚙️ Recursos Kubernetes implementados

Cada subchart define los recursos necesarios para su despliegue en el clúster:

- **Backend (Spring Boot)**
  - `Deployment` con réplicas configurables.
  - `Service` tipo `ClusterIP`.
  - `ConfigMap` para configuración no sensible (ej: URL DB).
  - `Secret` para credenciales seguras de la base de datos.
  - `HorizontalPodAutoscaler`.

- **Frontend (HTML en Nginx)**  
  - `Deployment` con el contenedor de Nginx sirviendo los archivos HTML.  
  - `Service` tipo `NodePort` o `ClusterIP`.  
  - `Ingress` en la ruta `/`.

- **Base de Datos (PostgreSQL)**  
  - Chart de **Bitnami PostgreSQL** como dependencia.  
  - `PersistentVolumeClaim` para garantizar persistencia de datos.  

- **Ingress Controller**  
  - Ruteo de endpoints:  
    - `/api/*` → backend  
    - `/` → frontend  

---

## 🚀 Instalación manual con Helm

### 1. Clonar el repositorio
```bash
git clone https://github.com/JuanGomePer/parcial1-patrones-arquitectonicos-avanzados.git
cd parcial1-patrones-arquitectonicos-avanzados/charts/pedido-app
```

### 2. Instalar en entorno **dev**
```bash
helm install pedido-app-dev . -f values-dev.yaml -n dev --create-namespace
```

### 3. Instalar en entorno **prod**
```bash
helm install pedido-app-prod . -f values-prod.yaml -n prod --create-namespace
```

### 4. Verificar recursos
```bash
kubectl get pods -n dev
kubectl get pods -n prod
kubectl get ingress -A
```

---

## 🔄 Integración con ArgoCD (GitOps)

Este repositorio incluye configuraciones para **ArgoCD**, lo que permite que cada cambio en `values-dev.yaml` o `values-prod.yaml` se sincronice automáticamente en el clúster.

1. **Registrar el repositorio en ArgoCD**  
   En la interfaz de ArgoCD, agregar este repositorio Git.

2. **Aplicar Application de ArgoCD**  
   ```bash
   kubectl apply -f environments/dev/application.yaml
   kubectl apply -f environments/prod/application.yaml
   ```

3. **Sincronización automática**  
   Cada cambio en los archivos de configuración (`values.yaml`) será detectado por ArgoCD, que actualizará los recursos en Kubernetes sin necesidad de ejecutar comandos manuales.

---

## 🌐 Endpoints de acceso

Una vez desplegada la aplicación y configurado el Ingress:

- **Frontend (HTML estático en Nginx)** → `/`  
- **Backend API (Spring Boot)** → `/api/*`  

(Dependiendo del entorno y configuración del host en el Ingress Controller).

---

## ✅ Buenas prácticas aplicadas

- Separación clara de entornos (`dev` y `prod`).  
- Uso de **charts oficiales** (Bitnami PostgreSQL).  
- Manejo seguro de credenciales vía **Secrets**.  
- Persistencia de datos en PostgreSQL mediante **PVC**.  
- Configuración de **resources.limits** y **resources.requests**.  
- Automatización completa con enfoque **GitOps** usando ArgoCD.  
