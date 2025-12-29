import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type SectionRow = {
  id: string;
  title: string;
  bullets: string[];
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const AdminComoChegar: React.FC = () => {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form (novo/edição)
  const [editingId, setEditingId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [bulletsText, setBulletsText] = useState(''); // 1 por linha
  const bulletsRef = useRef<HTMLTextAreaElement | null>(null);

  // Helpers de formatação simples (inserem HTML inline)
  const wrapSelection = (before: string, after: string = before) => {
    const ta = bulletsRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const value = bulletsText;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    setBulletsText(newValue);
    // reposiciona o cursor após a inserção
    const pos = start + before.length + selected.length + after.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertLink = () => {
    const url = prompt('Informe a URL do link:');
    if (!url) return;
    const ta = bulletsRef.current;
    const hasSelection = !!ta && (ta.selectionStart ?? 0) !== (ta.selectionEnd ?? 0);
    if (hasSelection) {
      wrapSelection(`<a href="${url}" target="_blank" rel="noopener">`, '</a>');
    } else {
      // se não há seleção, insere um link com texto genérico
      const anchor = `<a href="${url}" target="_blank" rel="noopener">link</a>`;
      setBulletsText((v) => v + (v.endsWith('\n') || v.length === 0 ? '' : ' ') + anchor);
    }
  };
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [ctaText, setCtaText] = useState<string>('');
  const [ctaUrl, setCtaUrl] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.created_at.localeCompare(b.created_at)),
    [rows]
  );

  const resetForm = () => {
    setEditingId('');
    setTitle('');
    setBulletsText('');
    setImageFiles([]);
    setImageUrls([]);
    setCtaText('');
    setCtaUrl('');
    setVisible(true);
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('como_chegar_sections')
      .select('id, title, bullets, image_url, images, cta_text, cta_url, sort_order, visible, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      setErr(error.message);
    } else if (Array.isArray(data)) {
      setRows(
        data.map((d: any) => ({
          id: d.id,
          title: d.title,
          bullets: Array.isArray(d.bullets) ? d.bullets : [],
          image_url: d.image_url,
          cta_text: d.cta_text,
          cta_url: d.cta_url,
          sort_order: d.sort_order ?? 0,
          visible: !!d.visible,
          created_at: d.created_at,
          // keep images alongside row via cast on usage
          images: Array.isArray(d.images) ? d.images : (d.image_url ? [d.image_url] : []),
        })) as any
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startEdit = (r: SectionRow) => {
    setEditingId(r.id);
    setTitle(r.title);
    setBulletsText((r.bullets || []).join('\n'));
    setImageFiles([]);
    const existingImages = (r as any).images && Array.isArray((r as any).images)
      ? (r as any).images as string[]
      : (r.image_url ? [r.image_url] : []);
    setImageUrls(existingImages);
    setCtaText(r.cta_text || '');
    setCtaUrl(r.cta_url || '');
    setVisible(!!r.visible);
    window.scrollTo(0, 0);
  };

  const uploadImagesIfNeeded = async (): Promise<string[]> => {
    // If no new files selected, keep existing URLs
    if (!imageFiles.length) return imageUrls;

    const uploaded: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `como-chegar/${fileName}`;
      const { error: upErr } = await supabase.storage.from('page-media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('page-media').getPublicUrl(path);
      if (pub?.publicUrl) uploaded.push(pub.publicUrl);
    }
    return uploaded;
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const bullets = bulletsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const imgs = await uploadImagesIfNeeded();

      if (editingId) {
        const { error } = await supabase
          .from('como_chegar_sections')
          .update({
            title: title.trim(),
            bullets,
            image_url: (imgs && imgs[0]) ? imgs[0] : (imageUrls[0] || null),
            images: (imgs && imgs.length ? imgs : imageUrls),
            cta_text: ctaText || null,
            cta_url: ctaUrl || null,
            visible,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { data: maxOrder } = await supabase
          .from('como_chegar_sections')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();
        const nextOrder = (maxOrder?.sort_order ?? 0) + 1;

        const { error } = await supabase.from('como_chegar_sections').insert({
          title: title.trim(),
          bullets,
          image_url: (imgs && imgs[0]) ? imgs[0] : null,
          images: imgs || [],
          cta_text: ctaText || null,
          cta_url: ctaUrl || null,
          sort_order: nextOrder,
          visible,
        });
        if (error) throw error;
      }
      resetForm();
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover esta seção?')) return;
    const { error } = await supabase.from('como_chegar_sections').delete().eq('id', id);
    if (error) setErr(error.message);
    else await load();
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = sortedRows.findIndex((r) => r.id === id);
    const target = sortedRows[idx + dir];
    if (!target) return;
    const cur = sortedRows[idx];
    await supabase.rpc('swap_como_chegar_order', { a: cur.id, b: target.id });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Conteúdo - Como Chegar</h2>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload de imagens</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
            {!!imageUrls.length && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {imageUrls.map((url, idx) => (
                  <img key={idx} src={url} className="w-20 h-20 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Bullets (um por linha)</label>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => wrapSelection('<b>', '</b>')} className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Negrito</button>
              <button type="button" onClick={() => wrapSelection('<i>', '</i>')} className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Itálico</button>
              <button type="button" onClick={insertLink} className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Link</button>
              <button type="button" onClick={() => wrapSelection('<span style="font-size: 1.125em">', '</span>')} className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">A+</button>
              <button type="button" onClick={() => wrapSelection('<span style="font-size: 0.875em">', '</span>')} className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">A-</button>
            </div>
            <textarea
              ref={bulletsRef}
              className="w-full border rounded px-3 py-2"
              rows={6}
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
              placeholder="Cada linha será um item da lista. Você pode usar formatação básica (Negrito, Itálico, Link)."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Texto do botão</label>
            <input className="w-full border rounded px-3 py-2" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL do botão</label>
            <input className="w-full border rounded px-3 py-2" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input id="vis" type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <label htmlFor="vis" className="text-sm">Visível</label>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar seção'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="ml-2 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Seções</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="space-y-2">
            {sortedRows.map((r, idx) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6 text-right">{(r.sort_order ?? idx) + 1}</span>
                  <img src={(r as any).images?.[0] || r.image_url || ''} className="w-10 h-10 rounded object-cover border" onError={(e)=>{(e.target as HTMLImageElement).style.visibility='hidden';}} />
                  <div className="flex flex-col">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-gray-500">{r.visible ? 'Visível' : 'Oculta'} • {r.bullets?.length || 0} itens</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => move(r.id, -1)} className="px-2 py-1 rounded text-xs bg-gray-100">▲</button>
                  <button onClick={() => move(r.id, 1)} className="px-2 py-1 rounded text-xs bg-gray-100">▼</button>
                  <button onClick={() => startEdit(r)} className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">Editar</button>
                  <button onClick={() => remove(r.id)} className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComoChegar;