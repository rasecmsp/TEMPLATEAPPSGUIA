import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CategoryDB { id: string; name: string }
interface SubcategoryDB { id: string; name: string; category_id: string }
interface LocationDB { id: string; name: string }
interface PlanDB {
  id: string | number;
  name: string;
  slug: string;
  months: number;
  price?: number | null;
  active: boolean;
  sort_order?: number | null;
  description?: string | null;
}

interface AnuncieProps {
  categories: CategoryDB[];
  subcategories: SubcategoryDB[];
  locations: LocationDB[];
  onBack: () => void;
  whatsappContact?: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

const Anuncie: React.FC<AnuncieProps> = ({ categories, subcategories, locations, onBack, whatsappContact }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [tripadvisor, setTripadvisor] = useState('');
  const [tags, setTags] = useState('');

  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [locationId, setLocationId] = useState('');

  const [plans, setPlans] = useState<PlanDB[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | number>('');

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (!logoFile) { setLogoPreview(null); return; }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        const rows = (data || []) as PlanDB[];
        setPlans(rows);
        
        // Define o primeiro plano como selecionado apenas se não houver plano selecionado
        if (rows.length > 0 && !selectedPlanId) {
          setSelectedPlanId(rows[0].id);
          setSelectedPlanSlug(rows[0].slug);
        }
      } catch (e: any) {
        console.error('Erro ao carregar planos:', e);
        setPlansError('Não foi possível carregar os planos. Por favor, tente novamente mais tarde.');
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    
    void loadPlans();
    
    // Limpa o estado quando o componente for desmontado
    return () => {
      setPlans([]);
      setSelectedPlanSlug('');
      setSelectedPlanId('');
      setPlansError(null);
    };
  }, []);

