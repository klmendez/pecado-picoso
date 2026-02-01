type Props = {
  selectedCount: number;
};

export default function ArmarPedidoHeader({ selectedCount }: Props) {
  return (
    <header className="px-4 pt-8 pb-4">
      <div className="mx-auto max-w-6xl text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-white/50">Armar pedido</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">Elige y envía</h1>
        <div className="mt-1 text-xs text-white/55">{selectedCount} seleccionados</div>
      </div>
    </header>
  );
}
