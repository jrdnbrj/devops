
# DevOps Microservice

## Descripción

Este proyecto consiste en un microservicio desarrollado en **Node.js** con **TypeScript**, el cual está containerizado y puede ser desplegado en Kubernetes. El microservicio expone un endpoint REST `/DevOps` protegido por un **API Key** y un **JWT** que se verifica por cada transacción. 

El proyecto incluye:
- **Infraestructura como código (IaC)** con Kubernetes y archivos de configuración YAML.
- **Pruebas automáticas** utilizando **Jest**.
- **Pipeline de CI/CD** para construir, probar y desplegar automáticamente el servicio.
- Uso de buenas prácticas como **Clean Code** y **TDD** (Desarrollo dirigido por pruebas).

## Características

- **Endpoint**: `/DevOps` (HTTP POST)
  - JSON Request:
    ```json
    {
      "message": "This is a test",
      "to": "Juan Perez",
      "from": "Rita Asturia",
      "timeToLifeSec": 45
    }
    ```
  - JSON Response:
    ```json
    {
      "message": "Hello Juan Perez your message will be send"
    }
    ```

- **Autenticación**:
  - El endpoint está protegido por un **API Key** (cabecera `X-Parse-REST-API-Key`) y un **JWT** único por transacción (cabecera `X-JWT-KWY`).

- **Pruebas**:
  - Pruebas unitarias y de integración implementadas usando **Jest**.
  - Las pruebas verifican la funcionalidad de los middlewares, rutas y servicios.

- **Pipeline de CI/CD**:
  - Configurado en GitHub Actions para construir y probar el microservicio.
  - El despliegue se realiza en un clúster de Kubernetes utilizando **DigitalOcean Kubernetes** y **Docker** para la containerización.

## Estructura del Proyecto

```bash
├── .github/workflows       # Configuración de GitHub Actions para CI/CD
├── coverage                # Directorio generado para reportes de coverage de pruebas
├── dist                    # Directorio con los archivos compilados (después de build)
├── k8s                     # Archivos de configuración de Kubernetes
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── letsencrypt-issuer.yaml
│   ├── postgres-deployment.yaml
│   ├── redis-deployment.yaml
│   ├── secret.yaml
│   └── service.yaml
├── src                     # Código fuente del proyecto
│   ├── middlewares         # Middlewares personalizados
│   ├── routes              # Definición de rutas del microservicio
│   ├── services            # Servicios, incluyendo Redis y JWT
│   ├── app.ts              # Archivo principal de configuración de la aplicación
│   └── index.ts            # Punto de entrada de la aplicación
├── tests                   # Directorio de pruebas
│   ├── integration         # Pruebas de integración
│   ├── middlewares         # Pruebas unitarias de middlewares
│   ├── routes              # Pruebas unitarias de rutas
│   └── services            # Pruebas unitarias de servicios
├── Dockerfile              # Dockerfile para containerización de la aplicación
├── docker-compose.yml      # Docker Compose para desarrollo local
└── tsconfig.json           # Configuración de TypeScript
```

## Requisitos Previos

- **Node.js** v18.x
- **Docker**
- **Kubernetes** y **kubectl**
- **DigitalOcean CLI (`doctl`)**

## Instalación y Ejecución Local (con Docker y Docker Compose)

1. Clona este repositorio:
   ```bash
   git clone https://github.com/jrdnbrj/devops.git
   cd devops
   ```

2. Instala las dependencias:
   ```bash
   yarn install
   ```

3. Ejecuta las pruebas:
   ```bash
   yarn test
   ```

4. Construye el proyecto:
   ```bash
   yarn build
   ```

5. Ejecuta localmente con Docker Compose:
   ```bash
   docker compose up --build
   ```

6. Accede al servicio en `http://localhost:3000/DevOps`.

## Despliegue en Kubernetes

1. Autentica en **DigitalOcean**:
   ```bash
   doctl auth init
   ```

2. Aplica los manifiestos de Kubernetes:
   ```bash
   kubectl apply -f k8s/
   ```

3. Verifica los pods y servicios desplegados:
   ```bash
   kubectl get pods
   kubectl get svc
   ```

## CI/CD

El pipeline de CI/CD está configurado usando **GitHub Actions**. Se ejecuta automáticamente en cada push a las ramas `master` o `development` e incluye las siguientes etapas:

- **Test:** Ejecuta las pruebas automáticas.
- **Build:** Construye el proyecto y genera la imagen de Docker.
- **Deploy:** Despliega la aplicación en Kubernetes.

# Probar la aplicación en producción

## Uso de Token Único por Transacción

### Token inicial (Super Token):
- La primera vez que se hace una petición al endpoint `/DevOps`, debe enviarse un **token inicial** o **super token**. Este es un token especial que **no se bloquea** y **no expira**.
- Ejemplo de cómo incluir el super token en los headers de la petición:
  ```bash
  curl -X POST https://devops.jrdnbrj.com/DevOps \
    -H "X-Parse-REST-API-Key: {API_KEY}" \
    -H "X-JWT-KWY: {SUPER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{ "message" : "This is a test", "to": "Juan Perez", "from": "Rita Asturia", "timeToLifeSec" : 45 }'
  ```
- El **super token** creado por mi es: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpc3MiOiJzdXBlci10b2tlbiIsImlhdCI6MTcyODYwOTA2MiwiZXhwIjo0ODg0MzY5MDYyfQ.6DMbucmCKo9K6ijCfoc7TZvQGdBAtTDyAJVCnzfwwCQ

### Token único de uso por transacción:
- Después de realizar la primera petición con el **super token**, el servidor genera un nuevo token para la siguiente transacción. Este token se devuelve en los headers del **response** con la clave **`X-JWT-KWY`**.
- Este nuevo token es **de uso único** y **no puede reutilizarse** en futuras peticiones. Cada vez que se realiza una petición, debes copiar el token del header del **response** y utilizarlo en la siguiente petición.
- Si intentas usar el mismo token dos veces, recibirás un error. 

### Ejemplo del flujo:
1. Enviar la primera petición con el **super token**.
2. Copiar el nuevo token generado en los headers del **response**.
3. Usar el nuevo token en la siguiente petición en el header `X-JWT-KWY`.
4. Continuar con este ciclo: copiar el token del **response** y usarlo en la siguiente petición.

- Ejemplo de uso en el header de la siguiente petición:
  ```bash
  curl -X POST https://devops.jrdnbrj.com/DevOps \
    -H "X-Parse-REST-API-Key: {API_KEY}" \
    -H "X-JWT-KWY: {NEW_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{ "message" : "This is a test", "to": "Juan Perez", "from": "Rita Asturia", "timeToLifeSec" : 45 }'
  ```

### Tiempo de expiración del token:
- El token generado tiene un tiempo de vida definido por el atributo **`timeToLifeSec`** en el **payload** de la petición.
- Este valor representa el tiempo, en segundos, que el token permanecerá válido. Una vez pasado este tiempo, el token expira y no puede ser utilizado nuevamente.

### Uso de Redis:
- Actualmente, la funcionalidad de token de uso único ha sido desarrollada utilizando **Redis** como sistema de almacenamiento temporal. 
- Redis se encarga de gestionar los tokens y garantizar que cada token generado sea válido por una única transacción.
- **Escalabilidad**: Para proyectos de gran escala, en lugar de Redis, podría ser más adecuado utilizar una **base de datos relacional** o **NoSQL** para manejar tokens con mayor eficiencia y persistencia a largo plazo.


