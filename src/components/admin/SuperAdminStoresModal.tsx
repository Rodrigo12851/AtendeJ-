import React, { useState } from 'react';
import { Building2, Plus, Copy, Check, ShieldCheck, MapPin, Phone, DollarSign, X, ExternalLink } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { hashPassword } from '../../utils/security';

interface SuperAdminStoresModalProps {
  onClose: () => void;
}

export const SuperAdminStoresModal: React.FC<SuperAdminStoresModalProps> = ({ onClose }) => {
  const { lojas, users, createStoreWithAdmin } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form State
  const [nomeLoja, setNomeLoja] = useState('');
  const [slugLoja, setSlugLoja] = useState('');
  const [enderecoLoja, setEnderecoLoja] = useState('');
  const [telefoneLoja, setTelefoneLoja] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState('7.50');

  // Admin User Form State
  const [adminNome, setAdminNome] = useState('');
  const [adminUsuario, setAdminUsuario] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminPin, setAdminPin] = useState('1234');

  const handleCopyLink = (loja: { slug: string; marca?: string; nome?: string; logo_url?: string }) => {
    const origin = window.location.origin;
    let url = `${origin}/?loja=${loja.slug}`;
    if (loja.marca) url += `&marca=${encodeURIComponent(loja.marca)}`;
    if (loja.nome) url += `&nome=${encodeURIComponent(loja.nome)}`;
    if (loja.logo_url && !loja.logo_url.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(loja.logo_url)}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedSlug(loja.slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLoja || !slugLoja || !adminNome || !adminUsuario || !adminPin) return;
    if (adminSenha.trim().length < 6) {
      alert('A senha do administrador deve conter no mínimo 6 caracteres.');
      return;
    }

    const { hash, salt } = await hashPassword(adminSenha.trim());

    createStoreWithAdmin(
      {
        nome: nomeLoja,
        slug: slugLoja.toLowerCase().trim().replace(/\s+/g, '-'),
        endereco: enderecoLoja,
        telefone: telefoneLoja,
        taxa_entrega: parseFloat(taxaEntrega.replace(',', '.')) || 0,
      },
      {
        nome: adminNome,
        usuario: adminUsuario.trim().toLowerCase(),
        senhaHash: hash,
        salt,
        senha: '',
        pin: adminPin,
      }
    );

    // Reset Form
    setNomeLoja('');
    setSlugLoja('');
    setEnderecoLoja('');
    setTelefoneLoja('');
    setAdminNome('');
    setAdminUsuario('');
    setAdminSenha('');
    setAdminPin('1234');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Gestão de Lojas & Franquias
                <span className="bg-amber-400/20 text-amber-300 text-[10px] uppercase px-2 py-0.5 rounded-full font-mono border border-amber-400/30">
                  Dono do App (Super Admin)
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Cadastre novas filiais, vincule seus gerentes e gere os links de delivery dos clientes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Bar Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Lojas Cadastradas na Rede ({lojas.length})
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar Nova Loja</span>
              </button>
            )}
          </div>

          {/* New Store Form */}
          {showAddForm && (
            <form onSubmit={handleCreateStore} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-600" />
                  Cadastrar Nova Filial & Administrador da Loja
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              {/* Store Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                    Nome da Filial / Loja:
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeLoja}
                    onChange={(e) => {
                      setNomeLoja(e.target.value);
                      if (!slugLoja) {
                        setSlugLoja(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }
                    }}
                    placeholder="Ex: Pizzaria Itália — Morumbi"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                    Slug da URL (para o link do cliente):
                  </label>
                  <div className="flex items-center bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-500 font-mono">
                    <span className="text-stone-400 mr-1">?loja=</span>
                    <input
                      type="text"
                      required
                      value={slugLoja}
                      onChange={(e) => setSlugLoja(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="loja-morumbi"
                      className="w-full bg-transparent text-stone-900 dark:text-slate-100 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                    Endereço Completo:
                  </label>
                  <input
                    type="text"
                    value={enderecoLoja}
                    onChange={(e) => setEnderecoLoja(e.target.value)}
                    placeholder="Ex: Av. Morumbi, 4500"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={telefoneLoja}
                      onChange={(e) => setTelefoneLoja(e.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Taxa de Entrega (R$):
                    </label>
                    <input
                      type="text"
                      value={taxaEntrega}
                      onChange={(e) => setTaxaEntrega(e.target.value)}
                      placeholder="7.50"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Admin User Details */}
              <div className="pt-2 border-t border-stone-200 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Conta do Gerente / Administrador da Filial
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Nome do Gerente:
                    </label>
                    <input
                      type="text"
                      required
                      value={adminNome}
                      onChange={(e) => setAdminNome(e.target.value)}
                      placeholder="Ex: Lucas Ferreira"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Usuário de Login:
                    </label>
                    <input
                      type="text"
                      required
                      value={adminUsuario}
                      onChange={(e) => setAdminUsuario(e.target.value)}
                      placeholder="admin.morumbi"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      PIN Numérico (4 dígitos):
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-center text-stone-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar e Criar Filial
                </button>
              </div>
            </form>
          )}

          {/* List of Stores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lojas.map((loja) => {
              const adminUser = users.find((u) => u.loja_id === loja.id && u.perfil === 'admin');
              const isCopied = copiedSlug === loja.slug;
              const deliveryUrl = `${window.location.origin}/?loja=${loja.slug}${loja.marca ? `&marca=${encodeURIComponent(loja.marca)}` : ''}${loja.nome ? `&nome=${encodeURIComponent(loja.nome)}` : ''}${loja.logo_url && !loja.logo_url.startsWith('data:') ? `&logo=${encodeURIComponent(loja.logo_url)}` : ''}`;

              return (
                <div
                  key={loja.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3 hover:border-amber-400/60 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{loja.nome}</span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">
                          Ativa
                        </span>
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {loja.endereco || 'Sem endereço'}
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {loja.telefone || 'Sem telefone'}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-stone-700 dark:text-slate-300 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                      Taxa: R$ {loja.taxa_entrega?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  {/* Admin Assignment */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">Gerente da Loja:</span>
                    <span className="font-bold text-stone-800 dark:text-slate-200 font-mono">
                      {adminUser ? `${adminUser.nome} (@${adminUser.usuario})` : 'Nenhum atribuído'}
                    </span>
                  </div>

                  {/* Public Delivery Link (Anota AI Style) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center justify-between">
                      <span>🔗 Link do Cardápio para Clientes:</span>
                      <a
                        href={deliveryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-700 hover:underline text-[10px] flex items-center gap-0.5"
                      >
                        Abrir Cardápio <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={deliveryUrl}
                        className="w-full px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 dark:text-slate-300 select-all"
                      />
                      <button
                        onClick={() => handleCopyLink(loja)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
