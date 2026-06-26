type Props = {
  selectedCount: number;
};

export default function ArmarPedidoHeader({ selectedCount }: Props) {
  return (
    <header className="hidden sm:block px-4 pt-4 pb-2">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Armar pedido</h1>
        <p className="mt-0.5 text-xs text-gray-400">{selectedCount} seleccionados</p>
      </div>
    </header>
  );
}
