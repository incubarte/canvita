# Configuración de Usuarios Administradores

## Sistema de Roles

La aplicación ahora soporta dos tipos de usuarios:

### 👤 **Clientes** (role: `client`)
- Crean **proyectos** a partir de templates existentes
- Flujo: Seleccionar Rubro → Seleccionar Estilo → Elegir Template → Editar
- Los proyectos se guardan en su biblioteca personal
- Pueden exportar sus diseños como PNG

### 👨‍💼 **Administradores** (role: `admin`)
- Crean **templates** nuevos que luego usan los clientes
- Flujo: Elegir Template Base → Editar → Guardar como Template
- Al guardar, deben especificar:
  - Nombre del template
  - Descripción
  - Rubro (inmobiliaria / comida / ropa / generico)
  - Estilo (post / historia / imagen)
- Los templates creados están disponibles para todos los clientes

## Crear un Usuario Administrador

### Opción 1: Desde la Consola del Navegador

1. Abre la aplicación en el navegador
2. Abre la consola del desarrollador (F12 o Cmd+Option+I)
3. Ejecuta el siguiente código:

```javascript
const users = JSON.parse(localStorage.getItem('users') || '[]');
const adminUser = {
  id: 'admin-001',
  email: 'admin@canvita.com',
  name: 'Administrador',
  role: 'admin',
  createdAt: new Date().toISOString(),
  password: 'admin123'
};
users.push(adminUser);
localStorage.setItem('users', JSON.stringify(users));
console.log('✅ Usuario admin creado!');
console.log('Email:', adminUser.email);
console.log('Password:', adminUser.password);
```

4. Recarga la página y inicia sesión con:
   - Email: `admin@canvita.com`
   - Password: `admin123`

### Opción 2: Modificar un Usuario Existente

Si ya tienes un usuario y quieres convertirlo en admin:

```javascript
const users = JSON.parse(localStorage.getItem('users') || '[]');
const userToPromote = users.find(u => u.email === 'tu-email@example.com');
if (userToPromote) {
  userToPromote.role = 'admin';
  localStorage.setItem('users', JSON.stringify(users));
  console.log('✅ Usuario promovido a admin!');
  // Si estás logueado, actualiza también currentUser
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.email === 'tu-email@example.com') {
    currentUser.role = 'admin';
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    location.reload();
  }
}
```

## Diferencias en la Interfaz

### Para Administradores:
- Botón "Guardar" → Guarda como Template (requiere especificar rubro y estilo)
- Título por defecto: "Nuevo Template"
- Acceso directo a selección de template base

### Para Clientes:
- Botón "Guardar" → Guarda como Proyecto
- Título por defecto: "Sin título"
- Flujo guiado: Rubro → Estilo → Template → Editor

## Categorías Disponibles

### Rubros (BusinessCategory)
- `inmobiliaria` - Templates para propiedades y bienes raíces
- `comida` - Templates para restaurantes y gastronomía
- `ropa` - Templates para moda y tiendas de ropa
- `generico` - Templates para cualquier tipo de negocio

### Estilos (TemplateStyle)
- `post` - Formato cuadrado (1080×1080) para feeds
- `historia` - Formato vertical (1080×1920) para stories
- `imagen` - Formato horizontal (1920×1080) para banners

## Base de Datos Local

Los templates personalizados se guardan en `localStorage` con la key:
```
canvita_custom_templates
```

Para ver todos los templates creados:
```javascript
const templates = JSON.parse(localStorage.getItem('canvita_custom_templates') || '[]');
console.table(templates.map(t => ({
  id: t.id,
  name: t.name,
  rubro: t.businessCategory,
  estilo: t.style,
  creador: t.createdBy
})));
```

## Próximos Pasos Recomendados

1. **Backend Real**: Migrar de localStorage a una API con base de datos
2. **Gestión de Templates**: Panel admin para ver/editar/eliminar templates
3. **Versionado**: Historial de versiones de templates
4. **Colaboración**: Múltiples admins trabajando en templates
5. **Previsualización**: Ver cómo se ve un template antes de seleccionarlo
