/** Nota legible sin segmentos JSON técnicos (p. ej. pago combinado). */
export function formatearNota(note: string | null | undefined): string {
  if (!note) return '';

  const partes = note.split(' | ');
  const limpias = partes.filter(parte => {
    try {
      const obj = JSON.parse(parte.trim());
      return !(obj?.tipo === 'combinado');
    } catch {
      return true;
    }
  });

  return limpias.join(' · ').trim();
}
