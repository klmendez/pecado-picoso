import { INSTAGRAM } from "../data/constants";

export default function Terminos() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="text-3xl font-black">Términos y condiciones</h2>

      <div className="mt-6 space-y-4 text-neutral-200">
        <p>• Nuestras gomitas son irresistiblemente deliciosas. Puedes armarlas como tú desees.</p>
        <p>• Manejamos domicilios con Domipop; el costo lo asume el cliente o puedes recoger.</p>
        <p className="font-bold">• Producto que no esté cancelado en su totalidad no será despachado.</p>
        <p>
          • Síguenos en redes: <span className="font-bold">{INSTAGRAM}</span>. Si te gustaron, repósteanos y etiquétenos en tu history
          para sorpresa 😈🔥
        </p>
      </div>
    </div>
  );
}
