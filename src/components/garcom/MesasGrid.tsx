import React, { useState, useMemo } from 'react';
import { Users, Search, PlusCircle, Clock, AlertCircle, Grid2X2, LayoutGrid } from 'lucide-react';
import { Table, Comanda, User, TableStatus, Order } from '../../types';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { MesasGridCompacto } from './MesasGridCompacto';

export { MesasGridCompacto } from './MesasGridCompacto';

export interface MesasGridProps {
  tables: Table[];
  comandas: Comanda[];
  orders?: Order[];
  currentUser: User;
  onSelectTable: (table: Table) => void;
  onOpenComanda: (table: Table, clienteNome?: string) => void;
  onReleaseTable?: (table: Table) => void;
  defaultViewMode?: 'detalhado' | 'compacto';
}

export const MesasGrid: React.FC<MesasGridProps> = ({
  tables,
  comandas,
  orders = [],
  currentUser,
  onSelectTable,
  onOpenComanda,
  onReleaseTable,
  defaultViewMode = 'compacto',
}) => {
  const [viewMode, setViewMode] = useState<'detalhado' | 'compacto'>(defaultViewMode);
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [openingTable, setOpeningTable] = useState<Table | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');

  // Map each table to its active comanda
  const comandasMap = useMemo(() => {
    const map = new Map<string, Comanda>();
    comandas.forEach((c) => {
      if (c.status === 'aberta') {
        map.set(c.mesa_id, c);
      }
    });
    return map;
  }, [comandas]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchFilter =
        filterStatus === 'todas'
          ? true
          : filterStatus === 'livre'
          ? table.status === 'livre'
          : filterStatus === 'ocupada'
          ? table.status === 'ocupada'
          : filterStatus === 'aguardando_fechamento'
          ? table.status === 'aguardando_fechamento'
          : filterStatus === 'reservada'
          ? table.status === 'reservada'
          : true;

      const matchSearch =
        !searchQuery ||
        table.numero.toString().includes(searchQuery) ||
        table.localizacao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (table.garcom_atual_nome && table.garcom_atual_nome.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchFilter && matchSearch;
    });
  }, [tables, filterStatus, searchQuery]);

  // Statistics
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'ocupada' || t.status === 'aguardando_fechamento').length;
  const freeCount = tables.filter((t) => t.status === 'livre').length;
  const closingCount = tables.filter((t) => t.status === 'aguardando_fechamento').length;

  const handleTableClick = (table: Table) => {
    if (table.status === 'livre' || table.status === 'reservada') {
      setCustomerNameInput(table.cliente_atual_nome || '');
      setOpeningTable(table);
    } else {
      onSelectTable(table);
    }
  };

  const handleConfirmOpen = () => {
    if (openingTable) {
      onOpenComanda(openingTable, customerNameInput.trim() || undefined);
      setOpeningTable(null);
      setCustomerNameInput('');
    }
  };

  if (viewMode === 'compacto') {
    return (
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-6">
        <MesasGridCompacto
          tables={tables}
          comandas={comandas}
          orders={orders}
          currentUser={currentUser}
          onSelectTable={onSelectTable}
          onOpenComanda={onOpenComanda}
          onReleaseTable={onReleaseTable}
          initialFilterStatus={filterStatus}
          initialSearchQuery={searchQuery}
          onViewModeChange={setViewMode}
          currentViewMode={viewMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-4">
      {/* Refined Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-xl shadow-xs">
        {/* Status Count Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('todas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
              filterStatus === 'todas'
                ? 'bg-stone-900 dark:bg-slate-800 text-white border-stone-900 dark:border-slate-700 shadow-xs'
                : 'bg-stone-100 dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200/70 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({totalTables})
          </button>
          <button
            onClick={() => setFilterStatus('livre')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'livre'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-emerald-50 dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/70 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Livre ({freeCount})
          </button>
          <button
            onClick={() => setFilterStatus('ocupada')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'ocupada'
                ? 'bg-red-700 text-white border-red-800 shadow-xs'
                : 'bg-red-50 dark:bg-slate-900 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-100/70 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Ocupada ({occupiedCount - closingCount})
          </button>
          <button
            onClick={() => setFilterStatus('aguardando_fechamento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'aguardando_fechamento'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-slate-900 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/70 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Fechar ({closingCount})
          </button>
        </div>

        {/* Quick Search and View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa ou garçom..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-red-500 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex border border-stone-200 dark:border-slate-800 rounded-lg bg-stone-100 dark:bg-slate-950 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('compacto')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'compacto'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Visualização em Grid Compacto (Mobile)"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compacto</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detalhado')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'detalhado'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Visualização em Cards Detalhados"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detalhado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTables.map((table) => {
          const activeComanda = table.comanda_atual_id ? comandasMap.get(table.id) : undefined;
          const isOccupied = table.status === 'ocupada';
          const isClosing = table.status === 'aguardando_fechamento';
          const isFree = table.status === 'livre';
          const isReserved = table.status === 'reservada';

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => handleTableClick(table)}
              className={`relative rounded-xl border p-3 text-left transition-all duration-150 flex flex-col justify-between h-40 group cursor-pointer shadow-xs hover:shadow-md active:scale-98 ${
                isFree
                  ? 'bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-slate-800/80'
                  : isOccupied
                  ? 'bg-stone-900 dark:bg-slate-900 border-stone-800 dark:border-slate-800 text-white hover:bg-stone-850'
                  : isClosing
                  ? 'bg-amber-50/90 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 text-stone-900 dark:text-slate-100 hover:bg-amber-100/70 dark:hover:bg-slate-800/80'
                  : 'bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-slate-800 text-blue-950 dark:text-slate-100 hover:bg-blue-100/60'
              }`}
            >
              {/* Card Top: Number & Capacity */}
              <div className="flex items-start justify-between w-full">
                <div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider block ${
                      isOccupied ? 'text-stone-400 dark:text-slate-400' : 'text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    MESA
                  </span>
                  <span
                    className={`text-2xl font-black font-mono tracking-tight leading-none ${
                      isOccupied ? 'text-white' : 'text-stone-900 dark:text-white'
                    }`}
                  >
                    {table.numero.toString().padStart(2, '0')}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border ${
                    isOccupied
                      ? 'border-stone-700 bg-stone-800 text-stone-300'
                      : 'border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-2.5 h-2.5" />
                  <span>{table.capacidade}</span>
                </div>
              </div>

              {/* Card Center: Status indicator */}
              <div className="w-full my-auto py-1">
                {isFree && (
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> LIVRE
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-1 truncate">
                      {table.localizacao}
                    </p>
                  </div>
                )}

                {isOccupied && (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 border border-red-500 text-white text-[10px] font-bold rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> OCUPADA
                    </span>
                    {table.garcom_atual_nome && (
                      <p className="text-[11px] text-stone-300 font-medium truncate mt-1">
                        {table.garcom_atual_nome}
                      </p>
                    )}
                    {table.comanda_atual_numero && (
                      <p className="text-[10px] font-mono text-amber-300 font-semibold tracking-wider">
                        {table.comanda_atual_numero}
                      </p>
                    )}
                    {(table.cliente_atual_nome || activeComanda?.cliente_nome) && (
                      <p className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                        <span>👤</span> {table.cliente_atual_nome || activeComanda?.cliente_nome}
                      </p>
                    )}
                  </div>
                )}

                {isClosing && (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 border border-amber-600 text-white text-[10px] font-bold rounded-md animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> FECHAR
                    </span>
                    {table.garcom_atual_nome && (
                      <p className="text-[11px] text-stone-800 dark:text-slate-200 font-bold truncate mt-1">
                        {table.garcom_atual_nome}
                      </p>
                    )}
                    {(table.cliente_atual_nome || activeComanda?.cliente_nome) && (
                      <p className="text-[10px] text-stone-700 dark:text-emerald-400 font-semibold truncate flex items-center gap-1">
                        <span>👤</span> {table.cliente_atual_nome || activeComanda?.cliente_nome}
                      </p>
                    )}
                  </div>
                )}

                {isReserved && (
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[10px] font-bold rounded-md">
                      RESERVADA
                    </span>
                  </div>
                )}
              </div>

              {/* Card Bottom: Total Parcial or Action */}
              <div
                className={`w-full pt-2 border-t flex items-center justify-between ${
                  isOccupied ? 'border-stone-800 dark:border-slate-800' : 'border-stone-200 dark:border-slate-800'
                }`}
              >
                {isFree ? (
                  <span className="text-[11px] font-bold tracking-tight text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Abrir Comanda
                  </span>
                ) : (
                  <>
                    <span
                      className={`text-[10px] font-medium ${
                        isOccupied ? 'text-stone-400 dark:text-slate-400' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      Total:
                    </span>
                    <span
                      className={`text-xs font-mono font-bold tracking-tight ${
                        isOccupied ? 'text-amber-400' : isClosing ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(activeComanda?.total || 0)}
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal to Open Comanda */}
      {openingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-stone-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-stone-800 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-red-400 font-bold">01</span>
                <h3 className="font-bold text-sm tracking-wide">
                  {openingTable.status === 'reservada' ? 'Abertura de Comanda (Reserva)' : 'Abertura de Comanda'}
                </h3>
              </div>
              <button
                onClick={() => setOpeningTable(null)}
                className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50/70 dark:bg-slate-950 p-4 rounded-xl border border-amber-200/80 dark:border-slate-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Mesa Selecionada
                  </span>
                  {openingTable.status === 'reservada' && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                      RESERVADA
                    </span>
                  )}
                </div>
                <div className="text-3xl font-mono font-black text-stone-900 dark:text-white tracking-tight">
                  MESA {openingTable.numero.toString().padStart(2, '0')}
                </div>
                <p className="text-xs text-stone-600 dark:text-slate-400">
                  Capacidade: {openingTable.capacidade} lugares • {openingTable.localizacao}
                </p>
              </div>

              <div className="space-y-2 text-xs bg-stone-50 dark:bg-slate-950 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800">
                <div className="flex justify-between border-b border-stone-200/80 dark:border-slate-800/80 pb-1.5">
                  <span className="text-stone-500 dark:text-slate-400">Garçom responsável:</span>
                  <strong className="text-stone-900 dark:text-white">{currentUser.nome}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-200/80 dark:border-slate-800/80 pb-1.5">
                  <span className="text-stone-500 dark:text-slate-400">Horário de abertura:</span>
                  <strong className="text-stone-900 dark:text-white font-mono">{formatTime(new Date().toISOString())}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-slate-400">Total inicial:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> R$ 0,00
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Nome do Cliente:</span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 font-normal">Identifica na Comanda e no Caixa</span>
                </label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Ex: Carlos, Família Silva, etc..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmOpen();
                  }}
                />
              </div>

              <p className="text-xs text-stone-500 dark:text-slate-400 text-center leading-relaxed">
                {openingTable.status === 'reservada'
                  ? 'Ao confirmar, o status passará para OCUPADA e você poderá lançar pedidos para os clientes da reserva.'
                  : 'Ao abrir a comanda, o sistema vinculará esta mesa ao seu atendimento e permitirá o lançamento de novos pedidos para a cozinha.'}
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 dark:border-slate-800">
              {openingTable.status === 'reservada' && onReleaseTable ? (
                <button
                  type="button"
                  onClick={() => {
                    onReleaseTable(openingTable);
                    setOpeningTable(null);
                  }}
                  className="px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Liberar Mesa (Cancelar Reserva)
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setOpeningTable(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOpen}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer active:scale-95"
                >
                  {openingTable.status === 'reservada' ? 'Cliente Chegou - Abrir Comanda' : 'Abrir Comanda Agora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
