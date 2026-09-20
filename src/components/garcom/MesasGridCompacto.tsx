import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Clock,
  AlertTriangle,
  Flame,
  Bell,
  CheckCircle,
  Receipt,
  LayoutGrid,
  Grid2X2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Table, Comanda, User, Order } from '../../types';
import { formatCurrency, formatTime } from '../../utils/formatters';

export interface MesasGridCompactoProps {
  tables: Table[];
  comandas: Comanda[];
  orders?: Order[];
  currentUser: User;
  onSelectTable: (table: Table) => void;
  onOpenComanda: (table: Table, clienteNome?: string) => void;
  onReleaseTable?: (table: Table) => void;
  initialFilterStatus?: string;
  initialSearchQuery?: string;
  onViewModeChange?: (mode: 'detalhado' | 'compacto') => void;
  currentViewMode?: 'detalhado' | 'compacto';
}

export const MesasGridCompacto: React.FC<MesasGridCompactoProps> = ({
  tables,
  comandas,
  orders = [],
  currentUser,
  onSelectTable,
  onOpenComanda,
  onReleaseTable,
  initialFilterStatus = 'todas',
  initialSearchQuery = '',
  onViewModeChange,
  currentViewMode = 'compacto',
}) => {
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [openingTable, setOpeningTable] = useState<Table | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('todas');
  const [colsDensity, setColsDensity] = useState<'3' | '4' | 'auto'>('auto');

  // Map active comanda by table ID
  const comandasMap = useMemo(() => {
    const map = new Map<string, Comanda>();
    comandas.forEach((c) => {
      if (c.status === 'aberta') {
        map.set(c.mesa_id, c);
      }
    });
    return map;
  }, [comandas]);

  // Map kitchen orders status by comanda ID
  const kitchenStatusByComanda = useMemo(() => {
    const map = new Map<string, { hasPronto: boolean; hasPreparo: boolean }>();
    orders.forEach((order) => {
      if (order.status === 'cancelado') return;
      const current = map.get(order.comanda_id) || { hasPronto: false, hasPreparo: false };
      if (order.status === 'pronto') current.hasPronto = true;
      if (order.status === 'em_preparo') current.hasPreparo = true;
      map.set(order.comanda_id, current);
    });
    return map;
  }, [orders]);

  // Unique locations for filter
  const locations = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.localizacao) set.add(t.localizacao);
    });
    return Array.from(set);
  }, [tables]);

  // Filtered tables
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

      const matchLocation =
        locationFilter === 'todas' ? true : table.localizacao === locationFilter;

      const matchSearch =
        !searchQuery ||
        table.numero.toString().includes(searchQuery) ||
        table.localizacao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (table.garcom_atual_nome &&
          table.garcom_atual_nome.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchFilter && matchLocation && matchSearch;
    });
  }, [tables, filterStatus, locationFilter, searchQuery]);

  // Statistics
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const closingCount = tables.filter((t) => t.status === 'aguardando_fechamento').length;
  const freeCount = tables.filter((t) => t.status === 'livre').length;
  const reservedCount = tables.filter((t) => t.status === 'reservada').length;

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

  const gridColsClass =
    colsDensity === '3'
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
      : colsDensity === '4'
      ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9'
      : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10';

  return (
    <div className="w-full space-y-3">
      {/* Top Status & Density Controls Toolbar (Trattoria Bar) */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-xs p-3 space-y-2.5">
        {/* Status Count Buttons / Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('todas')}
              className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                filterStatus === 'todas'
                  ? 'bg-stone-900 dark:bg-slate-800 text-white border-stone-900 dark:border-slate-700 shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-950 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200/70'
              }`}
            >
              TODAS ({totalTables})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('livre')}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                filterStatus === 'livre'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-emerald-50 dark:bg-slate-950 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              LIVRES ({freeCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('ocupada')}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                filterStatus === 'ocupada'
                  ? 'bg-red-700 text-white border-red-800 shadow-xs'
                  : 'bg-red-50 dark:bg-slate-950 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              OCUPADAS ({occupiedCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('aguardando_fechamento')}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                filterStatus === 'aguardando_fechamento'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-slate-950 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              FECHANDO ({closingCount})
            </button>

            {reservedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStatus('reservada')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === 'reservada'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-blue-50 dark:bg-slate-950 text-blue-900 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100/70'
                }`}
              >
                RESERVADAS ({reservedCount})
              </button>
            )}
          </div>

          {/* View Mode & Column Density Switcher */}
          <div className="flex items-center gap-2">
            {/* Density Selector */}
            <div className="hidden sm:flex items-center border border-stone-200 rounded-lg bg-stone-100 p-0.5 text-[11px] font-bold">
              <span className="px-1.5 text-stone-500">Cols:</span>
              <button
                type="button"
                onClick={() => setColsDensity('3')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  colsDensity === '3' ? 'bg-white text-stone-900 dark:text-slate-100 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                }`}
                title="3 Colunas no mobile"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => setColsDensity('4')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  colsDensity === '4' ? 'bg-white text-stone-900 dark:text-slate-100 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                }`}
                title="4 Colunas no mobile (Ultra compacto)"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => setColsDensity('auto')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  colsDensity === 'auto' ? 'bg-white text-stone-900 dark:text-slate-100 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                }`}
                title="Automático responsivo"
              >
                Auto
              </button>
            </div>

            {/* View Mode Switcher Button (if handler provided) */}
            {onViewModeChange && (
              <div className="flex border border-stone-200 rounded-lg bg-stone-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onViewModeChange('compacto')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    currentViewMode === 'compacto'
                      ? 'bg-white text-stone-900 dark:text-slate-100 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                  }`}
                  title="Visualização em Grid Compacto (Mobile)"
                >
                  <Grid2X2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compacto</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('detalhado')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${
                    currentViewMode === 'detalhado'
                      ? 'bg-white text-stone-900 dark:text-slate-100 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                  }`}
                  title="Visualização em Cards Detalhados"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Detalhado</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Location Filter Sub-row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-200">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa por número ou garçom..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-red-500 text-stone-900 dark:text-slate-100 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 dark:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {locations.length > 1 && (
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto text-[11px] font-bold">
              <span className="text-stone-400 uppercase text-[10px] whitespace-nowrap">Área:</span>
              <button
                type="button"
                onClick={() => setLocationFilter('todas')}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition ${
                  locationFilter === 'todas'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 dark:text-slate-300 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Todas
              </button>
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationFilter(loc)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition ${
                    locationFilter === loc
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 dark:text-slate-300 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Status Legend & Live Metrics */}
      <div className="flex items-center justify-between text-[11px] px-1 text-stone-600">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Livre
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            Ocupada
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Pedindo Conta
          </span>
        </div>
        <span className="text-[10px] text-stone-400 uppercase font-semibold">
          {filteredTables.length} {filteredTables.length === 1 ? 'mesa' : 'mesas'} exibidas
        </span>
      </div>

      {/* Compact Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-10 text-center bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-stone-800 dark:text-slate-200">Nenhuma mesa encontrada com esses filtros.</p>
          <button
            type="button"
            onClick={() => {
              setFilterStatus('todas');
              setLocationFilter('todas');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className={`grid ${gridColsClass} gap-2 sm:gap-2.5`}>
          {filteredTables.map((table) => {
            const isFree = table.status === 'livre';
            const isOccupied = table.status === 'ocupada';
            const isClosing = table.status === 'aguardando_fechamento';
            const isReserved = table.status === 'reservada';

            const activeComanda = table.comanda_atual_id ? comandasMap.get(table.id) : undefined;
            const kitchenStatus = activeComanda
              ? kitchenStatusByComanda.get(activeComanda.id)
              : undefined;

            const garcomShort = table.garcom_atual_nome
              ? table.garcom_atual_nome.split(' ')[0]
              : '';

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleTableClick(table)}
                className={`relative rounded-xl border text-left p-2 transition-all duration-150 flex flex-col justify-between h-[90px] sm:h-[96px] cursor-pointer group select-none overflow-hidden active:scale-98 shadow-xs hover:shadow-md ${
                  isFree
                    ? 'bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-800 text-stone-800 dark:text-slate-100 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-slate-850'
                    : isOccupied
                    ? 'bg-stone-900 dark:bg-slate-900 border-stone-800 dark:border-slate-800 text-white hover:bg-stone-850'
                    : isClosing
                    ? 'bg-amber-50/90 dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 text-stone-900 dark:text-slate-100 hover:bg-amber-100/70 dark:hover:bg-slate-850'
                    : 'bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-slate-800 text-blue-950 dark:text-slate-100 hover:bg-blue-100/60'
                }`}
                title={`Mesa ${table.numero} - ${table.status.toUpperCase()} (${table.localizacao})`}
              >
                {/* Tile Header: Status Badge & Capacity */}
                <div className="flex items-center justify-between w-full gap-1 leading-none">
                  {/* Status Indicator Badge */}
                  {isFree && (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      LIVRE
                    </span>
                  )}

                  {isOccupied && (
                    <span className="inline-flex items-center gap-1 bg-red-600 text-white px-1.5 py-0.5 text-[9px] font-bold rounded-md border border-red-500">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      OCUP
                    </span>
                  )}

                  {isClosing && (
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-1.5 py-0.5 text-[9px] font-bold rounded-md border border-amber-600">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      CONTA
                    </span>
                  )}

                  {isReserved && (
                    <span className="inline-flex items-center bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 text-[9px] font-bold rounded-md border border-blue-200 dark:border-blue-800">
                      RES
                    </span>
                  )}

                  {/* Kitchen order alerts for occupied tables */}
                  {isOccupied && kitchenStatus?.hasPronto && (
                    <span
                      className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse flex items-center gap-1"
                      title="Pratos prontos na cozinha para servir!"
                    >
                      <Bell className="w-2.5 h-2.5" />
                      PRONTO
                    </span>
                  )}

                  {isOccupied && !kitchenStatus?.hasPronto && kitchenStatus?.hasPreparo && (
                    <span
                      className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1"
                      title="Pedido assando no forno"
                    >
                      <Flame className="w-2.5 h-2.5 text-amber-400" />
                      FORNO
                    </span>
                  )}

                  {/* Capacity Pill */}
                  {!kitchenStatus?.hasPronto && (
                    <span
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ml-auto border ${
                        isOccupied
                          ? 'border-stone-700 text-stone-300 bg-stone-800'
                          : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800'
                      }`}
                      title={`${table.capacidade} lugares`}
                    >
                      <Users className="w-2.5 h-2.5" />
                      {table.capacidade}p
                    </span>
                  )}
                </div>

                {/* Tile Center: Large Table Number */}
                <div className="flex items-baseline justify-between w-full my-auto px-0.5">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isOccupied ? 'text-stone-400 dark:text-slate-400' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      M
                    </span>
                    <span
                      className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${
                        isOccupied ? 'text-white' : 'text-stone-900 dark:text-white'
                      }`}
                    >
                      {table.numero.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Contextual Value or Action text */}
                  {isFree && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-tight flex items-center gap-1 group-hover:underline">
                      <PlusCircle className="w-3 h-3" />
                      ABRIR
                    </span>
                  )}

                  {isOccupied && activeComanda && (
                    <span className="text-xs font-bold font-mono text-amber-400 tracking-tight text-right">
                      {formatCurrency(activeComanda.total)}
                    </span>
                  )}

                  {isClosing && activeComanda && (
                    <span className="text-xs font-black font-mono text-amber-900 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800/80 tracking-tight text-right">
                      {formatCurrency(activeComanda.total)}
                    </span>
                  )}

                  {isReserved && (
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold tracking-tight flex items-center gap-1 group-hover:underline">
                      <Clock className="w-3 h-3" />
                      RESERVA
                    </span>
                  )}
                </div>

                {/* Tile Footer: Subtitle / Waiter or Location */}
                <div
                  className={`w-full pt-1 border-t flex items-center justify-between text-[10px] leading-tight ${
                    isOccupied ? 'border-stone-800 dark:border-slate-800' : 'border-stone-200 dark:border-slate-800'
                  }`}
                >
                  {isFree && (
                    <span className="text-stone-500 truncate text-[10px]">
                      {table.localizacao}
                    </span>
                  )}

                  {isOccupied && (
                    <>
                      <span
                        className="text-stone-300 font-medium truncate max-w-[65px] sm:max-w-[80px]"
                        title={table.cliente_atual_nome || activeComanda?.cliente_nome ? `Cliente: ${table.cliente_atual_nome || activeComanda?.cliente_nome}` : (garcomShort || 'Garçom')}
                      >
                        {table.cliente_atual_nome || activeComanda?.cliente_nome ? (table.cliente_atual_nome || activeComanda?.cliente_nome)?.split(' ')[0] : (garcomShort || 'Garçom')}
                      </span>
                      {table.comanda_atual_numero && (
                        <span className="text-amber-400 text-[9px] font-mono font-bold">
                          {table.comanda_atual_numero}
                        </span>
                      )}
                    </>
                  )}

                  {isClosing && (
                    <>
                      <span
                        className="text-stone-800 dark:text-slate-200 font-bold truncate max-w-[65px] sm:max-w-[80px]"
                        title={table.cliente_atual_nome || activeComanda?.cliente_nome ? `Cliente: ${table.cliente_atual_nome || activeComanda?.cliente_nome}` : (garcomShort || 'Conta')}
                      >
                        {table.cliente_atual_nome || activeComanda?.cliente_nome ? (table.cliente_atual_nome || activeComanda?.cliente_nome)?.split(' ')[0] : (garcomShort || 'Conta')}
                      </span>
                      <span className="text-[9px] font-bold text-red-700 flex items-center gap-0.5">
                        <Receipt className="w-3 h-3" />
                        Caixa
                      </span>
                    </>
                  )}

                  {isReserved && (
                    <span className="text-blue-700 dark:text-blue-300 font-bold text-[9px] truncate max-w-[85px]">
                      {table.cliente_atual_nome ? `Res: ${table.cliente_atual_nome.split(' ')[0]}` : 'Reservada'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Trattoria Modal for Opening Comanda on Free Table */}
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
                type="button"
                onClick={() => setOpeningTable(null)}
                className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
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
                <div className="text-3xl font-black text-stone-900 dark:text-white font-mono tracking-tight">
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
                  <span className="text-stone-500 dark:text-slate-400">Horário de Abertura:</span>
                  <strong className="text-stone-900 dark:text-white font-mono">{formatTime(new Date().toISOString())}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-slate-400">Status Inicial:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aberta (R$ 0,00)
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
                  : 'Ao confirmar, a mesa passará para o status OCUPADA e vinculará seu atendimento para lançamento de pedidos.'}
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
