# Red de Incidencia · Akãhatã

App para celular y web que ayuda a organizaciones de América Latina a **llevar sus agendas a los espacios de derechos humanos de la ONU, la OEA y el Mercosur**, también en temas que no son "de género": ambiente, desarrollo, economía, migración.

- **Radar:** oportunidades de incidencia (llamados a contribuciones, revisiones de países, audiencias, consultas) con plazo, cómo participar y "cómo sumar tu agenda".
- **Me sumo:** cada organización indica a qué se suma y quién puede verlo (público, solo la red o solo Akãhatã, para contextos de riesgo).
- **Red:** organizaciones por país, con lo que ofrecen y necesitan.
- **Me sumé:** registro del resultado de cada espacio.
- **Revisión:** el equipo de Akãhatã aprueba lo que el radar recolecta antes de publicarlo.

Usa la misma tecnología que Truek: Vite, React, TypeScript, Tailwind y Supabase.

## Probarla en tu compu

Necesitás [Node.js](https://nodejs.org).

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin configurar Supabase, la app funciona en **modo ejemplo** con datos inventados.

## Conectarla a Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Aplicá la base de datos: `supabase/migrations/20261113000000_esquema_inicial.sql` (con la CLI de Supabase, `supabase db push`, o pegándolo en el SQL Editor).
3. Copiá `.env.example` a `.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Settings → API).

## Prueba de fuentes

`supabase/functions/probar-fuentes` es una función de prueba que visita las páginas de la ONU, la OEA y el Mercosur y devuelve cuáles se pueden leer automáticamente. Sirve para decidir qué partes del radar se recolectan solas y cuáles se cargan a mano.

```bash
supabase functions deploy probar-fuentes
```

## Estructura

```
src/
  App.tsx              navegación y estado general
  components/          pantallas (Radar, Oportunidad, Red, Me sumé, Revisión)
  lib/datos.ts         lectura y escritura (Supabase o datos de ejemplo)
  data/datosEjemplo.ts datos inventados para el modo ejemplo
supabase/
  migrations/          esquema de la base con permisos (RLS)
  functions/           funciones del servidor
```
