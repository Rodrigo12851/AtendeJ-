import React, { useState } from 'react';
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Table, OrderItem } from '../../types';
import { MesasGrid } from './MesasGrid';
import { ComandaDetalhes } from './ComandaDetalhes';
import { CardapioGarcom } from './CardapioGarcom';
import { CarrinhoModal } from './CarrinhoModal';

export const GarcomView: React.FC = () => {
  const {
    currentUser,
    tables,
    comandas,
    orders,
    categories,
    products,
    openComanda,
    addOrderToComanda,
    cancelOrderItem,
    transferTable,
    requestBill,
    updateTable,
  } = useStore();

  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [currentView, setCurrentView] = useState<'mesas' | 'comanda' | 'cardapio'>('mesas');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Active comanda for the active table
  const activeComanda = activeTable
    ? comandas.find((c) => c.mesa_id === activeTable.id && c.status === 'aberta')
    : null;

  const handleSelectTable = (table: Table) => {
    setActiveTable(table);
    setCurrentView('comanda');
  };

  const handleOpenComanda = (table: Table, clienteNome?: string) => {
    const newComanda = openComanda(table.id, currentUser.id, currentUser.nome, clienteNome);
    const updatedTable = {
      ...table,
      status: 'ocupada' as const,
      garcom_atual_id: currentUser.id,
      garcom_atual_nome: currentUser.nome,
      cliente_atual_nome: clienteNome,
      comanda_atual_id: newComanda.id,
      comanda_atual_numero: newComanda.numero,
    };
    setActiveTable(updatedTable);
    setCurrentView('comanda');
  };

  const handleAddToCart = (item: OrderItem) => {
    setCartItems((prev) => [...prev, item]);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    setCartItems((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          return {
            ...it,
            quantidade: newQty,
            preco_total: newQty * it.preco_unitario,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSendToKitchen = (observacaoGeral: string) => {
    if (!activeComanda || cartItems.length === 0) return;
    addOrderToComanda(activeComanda.id, cartItems, observacaoGeral);
    setCartItems([]);
    setShowCartModal(false);
    setCurrentView('comanda');
  };

  const handleTransferTable = (targetMesaId: string) => {
    if (!activeTable) return;
    const success = transferTable(activeTable.id, targetMesaId);
    if (success) {
      setCurrentView('mesas');
      setActiveTable(null);
    }
  };

  const handleReleaseTable = (table: Table) => {
    updateTable({
      ...table,
      status: 'livre',
      cliente_atual_nome: undefined,
      garcom_atual_id: undefined,
      garcom_atual_nome: undefined,
      comanda_atual_id: undefined,
      comanda_atual_numero: undefined,
    });
    setCurrentView('mesas');
    setActiveTable(null);
  };

  return (
    <div className="w-full">
      {currentView === 'mesas' && (
        <MesasGrid
          tables={tables}
          comandas={comandas}
          orders={orders}
          currentUser={currentUser}
          onSelectTable={handleSelectTable}
          onOpenComanda={handleOpenComanda}
          onReleaseTable={handleReleaseTable}
        />
      )}

      {currentView === 'comanda' && activeTable && activeComanda && (
        <ComandaDetalhes
          table={activeTable}
          comanda={activeComanda}
          orders={orders}
          availableTables={tables.filter((t) => t.status === 'livre')}
          onBack={() => {
            setCurrentView('mesas');
            setActiveTable(null);
          }}
          onAddNewOrder={() => setCurrentView('cardapio')}
          onCancelItem={(orderId, itemId, motivo) =>
            cancelOrderItem(activeComanda.id, orderId, itemId, motivo)
          }
          onTransferTable={handleTransferTable}
          onRequestBill={() => requestBill(activeComanda.id)}
          userRole={currentUser.perfil}
        />
      )}

      {/* Fallback for Table without Active Comanda (e.g. Reservada ou Sem Comanda) */}
      {currentView === 'comanda' && activeTable && !activeComanda && (
        <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="inline-block px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-full border border-blue-200 dark:border-blue-900/60 uppercase">
              {activeTable.status === 'reservada' ? 'Mesa Reservada' : `Mesa ${activeTable.status}`}
            </div>
            <h3 className="text-xl font-black text-stone-900 dark:text-white">
              Mesa {activeTable.numero.toString().padStart(2, '0')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              {activeTable.localizacao} • {activeTable.capacidade} lugares
            </p>
          </div>

          <p className="text-xs text-stone-600 dark:text-slate-300 bg-stone-50 dark:bg-slate-950 p-3 rounded-xl border border-stone-200 dark:border-slate-800 leading-relaxed">
            {activeTable.status === 'reservada'
              ? 'Esta mesa possui uma reserva cadastrada e está aguardando a chegada dos clientes para iniciar o consumo.'
              : 'Esta mesa não possui nenhuma comanda aberta no momento.'}
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => handleOpenComanda(activeTable, activeTable.cliente_atual_nome)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              {activeTable.status === 'reservada'
                ? 'Cliente Chegou - Abrir Comanda Agora'
                : 'Abrir Comanda para esta Mesa'}
            </button>

            {activeTable.status === 'reservada' && (
              <button
                onClick={() => handleReleaseTable(activeTable)}
                className="w-full py-2.5 px-4 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Liberar Mesa (Cancelar Reserva)
              </button>
            )}

            <button
              onClick={() => {
                setCurrentView('mesas');
                setActiveTable(null);
              }}
              className="w-full py-2.5 px-4 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para as Mesas</span>
            </button>
          </div>
        </div>
      )}

      {currentView === 'cardapio' && activeTable && activeComanda && (
        <CardapioGarcom
          mesaNumero={activeTable.numero}
          comandaNumero={activeComanda.numero}
          categories={categories}
          products={products}
          cartItems={cartItems}
          onBack={() => setCurrentView('comanda')}
          onAddToCart={handleAddToCart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
          onRemoveCartItem={handleRemoveCartItem}
          onOpenCart={() => setShowCartModal(true)}
        />
      )}

      {/* Cart Review & Send Modal */}
      {showCartModal && activeTable && activeComanda && (
        <CarrinhoModal
          mesaNumero={activeTable.numero}
          comandaNumero={activeComanda.numero}
          cartItems={cartItems}
          onClose={() => setShowCartModal(false)}
          onRemoveItem={handleRemoveCartItem}
          onUpdateQuantity={handleUpdateCartQuantity}
          onAddMoreProducts={() => setShowCartModal(false)}
          onSendToKitchen={handleSendToKitchen}
        />
      )}
    </div>
  );
};
