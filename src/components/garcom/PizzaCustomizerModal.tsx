import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { Product, OrderItem, PizzaExtraOption } from '../../types';
import { PIZZA_FLAVORS, PIZZA_SIZES as DEFAULT_SIZES, PIZZA_CRUSTS as DEFAULT_CRUSTS, PIZZA_DOUGHS as DEFAULT_DOUGHS, PIZZA_ADDONS as DEFAULT_ADDONS } from '../../data/initialData';
import { formatCurrency } from '../../utils/formatters';
import { playAddPop } from '../../utils/audio';
import { useStore } from '../../context/StoreContext';

interface PizzaCustomizerModalProps {
  baseProduct: Product;
  onClose: () => void;
  onConfirm: (item: OrderItem) => void;
}

export const PizzaCustomizerModal: React.FC<PizzaCustomizerModalProps> = ({
  baseProduct,
  onClose,
  onConfirm,
}) => {
  const store = useStore();
  const rawSizes = store?.pizzaSizes?.length ? store.pizzaSizes : DEFAULT_SIZES;
  const rawCrusts = store?.pizzaCrusts?.length ? store.pizzaCrusts : DEFAULT_CRUSTS;
  const rawDoughs = store?.pizzaDoughs?.length ? store.pizzaDoughs : DEFAULT_DOUGHS;
  const rawAddons = store?.pizzaAddons?.length ? store.pizzaAddons : DEFAULT_ADDONS;

  const sizes = useMemo(() => {
    if (baseProduct.tamanhos_disponiveis && baseProduct.tamanhos_disponiveis.length > 0) {
      return rawSizes.filter(
        (s) => baseProduct.tamanhos_disponiveis?.includes(s.id) || baseProduct.tamanhos_disponiveis?.includes(s.nome)
      );
    }
    return rawSizes;
  }, [rawSizes, baseProduct.tamanhos_disponiveis]);

  const crusts = useMemo(() => {
    let list = rawCrusts;
    if (baseProduct.bordas_disponiveis && baseProduct.bordas_disponiveis.length > 0) {
      list = rawCrusts.filter(
        (c) =>
          c.id === 'borda_sem' ||
          c.nome.toLowerCase().includes('sem borda') ||
          baseProduct.bordas_disponiveis?.includes(c.id) ||
          baseProduct.bordas_disponiveis?.includes(c.nome)
      );
    }
    const hasSemBorda = list.some(
      (c) => c.id === 'borda_sem' || c.nome.toLowerCase().includes('sem borda')
    );
    if (!hasSemBorda) {
      const semBordaOpt = rawCrusts.find(
        (c) => c.id === 'borda_sem' || c.nome.toLowerCase().includes('sem borda')
      ) || { id: 'borda_sem', nome: 'Sem borda', preco: 0 };
      list = [semBordaOpt, ...list];
    }
    return list;
  }, [rawCrusts, baseProduct.bordas_disponiveis]);

  const doughs = useMemo(() => {
    if (baseProduct.massas_disponiveis && baseProduct.massas_disponiveis.length > 0) {
      const filtered = rawDoughs.filter(
        (d) => baseProduct.massas_disponiveis?.includes(d.id) || baseProduct.massas_disponiveis?.includes(d.nome)
      );
      if (filtered.length > 0) return filtered;
    }
    return rawDoughs;
  }, [rawDoughs, baseProduct.massas_disponiveis]);

  const addons = useMemo(() => {
    if (baseProduct.adicionais_disponiveis && baseProduct.adicionais_disponiveis.length > 0) {
      const filtered = rawAddons.filter(
        (a) => baseProduct.adicionais_disponiveis?.includes(a.id) || baseProduct.adicionais_disponiveis?.includes(a.nome)
      );
      if (filtered.length > 0) return filtered;
    }
    return rawAddons;
  }, [rawAddons, baseProduct.adicionais_disponiveis]);

  const permitirTamanhos = baseProduct.permitirTamanhos !== false && sizes.length > 0;
  const permitirBordas = baseProduct.permitirBordas !== false && crusts.length > 0;
  const permitirMassas = baseProduct.permitirMassas !== false && doughs.length > 0;
  const permitirAdicionais = baseProduct.permitirAdicionais !== false && addons.length > 0;

  const defaultCrust = crusts.find(
    (c) => c.id === 'borda_sem' || c.nome.toLowerCase().includes('sem borda')
  ) || crusts[0];

  const [selectedSize, setSelectedSize] = useState(sizes[2] || sizes[0]); // Default Grande or first
  const [isMeioAMeio, setIsMeioAMeio] = useState(false);
  const [flavor1, setFlavor1] = useState(baseProduct.nome.replace('Pizza ', ''));
  const [flavor2, setFlavor2] = useState(PIZZA_FLAVORS[1]?.nome || 'Frango com Catupiry');
  const [selectedCrust, setSelectedCrust] = useState(defaultCrust);
  const [selectedDough, setSelectedDough] = useState(doughs[0]?.nome || 'Tradicional');
  const [selectedAddons, setSelectedAddons] = useState<PizzaExtraOption[]>([]);
  const [observation, setObservation] = useState('');
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (addon: PizzaExtraOption) => {
    if (selectedAddons.some((a) => a.nome === addon.nome)) {
      setSelectedAddons(selectedAddons.filter((a) => a.nome !== addon.nome));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Base price calculation: highest price of selected flavors, scaled by size multiplier
  const calculateUnitPrice = () => {
    let basePrice = baseProduct.preco;
    if (isMeioAMeio) {
      if (flavor1 === 'Pepperoni' || flavor2 === 'Pepperoni') basePrice = 68.0;
      else if (flavor1 === '4 Queijos' || flavor2 === '4 Queijos') basePrice = 64.0;
      else if (flavor1 === 'Frango com Catupiry' || flavor2 === 'Frango com Catupiry') basePrice = 62.0;
      else basePrice = Math.max(55.0, baseProduct.preco);
    }

    const sizeMultiplier = (permitirTamanhos && selectedSize) ? selectedSize.multiplicador : 1.0;
    const sizeAdjusted = basePrice * sizeMultiplier;
    const crustCost = (permitirBordas && selectedCrust) ? selectedCrust.preco : 0;
    const addonsCost = permitirAdicionais ? selectedAddons.reduce((sum, a) => sum + a.preco, 0) : 0;

    return Math.round((sizeAdjusted + crustCost + addonsCost) * 10) / 10;
  };

  const unitPrice = calculateUnitPrice();
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    playAddPop();
    const sabores = isMeioAMeio ? [flavor1, flavor2] : [flavor1];
    const sizeName = (permitirTamanhos && selectedSize) ? selectedSize.nome.split(' ')[0] : '';
    const itemName = isMeioAMeio
      ? `Pizza ${sizeName} Meio a Meio`.trim()
      : (sizeName ? `${baseProduct.nome} (${sizeName})` : baseProduct.nome);

    const orderItem: OrderItem = {
      id: `item_temp_${Date.now()}`,
      produto_id: baseProduct.id,
      nome: itemName,
      tamanho: permitirTamanhos ? selectedSize?.nome : undefined,
      sabores,
      borda: permitirBordas ? selectedCrust : undefined,
      massa: permitirMassas ? selectedDough : undefined,
      adicionais: permitirAdicionais ? selectedAddons : undefined,
      quantidade: quantity,
      preco_unitario: unitPrice,
      preco_total: totalPrice,
      observacao: observation.trim() || undefined,
      status: 'ativo',
    };

    onConfirm(orderItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 flex flex-col max-h-[92vh] sm:my-6">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-800 via-red-700 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="w-10 h-1 bg-white/30 rounded-full mb-1.5 sm:hidden" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Personalizar Produto
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">{baseProduct.nome}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 divide-y divide-stone-100 flex-1">
          {/* Tamanho */}
          {permitirTamanhos && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                1. Escolha o Tamanho
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sizes.map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => {
                      setSelectedSize(sz);
                      if (sz.maxSabores === 1) setIsMeioAMeio(false);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      selectedSize?.id === sz.id
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{sz.nome.split(' ')[0]}</span>
                    <span className="text-[10px] text-stone-500">{sz.fatias} fatias</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sabores / Meio a Meio (For pizzas) */}
          {baseProduct.isPizza && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {permitirTamanhos ? '2. Sabores da Pizza' : 'Sabores da Pizza'}
                </label>
                {permitirTamanhos && selectedSize?.maxSabores > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsMeioAMeio(!isMeioAMeio)}
                    className={`text-xs px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isMeioAMeio
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Pizza Meio a Meio
                  </button>
                )}
              </div>

              {isMeioAMeio ? (
                <div className="space-y-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block mb-1">
                      1º Sabor (1/2):
                    </span>
                    <select
                      value={flavor1}
                      onChange={(e) => setFlavor1(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-stone-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      {PIZZA_FLAVORS.map((f) => (
                        <option key={f.nome} value={f.nome}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900 block mb-1">
                      2º Sabor (1/2):
                    </span>
                    <select
                      value={flavor2}
                      onChange={(e) => setFlavor2(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-stone-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      {PIZZA_FLAVORS.map((f) => (
                        <option key={f.nome} value={f.nome}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    value={flavor1}
                    onChange={(e) => setFlavor1(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  >
                    {PIZZA_FLAVORS.map((f) => (
                      <option key={f.nome} value={f.nome}>
                        {f.nome} — {f.descricao}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Borda Recheada */}
          {permitirBordas && (
            <div className="pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Borda Recheada
              </label>
              <div className="grid grid-cols-2 gap-2">
                {crusts.map((crust) => (
                  <button
                    key={crust.id || crust.nome}
                    type="button"
                    onClick={() => setSelectedCrust(crust)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      selectedCrust?.nome === crust.nome
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{crust.nome}</span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {crust.preco === 0 ? 'Grátis' : `+${formatCurrency(crust.preco)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tipo de Massa */}
          {permitirMassas && (
            <div className="pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Tipo de Massa
              </label>
              <div className="grid grid-cols-3 gap-2">
                {doughs.map((dough) => (
                  <button
                    key={dough.id}
                    type="button"
                    onClick={() => setSelectedDough(dough.nome)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                      selectedDough === dough.nome
                        ? 'border-red-600 bg-red-50 text-red-800 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    {dough.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Adicionais Extras */}
          {permitirAdicionais && (
            <div className="pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Adicionais Opcionais
              </label>
              <div className="grid grid-cols-2 gap-2">
                {addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.nome === addon.nome);
                  return (
                    <button
                      key={addon.id || addon.nome}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`p-2 rounded-xl border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-emerald-600 text-white' : 'border border-stone-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{addon.nome}</span>
                      </div>
                      <span className="text-[10px] text-stone-500">+{formatCurrency(addon.preco)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações Livres */}
          <div className="pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              6. Observação para a Cozinha (Campo Livre)
            </label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder='Ex: "Sem cebola", "Bem passada", "Pouco molho"'
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 dark:text-slate-200 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-stone-300 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1.5 text-stone-600 hover:text-stone-900 dark:text-slate-100 hover:bg-stone-100 rounded-xl disabled:opacity-30 transition cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-stone-800 dark:text-slate-200">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-1.5 text-stone-600 hover:text-stone-900 dark:text-slate-100 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-between transition cursor-pointer active:scale-98"
          >
            <span>Confirmar e Adicionar</span>
            <span className="text-amber-200 font-extrabold">{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
