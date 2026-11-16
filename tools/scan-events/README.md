# scan-events

Lista eventos nuevos en las ticketeras que todavía no están en la base. Solo lee; no escribe en Supabase.

```
cd tools\scan-events
npm install            # una vez
node scan.mjs          # lista candidatos nuevos y los marca como vistos en seen.json
node scan.mjs --baseline[=RedTickets]   # marca todo como ya revisado
```

Cada candidato se verifica en la página oficial (fecha, lugar, edad, flyer) antes de cargarlo con un script SQL idempotente.
Passline no se escanea (verificación anti-bots): revisarlo a mano.