  const visibleSubs = useMemo(() => subcategories.filter(s => s.category_id === categoryId), [subcategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validação do plano
      if (!selectedPlanId) {
        throw new Error('Por favor, selecione um plano para continuar.');
      }

      // Verifica se o plano selecionado ainda está disponível
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('O plano selecionado não está mais disponível. Por favor, atualize a página e tente novamente.');
      }

      console.log('Plano selecionado:', selectedPlan);

      // Upload logo (opcional)
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-logo-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `public-submissions/logos/${fileName}`;
        const { error: logoUpErr } = await supabase.storage
          .from('business-images')
          .upload(path, logoFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: logoFile.type,
          });
        if (logoUpErr) throw logoUpErr;
        const { data: logoPub } = supabase.storage.from('business-images').getPublicUrl(path);
        logoUrl = logoPub?.publicUrl || null;
      }

      // Upload imagens (máx. 5)
      const imageUrls: string[] = [];
      for (const file of files.slice(0, 5)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `public-submissions/${fileName}`;
        const { error: upErr } = await supabase.storage
          .from('business-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('business-images').getPublicUrl(path);
        if (pub?.publicUrl) imageUrls.push(pub.publicUrl);
      }

      const catName = categories.find(c => c.id === categoryId)?.name || '';

      // Validação adicional de campos obrigatórios
      if (!name.trim()) throw new Error('O nome do negócio é obrigatório');
      if (!categoryId) throw new Error('A categoria é obrigatória');

      const payload: any = {
        name: name.trim(),
        category: catName,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        location_id: locationId || null,
        description: description || '',
        address: address || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        instagram: instagram || '',
        website: website || null,
        tripadvisor: tripadvisor || null,
        logo: logoUrl || null,
        images: imageUrls,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status: 'pending',
        rating: 0,
        review_count: 0,
        plan: selectedPlanSlug || null,
      };

      // Insere o negócio no banco de dados
      const { error: insErr } = await supabase
        .from('businesses')
        .insert(payload);
        
      if (insErr) throw insErr;

      // Limpa o formulário
      setName('');
      setDescription('');
      setAddress('');
      setPhone('');
      setWhatsapp('');
      setInstagram('');
      setWebsite('');
      setTripadvisor('');
      setTags('');
      setCategoryId('');
      setSubcategoryId('');
      setLocationId('');
      setFiles([]);
      setPreviews([]);
      setLogoFile(null);
      setLogoPreview(null);
      
      // Mantém o mesmo plano selecionado para o próximo cadastro
      if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
        setSelectedPlanSlug(plans[0].slug);
      }
      
      setSuccess('Enviado com sucesso! Seu cadastro entrará na fila de aprovação.');
    } catch (err: any) {
      console.error('Erro ao enviar cadastro:', err);
      setError(err?.message || 'Falha ao enviar cadastro. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <button onClick={onBack} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold mb-4">Voltar</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Anuncie seu negócio</h1>
      <p className="text-gray-600 mb-6">Preencha os dados abaixo. Seu cadastro irá para a fila de aprovação.</p>

      <div className="bg-yellow-50 text-yellow-900 border border-yellow-200 rounded p-3 mb-4 text-sm">
        <p className="mb-1 font-semibold">NOS INFORME CASO A SUA CATEGORIA, SUBCATEGORIA OU LOCAL NÃO ESTEJA DISPONÍVEL.</p>
        {whatsappContact ? (
          <a
            href={`https://wa.me/${whatsappContact}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-700 underline"
          >
            {`Contato: ${whatsappContact.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 $2 $3-$4')}`}
          </a>
        ) : (
          <span>Contato não disponível</span>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 border border-green-200 rounded p-3 mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nome do estabelecimento</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select 
            className="w-full border rounded px-3 py-2" 
            value={categoryId} 
            onChange={e => { 
              setCategoryId(e.target.value); 
              setSubcategoryId(''); 
            }} 
            required
          >
            <option value="">Selecione</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subcategoria</label>
          <select 
            className="w-full border rounded px-3 py-2" 
            value={subcategoryId} 
            onChange={e => setSubcategoryId(e.target.value)}
          >
            <option value="">Selecione</option>
            {visibleSubs.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Local</label>
          <select 
            className="w-full border rounded px-3 py-2" 
            value={locationId} 
            onChange={e => setLocationId(e.target.value)}
          >
            <option value="">Selecione</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={whatsapp} 
            onChange={e => setWhatsapp(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instagram (@)</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={instagram} 
            onChange={e => setInstagram(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            placeholder="https://exemplo.com" 
            value={website} 
            onChange={e => setWebsite(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">TripAdvisor</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            placeholder="URL do TripAdvisor (opcional)" 
            value={tripadvisor} 
            onChange={e => setTripadvisor(e.target.value)} 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Endereço</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea 
            className="w-full border rounded px-3 py-2" 
            rows={4} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Tags (separe por vírgula)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="ex.: familiar, pet friendly, música ao vivo"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">Exemplo de preenchimento: bar, música ao vivo, frente para o mar</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Logomarca</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => { 
              const f = e.target.files?.[0] || null; 
              setLogoFile(f); 
            }} 
          />
          {logoPreview && (
            <div className="mt-2">
              <img src={logoPreview} className="w-24 h-24 object-cover rounded border" alt="Prévia da logomarca" />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Imagens (até 5)</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={e => { 
              const list = Array.from(e.target.files || []).slice(0, 5); 
              setFiles(list); 
            }} 
          />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previews.map((src, idx) => (
                <img key={idx} src={src} className="w-24 h-24 object-cover rounded border" alt={`Prévia ${idx + 1}`} />
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Plano <span className="text-red-500">*</span></label>

          {plansLoading ? (
            <div className="p-4 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">Carregando planos disponíveis...</p>
            </div>
          ) : plansError ? (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4 text-sm">
              {plansError}
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded p-3 mb-4 text-sm">
              Nenhum plano disponível no momento. Por favor, tente novamente mais tarde.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p) => {
                const priceText = typeof p.price === 'number'
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)
                  : 'Consultar';
                const checked = selectedPlanId === p.id;
                
                return (
                  <label
                    key={p.id}
                    className={`${checked ? 'border-cyan-600 ring-1 ring-cyan-600' : 'border-gray-200'} cursor-pointer block border rounded-lg p-4 hover:border-cyan-500 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="plan"
                          value={p.id}
                          checked={checked}
                          onChange={() => {
                            setSelectedPlanId(p.id);
                            setSelectedPlanSlug(p.slug);
                          }}
                          className="accent-cyan-600"
                          required
                          aria-required="true"
                        />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{priceText}</div>
                        <div className="text-xs text-gray-500">
                          {p.months} {p.months === 1 ? 'mês' : 'meses'}
                        </div>
                      </div>
                    </div>
                    {p.description && <p className="mt-2 text-sm text-gray-600">{p.description}</p>}
                  </label>
                );
              })}
            </div>
          )}

          <p className="mt-2 text-sm font-semibold text-red-600">
            APÓS O SEU CADASTRO UM RESPONSÁVEL ENTRARÁ EM CONTATO.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Todos os planos incluem a divulgação total no app e nas redes sociais do app.
          </p>
        </div>

        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-5 py-2 rounded disabled:opacity-60"
          >
            {saving ? 'Enviando...' : 'Enviar para aprovação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Anuncie;

