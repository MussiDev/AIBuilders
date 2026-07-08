/** Muestra los mensajes de error de un campo, si los hay. */
export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {messages.join('. ')}
    </p>
  );
}
