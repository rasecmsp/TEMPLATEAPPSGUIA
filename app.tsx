import React, { useState, useMemo, useEffect, useRef } from 'react';
import Carousel from './components/Carousel';
import SearchBar from './components/SearchBar';
import ActionButtons from './components/ActionButtons';
import BusinessList from './components/BusinessList';
import BusinessDetail from './components/BusinessDetail';
import Footer from './components/Footer';
import { Business } from './types';
import { BUSINESSES, CAROUSEL_IMAGES } from './constants';
import { createClient, Session } from '@supabase/supabase-js';
import Anuncie from './components/anuncie';
import ComoChegar from './components/ComoChegar';
import AdminComoChegar from './components/AdminComoChegar';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

interface AdminBusiness {
  id: string | number;
  name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  tripadvisor?: string;
  website?: string;
  logo?: string;
  created_at?: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  location_id?: string | null;
  plan?: string | null;
}

interface CarouselItemDB {
  id: string | number;
  image_url: string;
  is_ad: boolean;
  cta_text: string | null;
  cta_url: string | null;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

interface CategoryDB { id: string; name: string; sort_order?: number | null; hidden?: boolean | null; }
interface SubcategoryDB { id: string; name: string; category_id: string; sort_order?: number | null; hidden?: boolean | null; }
interface LocationDB { id: string; name: string; sort_order?: number | null; hidden?: boolean | null; }

interface EventDB {
  id: string | number;
  title: string;
  date: string; // ISO date
  time?: string | null;
  location_id?: string | null;
  local_text?: string | null;
  description?: string | null;
  banner_url?: string | null;
  link?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  visible: boolean;
  is_pinned?: boolean | null;
  sort_order?: number | null;
  created_at?: string;
}

const PUBLIC_PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800&auto=format&fit=crop';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'none' | 'login' | 'admin' | 'anuncie' | 'comoChegar' | 'tours' | 'useful' | 'phones' | 'photos' | 'historyPage' | 'events' | 'eventDetail'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const [adminBusinesses, setAdminBusinesses] = useState<AdminBusiness[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [newBiz, setNewBiz] = useState<Partial<AdminBusiness>>({ name: '', category: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', tripadvisor: '', website: '' });
  const [newBizTags, setNewBizTags] = useState<string>('');
  const [newBizFiles, setNewBizFiles] = useState<File[]>([]);
  const [newBizPreviews, setNewBizPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [publicBusinesses, setPublicBusinesses] = useState<Business[]>([]);
  const [publicBusinessesRaw, setPublicBusinessesRaw] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  const [guide, setGuide] = useState({ 
    app_name: 'Guia Boipeba', 
    whatsapp: '', 
    favicon_url: '', 
    splash_url: '', 
    app_icon_url: '' 
  });
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [splashFile, setSplashFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const whatsappDigits = (guide.whatsapp || '').replace(/\D/g, '');

  // Public Useful info state
  const [usefulPublic, setUsefulPublic] = useState<any[]>([]);
  const [usefulPublicLoading, setUsefulPublicLoading] = useState(false);
  const [usefulPublicError, setUsefulPublicError] = useState<string | null>(null);

  // Phones - público
  const [publicPhones, setPublicPhones] = useState<any[]>([]);
  const [publicPhonesLoading, setPublicPhonesLoading] = useState(false);
  const [publicPhonesError, setPublicPhonesError] = useState<string | null>(null);
  const [phonesCatId, setPhonesCatId] = useState<string>('');
  const [phonesSubId, setPhonesSubId] = useState<string>('');

  // Fotos - público
  const [publicPhotos, setPublicPhotos] = useState<any[]>([]);
  const [publicPhotosLoading, setPublicPhotosLoading] = useState(false);
  const [publicPhotosError, setPublicPhotosError] = useState<string | null>(null);

  // História - público
  const [historyPublicBody, setHistoryPublicBody] = useState<string>('');
  const [historyPublicImages, setHistoryPublicImages] = useState<any[]>([]);
  const [historyPublicLoading, setHistoryPublicLoading] = useState(false);
  const [historyPublicError, setHistoryPublicError] = useState<string | null>(null);

  // Passeios & Atividades - público
  const [toursSections, setToursSections] = useState<Array<{ id: string; title: string; bullets: string[]; image_url?: string | null; cta_text?: string | null; cta_url?: string | null }>>([]);
  const mockTour = {
    id: 'mock-1',
    title: 'Passeio de Exemplo',
    bullets: ['Item fictício 1', 'Item fictício 2'],
    image_url: PUBLIC_PLACEHOLDER_IMG,
    cta_text: 'Saiba mais',
    cta_url: '#'
  };

  // Funções CRUD para Planos
  const fetchPlans = async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPlans((data || []) as any);
    } catch (err: any) {
      setPlansError(err.message);
    } finally {
      setPlansLoading(false);
    }
  };

  const editPlan = (p: any) => {
    setPlanEditingId(p.id);
    setPlanForm({
      name: p.name || '',
      slug: p.slug || '',
      months: Number(p.months) || 0,
      price: p.price ?? null,
      active: !!p.active,
      sort_order: p.sort_order ?? 0,
      description: p.description ?? ''
    });
  };

  const createOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlansLoading(true);
    setPlansError(null);
    try {
      if (!planForm.name.trim() || !planForm.slug.trim() || !planForm.months) throw new Error('Preencha nome, slug e duração (meses)');
      const payload: any = {
        name: planForm.name.trim(),
        slug: planForm.slug.trim(),
        months: Number(planForm.months),
        price: planForm.price ?? null,
        active: !!planForm.active,
        sort_order: planForm.sort_order ?? 0,
        description: planForm.description || null,
      };
      if (planEditingId) {
        const { error } = await supabase.from('plans').update(payload).eq('id', planEditingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('plans').insert([payload]);
        if (error) throw error;
      }
      setPlanEditingId(null);
      setPlanForm({ name: '', slug: '', months: 6, price: null, active: true, sort_order: 0, description: '' });
      await fetchPlans();
    } catch (err: any) {
      setPlansError(err.message);
    } finally {
      setPlansLoading(false);
    }
  };

  const deletePlan = async (id: string | number) => {
    if (!confirm('Excluir plano?')) return;
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      await fetchPlans();
    } catch (err: any) {
      setPlansError(err.message);
    }
  };
  const toursDisplay = useMemo(() => [mockTour, ...toursSections], [toursSections]);
  const [toursLoading, setToursLoading] = useState(false);

  const fetchGuideSettings = async () => {
  setGuideLoading(true); setGuideError(null);
  const { data, error } = await supabase.from('guide_settings').select('*').eq('id', true).single();
  if (error) setGuideError(error.message);
  else if (data) setGuide({
    app_name: data.app_name || 'Guia Boipeba',
    whatsapp: data.whatsapp || '',
    favicon_url: data.favicon_url || '',
    splash_url: data.splash_url || '',
    app_icon_url: data.app_icon_url || ''
  });
  setGuideLoading(false);
};

const uploadBrandFile = async (file: File, kind: 'favicon' | 'splash' | 'icon') => {
  const ext = file.name.split('.').pop() || 'png';
  const name = `branding/${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('site-media').upload(name, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('site-media').getPublicUrl(name);
  return data?.publicUrl || '';
};

const saveGuideSettings = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setGuideLoading(true); setGuideError(null);
    let { favicon_url, splash_url, app_icon_url } = guide;
    if (faviconFile) favicon_url = await uploadBrandFile(faviconFile, 'favicon');
    if (splashFile) splash_url = await uploadBrandFile(splashFile, 'splash');
    if (iconFile) app_icon_url = await uploadBrandFile(iconFile, 'icon');

    const payload = { id: true, app_name: guide.app_name, whatsapp: guide.whatsapp, favicon_url, splash_url, app_icon_url, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('guide_settings').upsert(payload).eq('id', true);
    if (error) throw error;
    setGuide(g => ({ ...g, favicon_url, splash_url, app_icon_url }));

    // Atualiza título e favicon dinâmico
    document.title = guide.app_name || 'Guia';
    let fav = document.querySelector<HTMLLinkElement>('link[rel="icon"]#dynamic-favicon');
    if (!fav) { fav = document.createElement('link'); fav.rel = 'icon'; fav.id = 'dynamic-favicon'; document.head.appendChild(fav); }
    if (favicon_url) fav.href = favicon_url;

    // Recarrega do banco para refletir exatamente o persistido
    await fetchGuideSettings();
    alert('Dados do Guia salvos com sucesso.');
    setFaviconFile(null); setSplashFile(null); setIconFile(null);
  } catch (err: any) {
    setGuideError(err.message || 'Falha ao salvar Dados do Guia');
  } finally {
    setGuideLoading(false);
  }
};




  // Eventos - pÃºblico
  const [publicEvents, setPublicEvents] = useState<EventDB[]>([]);
  const [publicEventsLoading, setPublicEventsLoading] = useState(false);
  const [publicEventsError, setPublicEventsError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDB | null>(null);

  // Home filters (Categoria > Subcategoria > Local)
  const [homeCategoryId, setHomeCategoryId] = useState<string>('');
  const [homeSubcategoryId, setHomeSubcategoryId] = useState<string>('');
  const [homeLocationId, setHomeLocationId] = useState<string>('');
  // Rating filter (min stars)
  const [homeRatingMin, setHomeRatingMin] = useState<number>(0);

  const [adminTab, setAdminTab] = useState<'businesses' | 'events' | 'phones' | 'useful' | 'history' | 'photos' | 'carousel' | 'categories' | 'comoChegar' | 'tours' | 'plans' | 'guide'>('businesses');
  const [carouselAdminItems, setCarouselAdminItems] = useState<CarouselItemDB[]>([]);
  const [carouselPublicItems, setCarouselPublicItems] = useState<CarouselItemDB[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselError, setCarouselError] = useState<string | null>(null);
  const [carouselEditingId, setCarouselEditingId] = useState<string | number | null>(null);
  const [carouselForm, setCarouselForm] = useState<{ is_ad: boolean; cta_text: string; cta_url: string; sort_order: number; active: boolean }>({ is_ad: false, cta_text: '', cta_url: '', sort_order: 0, active: true });
  const [carouselFile, setCarouselFile] = useState<File | null>(null);
  const [carouselPreview, setCarouselPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Plans admin state
  interface PlanDB { id: string | number; name: string; slug: string; months: number; price?: number | null; active: boolean; sort_order?: number | null; description?: string | null }
  const [plans, setPlans] = useState<PlanDB[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [planEditingId, setPlanEditingId] = useState<string | number | null>(null);
  const [planForm, setPlanForm] = useState<{ name: string; slug: string; months: number; price: number | null; active: boolean; sort_order: number | null; description: string | null }>({ name: '', slug: '', months: 6, price: null, active: true, sort_order: 0, description: '' });

  useEffect(() => {
    if (adminTab === 'plans' || adminTab === 'businesses') {
      fetchPlans();
    }
  }, [adminTab]);

  const getPlanLabel = (slug?: string | null) => {
    if (!slug) return '—';
    const found = plans.find(p => p.slug === slug);
    return found?.name || slug;
  };

  // Phones admin state
  const [phones, setPhones] = useState<any[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneEditingId, setPhoneEditingId] = useState<string | null>(null);
  const [phoneForm, setPhoneForm] = useState<{ name: string; phone: string; whatsapp: string; visible: boolean; category_id: string; subcategory_id: string }>({ name: '', phone: '', whatsapp: '', visible: true, category_id: '', subcategory_id: '' });
  const [phoneFilterCatId, setPhoneFilterCatId] = useState<string>('');
  const [phoneFilterSubId, setPhoneFilterSubId] = useState<string>('');

  // Eventos admin state
  const [events, setEvents] = useState<EventDB[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{ title: string; date: string; time: string; location_id: string; local_text: string; description: string; banner_url: string; link: string; instagram_url: string; facebook_url: string; visible: boolean; is_pinned: boolean; sort_order: number }>({ title: '', date: '', time: '', location_id: '', local_text: '', description: '', banner_url: '', link: '', instagram_url: '', facebook_url: '', visible: true, is_pinned: false, sort_order: 0 });
  const [eventBannerFile, setEventBannerFile] = useState<File | null>(null);
  const [eventBannerPreview, setEventBannerPreview] = useState<string>('');

  // Hierarchical categories data
  const [categories, setCategories] = useState<CategoryDB[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryDB[]>([]);
  const [locations, setLocations] = useState<LocationDB[]>([]);

  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Forms for admin categories
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryCatId, setNewSubcategoryCatId] = useState('');
  const [newLocationName, setNewLocationName] = useState('');

  // Inline edit states
  const [editingCatId, setEditingCatId] = useState<string>('');
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [editingSubId, setEditingSubId] = useState<string>('');
  const [editingSubName, setEditingSubName] = useState<string>('');
  const [editingLocId, setEditingLocId] = useState<string>('');
  const [editingLocName, setEditingLocName] = useState<string>('');

  // Drag & Drop state for admin ordering
  const [dragging, setDragging] = useState<{ type: 'category' | 'subcategory' | 'location'; id: string } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<{ type: 'category' | 'subcategory' | 'location'; id: string } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isPointerDragRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isCoarsePointer = useMemo(() => {
    try { return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
  }, []);
  const prevTouchActionRef = useRef<string | undefined>(undefined);
  const prevOverscrollRef = useRef<string | undefined>(undefined);
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Record<string, boolean>>({});

  // Undo buffers for last reorder
  const lastCategoriesOrderRef = useRef<any[] | null>(null);
  const lastSubcategoriesOrderRef = useRef<{ catId: string; list: any[] } | null>(null);
  const lastLocationsOrderRef = useRef<any[] | null>(null);

  // Drag ghost utilities
  const dragCleanupRef = useRef<null | (() => void)>(null);
  const createDragImageEl = (text: string) => {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.pointerEvents = 'none';
    el.style.padding = '6px 10px';
    el.style.border = '1px solid #e5e7eb';
    el.style.borderRadius = '6px';
    el.style.background = '#fff';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
    el.style.fontSize = '12px';
    el.style.fontWeight = '600';
    el.style.color = '#111827';
    el.textContent = text;
    document.body.appendChild(el);
    return { el, cleanup: () => { try { document.body.removeChild(el); } catch {} } };
  };

  // Business form selected IDs
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formSubcategoryId, setFormSubcategoryId] = useState<string>('');
  const [formLocationId, setFormLocationId] = useState<string>('');

  // Informações Úteis (admin) - ESTADOS ÃšNICOS
  const [usefulRows, setUsefulRows] = useState<any[]>([]);
  const [usefulLoading, setUsefulLoading] = useState(false);
  const [usefulError, setUsefulError] = useState<string | null>(null);
  const [usefulForm, setUsefulForm] = useState<{ title: string; body: string; sort_order: number; visible: boolean }>({
    title: '',
    body: '',
    sort_order: 0,
    visible: true,
  });
  const [usefulEditingId, setUsefulEditingId] = useState<string | null>(null);

  // História (texto + galeria)
  const [historyBody, setHistoryBody] = useState<string>('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyImages, setHistoryImages] = useState<any[]>([]);
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [historyCaption, setHistoryCaption] = useState<string>('');
  const [historyEditingId, setHistoryEditingId] = useState<string | null>(null);

  // Fotos (galeria geral)
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoEditingId, setPhotoEditingId] = useState<string | null>(null);

  const [toursAdmin, setToursAdmin] = useState<any[]>([]);
  const [toursAdminLoading, setToursAdminLoading] = useState(false);
  const [toursAdminError, setToursAdminError] = useState<string | null>(null);
  const [toursEditingId, setToursEditingId] = useState<string | null>(null);
  const [toursForm, setToursForm] = useState<{ title: string; bullets: string; image_url: string; cta_text: string; cta_url: string; visible: boolean; sort_order: number }>({ title: '', bullets: '', image_url: '', cta_text: '', cta_url: '', visible: true, sort_order: 0 });
  const [toursImageFile, setToursImageFile] = useState<File | null>(null);
  const [toursImagePreview, setToursImagePreview] = useState<string>('');

  // Active taxonomies with at least one approved business
  const activeCategoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of publicBusinessesRaw) if (b.category_id) set.add(b.category_id as string);
    return set;
  }, [publicBusinessesRaw]);

  const activeSubcategoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of publicBusinessesRaw) {
      if (homeCategoryId && b.category_id !== homeCategoryId) continue;
      if (b.subcategory_id) set.add(b.subcategory_id as string);
    }
    return set;
  }, [publicBusinessesRaw, homeCategoryId]);

  const activeLocationIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of publicBusinessesRaw) {
      if (homeCategoryId && b.category_id !== homeCategoryId) continue;
      if (homeSubcategoryId && b.subcategory_id !== homeSubcategoryId) continue;
      if (b.location_id) set.add(b.location_id as string);
    }
    return set;
  }, [publicBusinessesRaw, homeCategoryId, homeSubcategoryId]);

  const visibleCategories = useMemo(() => categories.filter(c => !c.hidden && activeCategoryIds.has(c.id)), [categories, activeCategoryIds]);
  const visibleSubcategories = useMemo(() => subcategories.filter(s => s.category_id === homeCategoryId && !s.hidden && activeSubcategoryIds.has(s.id)), [subcategories, homeCategoryId, activeSubcategoryIds]);
  const visibleLocations = useMemo(() => locations.filter(l => !l.hidden && activeLocationIds.has(l.id)), [locations, activeLocationIds]);

  // Auto-reset selections if they become empty
  useEffect(() => {
    if (homeCategoryId && !activeCategoryIds.has(homeCategoryId)) {
      setHomeCategoryId('');
      setHomeSubcategoryId('');
      setHomeLocationId('');
    }
  }, [homeCategoryId, activeCategoryIds]);

  useEffect(() => {
    if (homeSubcategoryId && !activeSubcategoryIds.has(homeSubcategoryId)) {
      setHomeSubcategoryId('');
      setHomeLocationId('');
    }
  }, [homeSubcategoryId, activeSubcategoryIds]);

  useEffect(() => {
    if (homeLocationId && !activeLocationIds.has(homeLocationId)) {
      setHomeLocationId('');
    }
  }, [homeLocationId, activeLocationIds]);

  const MAX_FILES = 5;
  const MAX_FILE_MB = 1; // limite por imagem

  // Upload helper para imagens de empresas
  const uploadBusinessImages = async (businessId: string, files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const urls: string[] = [];
    for (const file of files.slice(0, MAX_FILES)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `businesses/${session?.user?.id || 'anon'}/${businessId}/${name}`;
      const { error: upErr } = await supabase.storage
        .from('site-media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    return urls;
  };

  // Upload helper especÃ­fico para logo
  const uploadLogo = async (businessId: string, logoFile: File): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split('.').pop() || 'jpg';
    const name = `logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `businesses/${session?.user?.id || 'anon'}/${businessId}/${name}`;
    
    const { error: upErr } = await supabase.storage
      .from('site-media')
      .upload(path, logoFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: logoFile.type || 'image/jpeg',
      });
    
    if (upErr) throw upErr;
    
    const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
    return pub?.publicUrl || null;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedBusiness]);

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setView(session ? 'admin' : 'login');
    }
  }, [session]);

  useEffect(() => {
    if (adminTab === 'tours') {
      fetchAdminToursSections();
    }
  }, [adminTab]);

  const logoutRequestedRef = useRef(false);

  // FunÃ§Ãµes de autenticaÃ§Ã£o e admin
  const refreshIsAdmin = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  };

  const checkAdminWithTimeout = async (userId: string): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      const adminPromise = refreshIsAdmin(userId);
      return await Promise.race([adminPromise, timeoutPromise]);
    } catch {
      return false;
    }
  };

  const handleAdmClick = () => {
    window.history.pushState(null, '', '/admin');
    if (session) {
      setView('admin');
    } else {
      setView('login');
    }
  };

  const handleHomeClick = () => {
    window.history.pushState(null, '', '/');
    setSelectedBusiness(null);
    setView('none');
    setHomeCategoryId('');
    setHomeSubcategoryId('');
    setHomeLocationId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      logoutRequestedRef.current = true;
      await supabase.auth.signOut();
    } catch {}
    // fallback para garantir saÃ­da visual mesmo que o listener demore
    setIsAdmin(false);
    setSession(null);
    setView('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthError(null);
  setAuthLoading(true);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange listener cuidarÃ¡ da navegaÃ§Ã£o e checagem de admin
  } catch (err: any) {
    setAuthError(err.message || 'Falha ao entrar');
  } finally {
    setAuthLoading(false);
  }
};

  const handleBack = () => {
    setSelectedBusiness(null);
  };

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
  };

  // Normaliza strings para busca sem acentos
const normalizeForSearch = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const openComoChegar = () => {
    setView('comoChegar');
  };

  const openAnuncie = () => {
    setView('anuncie');
  };

  const openUseful = () => {
    setView('useful');
  };

  const openPhones = async () => {
    setView('phones');
  };

  const openPhotos = async () => {
    setView('photos');
  };

  const openEvents = async () => {
    setView('events');
  };

  // FunÃ§Ãµes para passeios & atividades - PÃšBLICO
  const fetchPublicToursSections = async () => {
    setToursLoading(true);
    try {
      const { data, error } = await supabase
        .from('tours_sections')
        .select('id, title, bullets, image_url, cta_text, cta_url')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && Array.isArray(data)) {
        setToursSections(
          data.map((d: any) => ({
            id: d.id,
            title: d.title,
            bullets: Array.isArray(d.bullets) ? d.bullets : [],
            image_url: d.image_url,
            cta_text: d.cta_text,
            cta_url: d.cta_url,
          }))
        );
      } else {
        setToursSections([]);
      }
    } catch (err) {
      setToursSections([]);
    } finally {
      setToursLoading(false);
    }
  };

  const openTours = async () => {
    setView('tours');
    await fetchPublicToursSections();
  };

  const openHistoryPublic = async () => {
    setView('historyPage');
  };

  // FunÃ§Ãµes para avaliações (admin - dentro de editar)
  const [editReviews, setEditReviews] = useState<any[]>([]);
  const [editReviewsLoading, setEditReviewsLoading] = useState(false);
  const [editReviewsError, setEditReviewsError] = useState<string | null>(null);

  const fetchEditReviews = async (businessId: string | number) => {
    setEditReviewsLoading(true);
    setEditReviewsError(null);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, author, rating, comment, created_at')
        .eq('business_id', String(businessId))
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEditReviews(data || []);
    } catch (err: any) {
      setEditReviewsError(err.message);
    } finally {
      setEditReviewsLoading(false);
    }
  };
  const deleteEditReview = async (reviewId: string, businessId: string | number) => {
    if (!confirm('Excluir esta avaliação?')) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
      await fetchEditReviews(businessId);
      await fetchPublicBusinesses(); // atualiza contadores na Home
    } catch (err: any) {
      setEditReviewsError(err.message);
    }
  };

  // FunÃ§Ãµes para admin businesses
  const fetchAdminBusinesses = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdminBusinesses(data as AdminBusiness[]);
      // verifica e expira anúncios conforme planos
      await checkAndExpireBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const approveBusiness = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;

      try {
        const { data: biz } = await supabase
          .from('businesses')
          .select('name, phone, whatsapp, category_id, subcategory_id')
          .eq('id', id)
          .maybeSingle();
        if (biz?.name) {
          const payloadPhone = {
            name: biz.name,
            phone: biz.phone || null,
            whatsapp: biz.whatsapp || null,
            visible: true,
            category_id: biz.category_id || null,
            subcategory_id: biz.subcategory_id || null,
          } as any;
          const { data: exists } = await supabase
            .from('phone_directory')
            .select('id')
            .eq('name', payloadPhone.name)
            .maybeSingle();
          if (!exists) {
            await supabase.from('phone_directory').insert([payloadPhone]);
          }
        }
      } catch {}

      await fetchAdminBusinesses();
      await fetchPublicBusinesses();
      setEditingId(null);
      await fetchPublicBusinesses();
      await fetchPublicBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    }
  };

  const rejectBusiness = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      await fetchAdminBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    }
  };

  // Expiração automática de anúncios conforme planos
  const checkAndExpireBusinesses = async () => {
    try {
      let activePlans: Array<{ slug: string; months: number }> = [];
      const { data: planRows, error: planErr } = await supabase
        .from('plans')
        .select('slug, months, active');
      if (!planErr && Array.isArray(planRows)) {
        activePlans = (planRows as any[])
          .filter((p: any) => p?.active && p?.slug && Number(p?.months) > 0)
          .map((p: any) => ({ slug: String(p.slug), months: Number(p.months) }));
      }
      // fallback para planos antigos
      if (activePlans.length === 0) {
        activePlans = [
          { slug: 'semestral', months: 6 },
          { slug: 'anual', months: 12 },
        ];
      }

      for (const p of activePlans) {
        const threshold = new Date();
        threshold.setMonth(threshold.getMonth() - p.months);
        await supabase
          .from('businesses')
          .update({ status: 'rejected' })
          .eq('status', 'approved')
          .eq('plan', p.slug)
          .lt('created_at', threshold.toISOString());
      }
    } catch (e: any) {
      console.warn('Falha ao expirar anúncios:', e?.message);
    }
  };

  const moveBusinessToTours = async (id: string | number) => {
    try {
      const toursCatName = 'Passeios & Atividades';
      const toursCatId = categories.find(c => c.name === toursCatName)?.id || null;
      const { error } = await supabase
        .from('businesses')
        .update({ category: toursCatName, category_id: toursCatId })
        .eq('id', id);
      if (error) throw error;
      await fetchAdminBusinesses();
      await fetchPublicBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    }
  };

  const createBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAdminError(null);
    try {
      const insertRes = await supabase
        .from('businesses')
        .insert([{
          name: newBiz.name,
          category: newBiz.category,
          description: newBiz.description,
          address: newBiz.address,
          phone: newBiz.phone,
          whatsapp: newBiz.whatsapp,
          instagram: newBiz.instagram,
          tripadvisor: newBiz.tripadvisor || null,
          website: newBiz.website || null,
          tags: newBizTags.split(',').map(t => t.trim()).filter(Boolean),
          logo: null, // serÃ¡ atualizado apÃ³s upload se houver logoFile
          status: 'pending',
          category_id: formCategoryId || null,
          subcategory_id: formSubcategoryId || null,
          location_id: formLocationId || null
        }])
        .select('id')
        .single();
      
      if (insertRes.error) throw insertRes.error;
      const newId = String(insertRes.data.id);

      // Garante que o campo textual `category` tenha o nome da categoria selecionada
      const selectedCatName = categories.find(c => c.id === formCategoryId)?.name || '';
      if (selectedCatName) {
        const { error: catTxtErr } = await supabase
          .from('businesses')
          .update({ category: selectedCatName })
          .eq('id', newId);
        if (catTxtErr) console.warn('Falha ao atualizar nome da categoria:', catTxtErr.message);
      }

      // Upload de imagens (se houver) e salva URLs no registro
      if (newBizFiles.length) {
        const urls = await uploadBusinessImages(newId, newBizFiles);
        if (urls.length) {
          const { error: updbErr } = await supabase
            .from('businesses')
            .update({ images: urls })
            .eq('id', newId);
          if (updbErr) throw updbErr;
        }
      }

      // Upload da logo (se houver) e salva URL no registro
      if (logoFile) {
        const logoUrl = await uploadLogo(newId, logoFile);
        if (logoUrl) {
          const { error: logoErr } = await supabase
            .from('businesses')
            .update({ logo: logoUrl })
            .eq('id', newId);
          if (logoErr) throw logoErr;
        }
      }

      try {
        const payloadPhone = {
          name: newBiz.name,
          phone: newBiz.phone || null,
          whatsapp: newBiz.whatsapp || null,
          visible: true,
          category_id: formCategoryId || null,
          subcategory_id: formSubcategoryId || null,
        } as any;
        if (payloadPhone.name) {
          const { data: exists } = await supabase
            .from('phone_directory')
            .select('id')
            .eq('name', payloadPhone.name)
            .maybeSingle();
          if (!exists) {
            await supabase.from('phone_directory').insert([payloadPhone]);
          }
        }
      } catch {}

      // Reset form
      setNewBiz({ name: '', category: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', tripadvisor: '', website: '', logo: '' });
      setNewBizTags('');
      setNewBizFiles([]);
      setNewBizPreviews([]);
      setLogoFile(null);
      setLogoPreview('');
      setFormCategoryId('');
      setFormSubcategoryId('');
      setFormLocationId('');
      await fetchAdminBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAdminError(null);
    try {
      const updRes = await supabase
        .from('businesses')
        .update({
          name: newBiz.name,
          category: newBiz.category,
          description: newBiz.description,
          address: newBiz.address,
          phone: newBiz.phone,
          whatsapp: newBiz.whatsapp,
          instagram: newBiz.instagram,
          tripadvisor: newBiz.tripadvisor || null,
          website: newBiz.website || null,
          tags: newBizTags.split(',').map(t => t.trim()).filter(Boolean),
          category_id: formCategoryId || null,
          subcategory_id: formSubcategoryId || null,
          location_id: formLocationId || null
        })
        .eq('id', editingId)
        .select('id')
        .single();
      
      if (updRes.error) throw updRes.error;

      // Atualiza o campo textual `category` com o nome da categoria escolhida
      if (formCategoryId) {
        const selectedCatName = categories.find(c => c.id === formCategoryId)?.name || '';
        if (selectedCatName) {
          const { error: catTxtErr } = await supabase
            .from('businesses')
            .update({ category: selectedCatName })
            .eq('id', editingId);
          if (catTxtErr) throw catTxtErr;
        }
      }

      // Upload da logo (se houver) e salva URL no registro
      if (logoFile) {
        const logoUrl = await uploadLogo(String(editingId), logoFile);
        if (logoUrl) {
          const { error: logoErr } = await supabase
            .from('businesses')
            .update({ logo: logoUrl })
            .eq('id', editingId);
          if (logoErr) throw logoErr;
        }
      }

      // Upload de novas fotos (se selecionadas) e substitui o array `images`
      if (newBizFiles.length) {
        const urls = await uploadBusinessImages(String(editingId), newBizFiles);
        if (urls.length) {
          const { error: imgsErr } = await supabase
            .from('businesses')
            .update({ images: urls })
            .eq('id', editingId);
          if (imgsErr) throw imgsErr;
        }
      }

      setNewBizFiles([]);
      setNewBizPreviews([]);
      setLogoFile(null);
      setLogoPreview('');
      setNewBiz({ name: '', category: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', tripadvisor: '', website: '', logo: '' });
      setNewBizTags('');
      setFormCategoryId('');
      setFormSubcategoryId('');
      setFormLocationId('');
      await fetchAdminBusinesses();
    } catch (error: any) {
      setAdminError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchAdminToursSections = async () => {
    setToursAdminLoading(true);
    setToursAdminError(null);
    try {
      const { data, error } = await supabase
        .from('tours_sections')
        .select('id, title, bullets, image_url, cta_text, cta_url, visible, sort_order, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setToursAdmin(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setToursAdminError(err.message || 'Falha ao carregar');
    } finally {
      setToursAdminLoading(false);
    }
  };

  const uploadToursImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `tours/${session?.user?.id || 'anon'}/${name}`;
    const { error } = await supabase.storage
      .from('site-media')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg' });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
    return pub?.publicUrl || '';
  };

  const createTourSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setToursAdminError(null);
    try {
      let imageUrl = toursForm.image_url;
      if (toursImageFile) {
        imageUrl = await uploadToursImage(toursImageFile);
      }
      const bulletsArr = toursForm.bullets
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
      const { error } = await supabase.from('tours_sections').insert([
        { title: toursForm.title, bullets: bulletsArr, image_url: imageUrl || null, cta_text: toursForm.cta_text || null, cta_url: toursForm.cta_url || null, visible: toursForm.visible, sort_order: Number(toursForm.sort_order) || 0 }
      ]);
      if (error) throw error;
      setToursForm({ title: '', bullets: '', image_url: '', cta_text: '', cta_url: '', visible: true, sort_order: 0 });
      setToursImageFile(null);
      setToursImagePreview('');
      await fetchAdminToursSections();
      await fetchPublicToursSections();
    } catch (err: any) {
      setToursAdminError(err.message || 'Falha ao salvar');
    }
  };

  const editTourSection = (it: any) => {
    setToursEditingId(String(it.id));
    setToursForm({
      title: it.title || '',
      bullets: Array.isArray(it.bullets) ? it.bullets.join('\n') : '',
      image_url: it.image_url || '',
      cta_text: it.cta_text || '',
      cta_url: it.cta_url || '',
      visible: Boolean(it.visible),
      sort_order: Number(it.sort_order || 0),
    });
    setToursImageFile(null);
    setToursImagePreview(it.image_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateTourSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toursEditingId) return;
    setToursAdminError(null);
    try {
      let imageUrl = toursForm.image_url;
      if (toursImageFile) {
        imageUrl = await uploadToursImage(toursImageFile);
      }
      const bulletsArr = toursForm.bullets
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
      const { error } = await supabase
        .from('tours_sections')
        .update({ title: toursForm.title, bullets: bulletsArr, image_url: imageUrl || null, cta_text: toursForm.cta_text || null, cta_url: toursForm.cta_url || null, visible: toursForm.visible, sort_order: Number(toursForm.sort_order) || 0 })
        .eq('id', toursEditingId);
      if (error) throw error;
      setToursEditingId(null);
      setToursForm({ title: '', bullets: '', image_url: '', cta_text: '', cta_url: '', visible: true, sort_order: 0 });
      setToursImageFile(null);
      setToursImagePreview('');
      await fetchAdminToursSections();
      await fetchPublicToursSections();
    } catch (err: any) {
      setToursAdminError(err.message || 'Falha ao atualizar');
    }
  };

  const deleteTourSection = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    try {
      const { error } = await supabase.from('tours_sections').delete().eq('id', id);
      if (error) throw error;
      await fetchAdminToursSections();
      await fetchPublicToursSections();
    } catch (err: any) {
      setToursAdminError(err.message || 'Falha ao excluir');
    }
  };

  // FunÃ§Ãµes para public businesses
  async function fetchPublicBusinesses() {
    setPublicLoading(true);
    setPublicError(null);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'approved')
        .order('name');
      
      if (error) throw error;
      setPublicBusinessesRaw(data || []);
      
      // Convert to Business type
const businesses: Business[] = (data ?? []).map((b: any) => {
  const imagesArray =
    Array.isArray(b.images)
      ? b.images.filter((s: any) => typeof s === 'string' && s)
      : (typeof b.images === 'string' && b.images ? [b.images] : []);

  return {
    id: b.id,
    name: b.name ?? '',
    category: b.category ?? '',
    description: b.description ?? '',
    address: b.address ?? '',
    phone: b.phone ?? '',
    whatsapp: b.whatsapp ?? '',
    instagram: b.instagram ?? '',
    website: b.website ?? '',
    tripadvisor: b.tripadvisor ?? '',
    logo: (typeof b.logo === 'string' && b.logo) ? b.logo : '',
    images: imagesArray.length > 0 ? imagesArray : [PUBLIC_PLACEHOLDER_IMG],
    rating: Number(b.rating ?? 0),
    reviewCount: Number(b.review_count ?? 0),

    // IDs para filtros (usados no app)
    category_id: b.category_id ?? null,
    subcategory_id: b.subcategory_id ?? null,
    location_id: b.location_id ?? null,

    // Campos requeridos pelo tipo Business
    tags: Array.isArray(b.tags) ? b.tags : [],
    isPremium: Boolean(b.is_premium ?? b.isPremium ?? false),
    reviews: Array.isArray(b.reviews) ? b.reviews : [],
  } as Business;
});
      
      setPublicBusinesses(businesses);
    } catch (error: any) {
      setPublicError(error.message);
    } finally {
      setPublicLoading(false);
    }
  };

  // FunÃ§Ãµes para phones - PÃšBLICO
  const fetchPublicPhones = async () => {
    setPublicPhonesLoading(true);
    setPublicPhonesError(null);
    try {
      let query = supabase.from('phone_directory').select('*').eq('visible', true);
      if (phonesCatId) query = query.eq('category_id', phonesCatId);
      if (phonesSubId) query = query.eq('subcategory_id', phonesSubId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setPublicPhones(data || []);
    } catch (err: any) {
      setPublicPhonesError(err.message);
    } finally {
      setPublicPhonesLoading(false);
    }
  };

  // FunÃ§Ãµes para eventos - PÃšBLICO
  const fetchPublicEvents = async () => {
    setPublicEventsLoading(true);
    setPublicEventsError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, location_id, local_text, description, banner_url, link, instagram_url, facebook_url, visible, sort_order')
        .eq('visible', true)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPublicEvents((data || []) as EventDB[]);
    } catch (err: any) {
      setPublicEventsError(err.message);
    } finally {
      setPublicEventsLoading(false);
    }
  };

  // FunÃ§Ãµes para fotos - PÃšBLICO
  const fetchPublicPhotos = async () => {
    setPublicPhotosLoading(true);
    setPublicPhotosError(null);
    try {
      const { data, error } = await supabase
        .from('site_photos')
        .select('id, image_url, caption, sort_order, visible, created_at')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPublicPhotos(data || []);
    } catch (err: any) {
      setPublicPhotosError(err.message);
    } finally {
      setPublicPhotosLoading(false);
    }
  };

  // Funções para História - PÚBLICO
  const fetchPublicHistoryBody = async () => {
    try {
      const { data, error } = await supabase
        .from('site_history')
        .select('body, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setHistoryPublicBody(data?.body || '');
    } catch (err: any) {
      setHistoryPublicError(err.message || 'Falha ao carregar história');
    }
  };

  const fetchPublicHistoryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('site_history_images')
        .select('id, image_url, caption, sort_order, visible, created_at')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setHistoryPublicImages(data || []);
    } catch (err: any) {
      setHistoryPublicError(err.message || 'Falha ao carregar imagens da história');
    }
  };

  // FunÃ§Ãµes para passeios & atividades - PÃšBLICO
  const fetchPublicToursSections2 = async () => {
    setToursLoading(true);
    try {
      const { data, error } = await supabase
        .from('tours_sections')
        .select('id, title, bullets, image_url, cta_text, cta_url')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && Array.isArray(data)) {
        setToursSections(
          data.map((d: any) => ({
            id: d.id,
            title: d.title,
            bullets: Array.isArray(d.bullets) ? d.bullets : [],
            image_url: d.image_url,
            cta_text: d.cta_text,
            cta_url: d.cta_url,
          }))
        );
      } else {
        setToursSections([]);
      }
    } catch (err) {
      setToursSections([]);
    } finally {
      setToursLoading(false);
    }
  };


  // FunÃ§Ãµes para useful info - PÃšBLICO
  const fetchPublicUsefulInfo = async () => {
    setUsefulPublicLoading(true);
    setUsefulPublicError(null);
    try {
      const { data, error } = await supabase
        .from('useful_info')
        .select('id, title, body, sort_order, visible')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      setUsefulPublic(data || []);
    } catch (error: any) {
      setUsefulPublicError(error.message);
    } finally {
      setUsefulPublicLoading(false);
    }
  };

  // FunÃ§Ãµes para eventos - ADMIN
  const fetchEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setEvents((data || []) as EventDB[]);
    } catch (err: any) {
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let uploadedUrl: string | null = null;
      if (eventBannerFile) {
        const ext = eventBannerFile.name.split('.').pop() || 'jpg';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `events/${session?.user?.id || 'anon'}/${name}`;
        const { error: upErr } = await supabase.storage
          .from('site-media')
          .upload(path, eventBannerFile, { cacheControl: '3600', upsert: false, contentType: eventBannerFile.type || 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
        uploadedUrl = pub?.publicUrl || null;
        if (!uploadedUrl) throw new Error('Falha ao obter URL pública da imagem');
      }
      const payload = { ...eventForm, time: eventForm.time || null, location_id: eventForm.location_id || null, local_text: eventForm.local_text || null, description: eventForm.description || null, banner_url: uploadedUrl || eventForm.banner_url || null, link: eventForm.link || null, instagram_url: eventForm.instagram_url || null, facebook_url: eventForm.facebook_url || null } as any;
      const { error } = await supabase.from('events').insert([payload]);
      if (error) throw error;
      setEventForm({ title:'', date:'', time:'', location_id:'', local_text:'', description:'', banner_url:'', link:'', instagram_url:'', facebook_url:'', visible:true, is_pinned:false, sort_order:0 });
      setEventBannerFile(null);
      setEventBannerPreview('');
      await fetchEvents();
    } catch (err: any) {
      setEventsError(err.message);
    }
  };

  const editEvent = (row: EventDB) => {
    setEventEditingId(String(row.id));
    setEventForm({ title: row.title || '', date: row.date ? row.date.slice(0,10) : '', time: row.time || '', location_id: row.location_id || '', local_text: (row as any).local_text || '', description: row.description || '', banner_url: row.banner_url || '', link: row.link || '', instagram_url: (row as any).instagram_url || '', facebook_url: (row as any).facebook_url || '', visible: !!row.visible, is_pinned: !!row.is_pinned, sort_order: Number(row.sort_order || 0) });
    setEventBannerFile(null);
    setEventBannerPreview('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventEditingId) return;
    try {
      let uploadedUrl: string | null = null;
      if (eventBannerFile) {
        const ext = eventBannerFile.name.split('.').pop() || 'jpg';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `events/${session?.user?.id || 'anon'}/${name}`;
        const { error: upErr } = await supabase.storage
          .from('site-media')
          .upload(path, eventBannerFile, { cacheControl: '3600', upsert: false, contentType: eventBannerFile.type || 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
        uploadedUrl = pub?.publicUrl || null;
        if (!uploadedUrl) throw new Error('Falha ao obter URL pública da imagem');
      }
      const payload = { ...eventForm, time: eventForm.time || null, location_id: eventForm.location_id || null, local_text: eventForm.local_text || null, description: eventForm.description || null, link: eventForm.link || null, instagram_url: eventForm.instagram_url || null, facebook_url: eventForm.facebook_url || null } as any;
      if (uploadedUrl) payload.banner_url = uploadedUrl; else payload.banner_url = eventForm.banner_url || null;
      const { error } = await supabase.from('events').update(payload).eq('id', eventEditingId);
      if (error) throw error;
      setEventEditingId(null);
      setEventForm({ title:'', date:'', time:'', location_id:'', local_text:'', description:'', banner_url:'', link:'', instagram_url:'', facebook_url:'', visible:true, is_pinned:false, sort_order:0 });
      setEventBannerFile(null);
      setEventBannerPreview('');
      await fetchEvents();
    } catch (err: any) {
      setEventsError(err.message);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Excluir este evento?')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      await fetchEvents();
    } catch (err: any) {
      setEventsError(err.message);
    }
  };

  // FunÃ§Ãµes para carousel
  const fetchPublicCarouselItems = async () => {
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCarouselPublicItems(data as CarouselItemDB[]);
    } catch (error: any) {
      console.error('Erro ao carregar carousel:', error);
    }
  };

  const fetchAdminCarouselItems = async () => {
    setCarouselLoading(true);
    setCarouselError(null);
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCarouselAdminItems(data as CarouselItemDB[]);
    } catch (error: any) {
      setCarouselError(error.message);
    } finally {
      setCarouselLoading(false);
    }
  };

  const editCarousel = (item: CarouselItemDB) => {
    setCarouselEditingId(item.id);
    setCarouselForm({
      is_ad: item.is_ad,
      cta_text: item.cta_text || '',
      cta_url: item.cta_url || '',
      sort_order: item.sort_order,
      active: item.active
    });
    setCarouselPreview(item.image_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  


  const createOrUpdateCarouselItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarouselLoading(true);
    setCarouselError(null);
    try {
      let uploadedUrl: string | null = null;

      // Se houver arquivo selecionado, faz upload para o Storage
      if (carouselFile) {
        const ext = carouselFile.name.split('.').pop() || 'jpg';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `carousel/${session?.user?.id || 'anon'}/${name}`;

        const { error: upErr } = await supabase.storage
          .from('site-media')
          .upload(path, carouselFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: carouselFile.type || 'image/jpeg',
          });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
        uploadedUrl = pub?.publicUrl || null;
        if (!uploadedUrl) throw new Error('Falha ao obter URL pÃºblica da imagem');
      }

      if (carouselEditingId) {
        // Atualizar item existente; somente altera image_url se novo arquivo foi enviado
        const payload: any = {
          is_ad: carouselForm.is_ad,
          cta_text: carouselForm.cta_text || null,
          cta_url: carouselForm.cta_url || null,
          sort_order: carouselForm.sort_order,
          active: carouselForm.active,
        };
        if (uploadedUrl) payload.image_url = uploadedUrl;

        const { error } = await supabase
          .from('carousel_items')
          .update(payload)
          .eq('id', carouselEditingId);
        if (error) throw error;
      } else {
        // Criar novo item: requer imagem
        if (!uploadedUrl) {
          throw new Error('Selecione uma imagem para o banner do carrossel.');
        }
        const { error } = await supabase
          .from('carousel_items')
          .insert([{ 
            image_url: uploadedUrl,
            is_ad: carouselForm.is_ad,
            cta_text: carouselForm.cta_text || null,
            cta_url: carouselForm.cta_url || null,
            sort_order: carouselForm.sort_order,
            active: carouselForm.active,
          }]);
        if (error) throw error;
      }

      // Reset form
      setCarouselEditingId(null);
      setCarouselForm({ is_ad: false, cta_text: '', cta_url: '', sort_order: 0, active: true });
      setCarouselFile(null);
      setCarouselPreview('');
      await fetchAdminCarouselItems();
    } catch (error: any) {
      setCarouselError(error.message || 'Falha ao salvar banner');
    } finally {
      setCarouselLoading(false);
    }
  };

  const deleteCarousel = async (id: string | number) => {
    if (!confirm('Excluir item do carrossel?')) return;
    try {
      const { error } = await supabase
        .from('carousel_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchAdminCarouselItems();
    } catch (error: any) {
      setCarouselError(error.message);
    }
  };

  // FunÃ§Ãµes para phones
  const fetchPhones = async () => {
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      let query = supabase.from('phone_directory').select('*');
      
      if (phoneFilterCatId) {
        query = query.eq('category_id', phoneFilterCatId);
      }
      if (phoneFilterSubId) {
        query = query.eq('subcategory_id', phoneFilterSubId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setPhones(data || []);
    } catch (error: any) {
      setPhoneError(error.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const editPhone = (phone: any) => {
    setPhoneEditingId(phone.id);
    setPhoneForm({
      name: phone.name || '',
      phone: phone.phone || '',
      whatsapp: phone.whatsapp || '',
      visible: phone.visible ?? true,
      category_id: phone.category_id || '',
      subcategory_id: phone.subcategory_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetPhoneForm = () => {
    setPhoneEditingId(null);
    setPhoneForm({ name: '', phone: '', whatsapp: '', visible: true, category_id: '', subcategory_id: '' });
    setPhoneError(null);
  };

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      const payload = {
        name: phoneForm.name,
        phone: phoneForm.phone || null,
        whatsapp: phoneForm.whatsapp || null,
        visible: phoneForm.visible,
        category_id: phoneForm.category_id || null,
        subcategory_id: phoneForm.subcategory_id || null
      };

      if (phoneEditingId) {
        const { error } = await supabase
          .from('phone_directory')
          .update(payload)
          .eq('id', phoneEditingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('phone_directory')
          .insert([payload]);
        
        if (error) throw error;
      }
      
      resetPhoneForm();
      await fetchPhones();
    } catch (error: any) {
      setPhoneError(error.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const togglePhoneVisible = async (phone: any) => {
    try {
      const { error } = await supabase
        .from('phone_directory')
        .update({ visible: !phone.visible })
        .eq('id', phone.id);
      
      if (error) throw error;
      await fetchPhones();
    } catch (error: any) {
      setPhoneError(error.message);
    }
  };

  const deletePhone = async (id: string) => {
    if (!confirm('Excluir telefone?')) return;
    try {
      const { error } = await supabase
        .from('phone_directory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchPhones();
    } catch (error: any) {
      setPhoneError(error.message);
    }
  };

  // FunÃ§Ãµes para useful info - CORRIGIDAS E COMPLETAS
  const fetchUsefulInfo = async () => {
    setUsefulLoading(true);
    setUsefulError(null);
    try {
      const { data, error } = await supabase
        .from('useful_info')
        .select('id, title, body, sort_order, visible, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setUsefulRows(data || []);
    } catch (error: any) {
      setUsefulError(error.message);
    } finally {
      setUsefulLoading(false);
    }
  };

  const resetUseful = () => {
    setUsefulEditingId(null);
    setUsefulForm({ title: '', body: '', sort_order: 0, visible: true });
    setUsefulError(null);
  };

  const editUseful = (row: any) => {
    setUsefulEditingId(row.id);
    setUsefulForm({
      title: row.title || '',
      body: row.body || '',
      sort_order: Number(row.sort_order || 0),
      visible: !!row.visible,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveUseful = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsefulLoading(true);
    setUsefulError(null);
    try {
      const payload = {
        title: usefulForm.title,
        body: usefulForm.body || null,
        sort_order: Number(usefulForm.sort_order || 0),
        visible: usefulForm.visible,
      };

      if (usefulEditingId) {
        const { error } = await supabase
          .from('useful_info')
          .update(payload)
          .eq('id', usefulEditingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('useful_info')
          .insert([payload]);
        
        if (error) throw error;
      }
      
      resetUseful();
      await fetchUsefulInfo();
    } catch (error: any) {
      setUsefulError(error.message || 'Falha ao salvar');
    } finally {
      setUsefulLoading(false);
    }
  };

  const toggleUsefulVisible = async (row: any) => {
    try {
      const { error } = await supabase
        .from('useful_info')
        .update({ visible: !row.visible })
        .eq('id', row.id);
      
      if (!error) {
        await fetchUsefulInfo();
      } else {
        setUsefulError(error.message);
      }
    } catch (error: any) {
      setUsefulError(error.message);
    }
  };

  const deleteUseful = async (id: string) => {
    if (!confirm('Excluir item?')) return;
    try {
      const { error } = await supabase
        .from('useful_info')
        .delete()
        .eq('id', id);
      
      if (!error) {
        await fetchUsefulInfo();
      } else {
        setUsefulError(error.message);
      }
    } catch (error: any) {
      setUsefulError(error.message);
    }
  };

  // FunÃ§Ãµes para history
  const fetchHistoryBody = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase
        .from('site_history')
        .select('id, body, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      setHistoryBody(data?.body || '');
    } catch (error: any) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveHistoryBody = async (e: React.FormEvent) => {
    e.preventDefault();
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data } = await supabase
        .from('site_history')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (data?.id) {
        const { error } = await supabase
          .from('site_history')
          .update({ body: historyBody })
          .eq('id', data.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_history')
          .insert([{ body: historyBody }]);
        
        if (error) throw error;
      }
    } catch (error: any) {
      setHistoryError(error.message || 'Falha ao salvar');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchHistoryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('site_history_images')
        .select('id, image_url, caption, sort_order, visible, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (!error) setHistoryImages(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  };

  const uploadHistoryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyFile) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const ext = historyFile.name.split('.').pop() || 'jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `history/${session?.user?.id || 'anon'}/${name}`;
      
      const { error: upErr } = await supabase.storage
        .from('site-media')
        .upload(path, historyFile, { 
          cacheControl: '3600', 
          upsert: false, 
          contentType: historyFile.type 
        });
      
      if (upErr) throw upErr;
      
      const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
      const url = pub?.publicUrl;
      
      if (!url) throw new Error('URL pública indisponível');
      
      const { error } = await supabase
        .from('site_history_images')
        .insert([{ 
          image_url: url, 
          caption: historyCaption || null, 
          sort_order: 0, 
          visible: true 
        }]);
      
      if (error) throw error;
      
      setHistoryFile(null);
      setHistoryCaption('');
      await fetchHistoryImages();
    } catch (error: any) {
      setHistoryError(error.message || 'Falha ao enviar imagem');
    } finally {
      setHistoryLoading(false);
    }
  };

  const startEditHistoryImage = (row: any) => {
    setHistoryEditingId(row.id);
    setHistoryCaption(row.caption || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveHistoryImageMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyEditingId) return;
    try {
      const { error } = await supabase
        .from('site_history_images')
        .update({ caption: historyCaption || null })
        .eq('id', historyEditingId);
      
      if (!error) {
        setHistoryEditingId(null);
        setHistoryCaption('');
        await fetchHistoryImages();
      }
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
    }
  };

  const toggleHistoryImageVisible = async (row: any) => {
    try {
      const { error } = await supabase
        .from('site_history_images')
        .update({ visible: !row.visible })
        .eq('id', row.id);
      
      if (!error) await fetchHistoryImages();
    } catch (error) {
      console.error('Erro ao alternar visibilidade:', error);
    }
  };

  const deleteHistoryImage = async (id: string) => {
    if (!confirm('Excluir imagem?')) return;
    try {
      const { error } = await supabase
        .from('site_history_images')
        .delete()
        .eq('id', id);
      
      if (!error) await fetchHistoryImages();
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  };

  // FunÃ§Ãµes para photos
  const fetchPhotos = async () => {
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const { data, error } = await supabase
        .from('site_photos')
        .select('id, image_url, caption, sort_order, visible, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      setPhotoError(error.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const uploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `photos/${session?.user?.id || 'anon'}/${name}`;
      
      const { error: upErr } = await supabase.storage
        .from('site-media')
        .upload(path, photoFile, { 
          cacheControl: '3600', 
          upsert: false, 
          contentType: photoFile.type 
        });
      
      if (upErr) throw upErr;
      
      const { data: pub } = supabase.storage.from('site-media').getPublicUrl(path);
      const url = pub?.publicUrl;
      
      if (!url) throw new Error('URL pÃºblica indisponÃ­vel');
      
      const { error } = await supabase
        .from('site_photos')
        .insert([{ 
          image_url: url, 
          caption: photoCaption || null, 
          sort_order: 0, 
          visible: true 
        }]);
      
      if (error) throw error;
      
      setPhotoFile(null);
      setPhotoCaption('');
      await fetchPhotos();
    } catch (error: any) {
      setPhotoError(error.message || 'Falha ao enviar');
    } finally {
      setPhotoLoading(false);
    }
  };

  const startEditPhoto = (row: any) => {
    setPhotoEditingId(row.id);
    setPhotoCaption(row.caption || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePhotoMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoEditingId) return;
    try {
      const { error } = await supabase
        .from('site_photos')
        .update({ caption: photoCaption || null })
        .eq('id', photoEditingId);
      
      if (!error) {
        setPhotoEditingId(null);
        setPhotoCaption('');
        await fetchPhotos();
      }
    } catch (error: any) {
      setPhotoError(error.message);
    }
  };

  const togglePhotoVisible = async (row: any) => {
    try {
      const { error } = await supabase
        .from('site_photos')
        .update({ visible: !row.visible })
        .eq('id', row.id);
      
      if (!error) await fetchPhotos();
    } catch (error: any) {
      setPhotoError(error.message);
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm('Excluir foto?')) return;
    try {
      const { error } = await supabase
        .from('site_photos')
        .delete()
        .eq('id', id);
      
      if (!error) await fetchPhotos();
    } catch (error: any) {
      setPhotoError(error.message);
    }
  };

  // FunÃ§Ãµes para categorias
  const fetchAdminTaxonomies = async () => {
    setCatLoading(true);
    setCatError(null);
    try {
      const [catsRes, subsRes, locsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').order('name'),
        supabase.from('subcategories').select('*').order('sort_order').order('name'),
        supabase.from('locations').select('*').order('sort_order').order('name')
      ]);

      if (catsRes.error) throw catsRes.error;
      if (subsRes.error) throw subsRes.error;
      if (locsRes.error) throw locsRes.error;

      setCategories(catsRes.data || []);
      setSubcategories(subsRes.data || []);
      setLocations(locsRes.data || []);
    } catch (error: any) {
      setCatError(error.message);
    } finally {
      setCatLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const fetchSubcategories = async (categoryId?: string) => {
    try {
      let query = supabase.from('subcategories').select('*');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query.order('sort_order').order('name');
      
      if (error) throw error;
      setSubcategories(data || []);
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('sort_order')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const updateCategoryName = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', id);
      
      if (error) throw error;
      setEditingCatId('');
      setEditingCatName('');
      await fetchCategories();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const updateSubcategoryName = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ name: newName })
        .eq('id', id);
      
      if (error) throw error;
      setEditingSubId('');
      setEditingSubName('');
      await fetchSubcategories();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const updateLocationName = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name: newName })
        .eq('id', id);
      
      if (error) throw error;
      setEditingLocId('');
      setEditingLocName('');
      await fetchLocations();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const swapCategoryOrder = async (id: string, direction: number) => {
    // Troca de posição com o vizinho mais próximo mantendo sort_order único
    try {
      if (!direction) return;
      const ordered = [...categories].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const idx = ordered.findIndex(c => c.id === id);
      if (idx < 0) return;
      const targetIdx = idx + (direction < 0 ? -1 : 1);
      if (targetIdx < 0 || targetIdx >= ordered.length) return;

      const a = ordered[idx];
      const b = ordered[targetIdx];
      const aOrder = a.sort_order ?? idx;
      const bOrder = b.sort_order ?? targetIdx;

      const { error: e1 } = await supabase.from('categories').update({ sort_order: bOrder }).eq('id', a.id as any);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('categories').update({ sort_order: aOrder }).eq('id', b.id as any);
      if (e2) throw e2;

      await fetchCategories();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const swapSubcategoryOrder = async (id: string, direction: number) => {
    // Troca de posição com o vizinho mais próximo na mesma lista
    try {
      if (!direction) return;
      const ordered = [...subcategories].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const idx = ordered.findIndex(s => s.id === id);
      if (idx < 0) return;
      const targetIdx = idx + (direction < 0 ? -1 : 1);
      if (targetIdx < 0 || targetIdx >= ordered.length) return;

      const a = ordered[idx];
      const b = ordered[targetIdx];
      const aOrder = a.sort_order ?? idx;
      const bOrder = b.sort_order ?? targetIdx;

      const { error: e1 } = await supabase.from('subcategories').update({ sort_order: bOrder }).eq('id', a.id as any);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('subcategories').update({ sort_order: aOrder }).eq('id', b.id as any);
      if (e2) throw e2;

      await fetchSubcategories();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  const swapLocationOrder = async (id: string, direction: number) => {
    // Troca de posição com o vizinho mais próximo na mesma lista
    try {
      if (!direction) return;
      const ordered = [...locations].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const idx = ordered.findIndex(l => l.id === id);
      if (idx < 0) return;
      const targetIdx = idx + (direction < 0 ? -1 : 1);
      if (targetIdx < 0 || targetIdx >= ordered.length) return;

      const a = ordered[idx];
      const b = ordered[targetIdx];
      const aOrder = a.sort_order ?? idx;
      const bOrder = b.sort_order ?? targetIdx;

      const { error: e1 } = await supabase.from('locations').update({ sort_order: bOrder }).eq('id', a.id as any);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('locations').update({ sort_order: aOrder }).eq('id', b.id as any);
      if (e2) throw e2;

      await fetchLocations();
    } catch (error: any) {
      setCatError(error.message);
    }
  };

  // Normalização e movimentos extremos (topo/fim)
  const normalizeCategoriesOrder = async () => {
    try {
      const ordered = [...categories].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
      for (let i = 0; i < ordered.length; i++) {
        const c: any = ordered[i];
        const { error } = await supabase.from('categories').update({ sort_order: i }).eq('id', c.id as any);
        if (error) throw error;
      }
      await fetchCategories();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveCategoryToTop = async (id: string) => {
    try {
      const minOrder = Math.min(...categories.map((c: any) => c.sort_order ?? 0));
      const { error } = await supabase.from('categories').update({ sort_order: minOrder - 1 }).eq('id', id);
      if (error) throw error;
      await normalizeCategoriesOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveCategoryToBottom = async (id: string) => {
    try {
      const maxOrder = Math.max(...categories.map((c: any) => c.sort_order ?? 0));
      const { error } = await supabase.from('categories').update({ sort_order: maxOrder + 1 }).eq('id', id);
      if (error) throw error;
      await normalizeCategoriesOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  const normalizeSubcategoriesOrder = async () => {
    try {
      const byCategory: Record<string, any[]> = {};
      for (const s of subcategories as any[]) {
        byCategory[s.category_id] = byCategory[s.category_id] || [];
        byCategory[s.category_id].push(s);
      }
      for (const catId of Object.keys(byCategory)) {
        const ordered = byCategory[catId].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
        for (let i = 0; i < ordered.length; i++) {
          const s: any = ordered[i];
          const { error } = await supabase.from('subcategories').update({ sort_order: i }).eq('id', s.id as any);
          if (error) throw error;
        }
      }
      await fetchSubcategories();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveSubcategoryToTop = async (id: string) => {
    try {
      const s = subcategories.find((x: any) => x.id === id) as any;
      if (!s) return;
      const same = subcategories.filter((x: any) => x.category_id === s.category_id);
      const minOrder = Math.min(...same.map((x: any) => x.sort_order ?? 0));
      const { error } = await supabase.from('subcategories').update({ sort_order: minOrder - 1 }).eq('id', id);
      if (error) throw error;
      await normalizeSubcategoriesOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveSubcategoryToBottom = async (id: string) => {
    try {
      const s = subcategories.find((x: any) => x.id === id) as any;
      if (!s) return;
      const same = subcategories.filter((x: any) => x.category_id === s.category_id);
      const maxOrder = Math.max(...same.map((x: any) => x.sort_order ?? 0));
      const { error } = await supabase.from('subcategories').update({ sort_order: maxOrder + 1 }).eq('id', id);
      if (error) throw error;
      await normalizeSubcategoriesOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  const normalizeLocationsOrder = async () => {
    try {
      const ordered = [...locations].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
      for (let i = 0; i < ordered.length; i++) {
        const l: any = ordered[i];
        const { error } = await supabase.from('locations').update({ sort_order: i }).eq('id', l.id as any);
        if (error) throw error;
      }
      await fetchLocations();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveLocationToTop = async (id: string) => {
    try {
      const minOrder = Math.min(...locations.map((l: any) => l.sort_order ?? 0));
      const { error } = await supabase.from('locations').update({ sort_order: minOrder - 1 }).eq('id', id);
      if (error) throw error;
      await normalizeLocationsOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  const moveLocationToBottom = async (id: string) => {
    try {
      const maxOrder = Math.max(...locations.map((l: any) => l.sort_order ?? 0));
      const { error } = await supabase.from('locations').update({ sort_order: maxOrder + 1 }).eq('id', id);
      if (error) throw error;
      await normalizeLocationsOrder();
    } catch (error: any) { setCatError(error.message); }
  };

  // Generic reorder helpers
  const reorderByDragOver = <T extends { id: string | number }>(list: T[], dragId: string, overId: string) => {
    const arr = [...list];
    const from = arr.findIndex(i => String(i.id) === dragId);
    const to = arr.findIndex(i => String(i.id) === overId);
    if (from < 0 || to < 0 || from === to) return arr;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    return arr;
  };

  const applyCategoriesOrder = async (ordered: any[]) => {
    try {
      // store previous order for undo
      lastCategoriesOrderRef.current = (categories as any[]).map(c => ({ ...c }));
      for (let i = 0; i < ordered.length; i++) {
        const c = ordered[i];
        const { error } = await supabase.from('categories').update({ sort_order: i }).eq('id', c.id as any);
        if (error) throw error;
      }
      await fetchCategories();
    } catch (error: any) { setCatError(error.message); }
  };

  const applySubcategoriesOrder = async (catId: string, ordered: any[]) => {
    try {
      const same = (subcategories as any[]).filter(s => s.category_id === catId);
      lastSubcategoriesOrderRef.current = { catId, list: same.map(s => ({ ...s })) };
      let pos = 0;
      for (const s of ordered) {
        const { error } = await supabase.from('subcategories').update({ sort_order: pos }).eq('id', s.id as any);
        if (error) throw error;
        pos++;
      }
      await fetchSubcategories(catId);
    } catch (error: any) { setCatError(error.message); }
  };

  const applyLocationsOrder = async (ordered: any[]) => {
    try {
      lastLocationsOrderRef.current = (locations as any[]).map(l => ({ ...l }));
      for (let i = 0; i < ordered.length; i++) {
        const l = ordered[i];
        const { error } = await supabase.from('locations').update({ sort_order: i }).eq('id', l.id as any);
        if (error) throw error;
      }
      await fetchLocations();
    } catch (error: any) { setCatError(error.message); }
  };

  // Handlers: Categories
  const onCategoryDragStart = (e: React.DragEvent, id: string, label: string) => {
    setDragging({ type: 'category', id });
    const { el, cleanup } = createDragImageEl(label);
    dragCleanupRef.current = cleanup;
    e.dataTransfer?.setDragImage(el, 8, 8);
  };
  const onCategoryDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onCategoryDrop = async (targetId: string) => {
    if (!dragging || dragging.type !== 'category' || dragging.id === targetId) return;
    const ordered = reorderByDragOver(categories as any[], dragging.id, targetId);
    await applyCategoriesOrder(ordered);
    setDragging(null);
    setDragOverId(null);
  };

  // Handlers: Subcategories (only within same category)
  const onSubcategoryDragStart = (e: React.DragEvent, id: string, label: string) => {
    setDragging({ type: 'subcategory', id });
    const { el, cleanup } = createDragImageEl(label);
    dragCleanupRef.current = cleanup;
    e.dataTransfer?.setDragImage(el, 8, 8);
  };
  const onSubcategoryDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onSubcategoryDrop = async (targetId: string) => {
    if (!dragging || dragging.type !== 'subcategory' || dragging.id === targetId) return;
    const drag = subcategories.find((s: any) => String(s.id) === dragging.id) as any;
    const over = subcategories.find((s: any) => String(s.id) === targetId) as any;
    if (!drag || !over || drag.category_id !== over.category_id) { setDragging(null); return; }
    const same = subcategories.filter((s: any) => s.category_id === drag.category_id);
    const ordered = reorderByDragOver(same as any[], dragging.id, targetId);
    await applySubcategoriesOrder(drag.category_id, ordered);
    setDragging(null);
    setDragOverId(null);
  };

  // Handlers: Locations
  const onLocationDragStart = (e: React.DragEvent, id: string, label: string) => {
    setDragging({ type: 'location', id });
    const { el, cleanup } = createDragImageEl(label);
    dragCleanupRef.current = cleanup;
    e.dataTransfer?.setDragImage(el, 8, 8);
  };
  const onLocationDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onLocationDrop = async (targetId: string) => {
    if (!dragging || dragging.type !== 'location' || dragging.id === targetId) return;
    const ordered = reorderByDragOver(locations as any[], dragging.id, targetId);
    await applyLocationsOrder(ordered);
    setDragging(null);
    setDragOverId(null);
  };

  // Mobile tap-to-reorder using the handle
  const handleCategoryHandleTap = async (id: string) => {
    if (selectedMove?.type === 'category') {
      if (selectedMove.id !== id) {
        const ordered = reorderByDragOver(categories as any[], selectedMove.id, id);
        await applyCategoriesOrder(ordered);
      }
      setSelectedMove(null);
    } else {
      setSelectedMove({ type: 'category', id });
    }
  };

  const handleSubcategoryHandleTap = async (id: string) => {
    const drag = subcategories.find((s: any) => String(s.id) === id) as any;
    if (!drag) return;
    if (selectedMove?.type === 'subcategory') {
      if (selectedMove.id !== id) {
        const prev = subcategories.find((s: any) => String(s.id) === selectedMove.id) as any;
        if (prev && prev.category_id === drag.category_id) {
          const same = subcategories.filter((s: any) => s.category_id === drag.category_id);
          const ordered = reorderByDragOver(same as any[], selectedMove.id, id);
          await applySubcategoriesOrder(drag.category_id, ordered);
        }
      }
      setSelectedMove(null);
    } else {
      setSelectedMove({ type: 'subcategory', id });
    }
  };

  const handleLocationHandleTap = async (id: string) => {
    if (selectedMove?.type === 'location') {
      if (selectedMove.id !== id) {
        const ordered = reorderByDragOver(locations as any[], selectedMove.id, id);
        await applyLocationsOrder(ordered);
      }
      setSelectedMove(null);
    } else {
      setSelectedMove({ type: 'location', id });
    }
  };

  // Undo actions
  const undoCategoriesOrder = async () => {
    const prev = lastCategoriesOrderRef.current; if (!prev) return;
    // ensure order sorted by previous sort_order
    const ordered = [...prev].sort((a:any,b:any)=> (a.sort_order??0)-(b.sort_order??0));
    await applyCategoriesOrder(ordered as any[]);
    lastCategoriesOrderRef.current = null;
  };
  const undoSubcategoriesOrder = async () => {
    const prev = lastSubcategoriesOrderRef.current; if (!prev) return;
    const ordered = [...prev.list].sort((a:any,b:any)=> (a.sort_order??0)-(b.sort_order??0));
    await applySubcategoriesOrder(prev.catId, ordered as any[]);
    lastSubcategoriesOrderRef.current = null;
  };
  const undoLocationsOrder = async () => {
    const prev = lastLocationsOrderRef.current; if (!prev) return;
    const ordered = [...prev].sort((a:any,b:any)=> (a.sort_order??0)-(b.sort_order??0));
    await applyLocationsOrder(ordered as any[]);
    lastLocationsOrderRef.current = null;
  };

  // -------- Mobile long-press drag (Pointer Events) on handle ---------
  const findTargetIdAtPoint = (type: 'category'|'subcategory'|'location', x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    let node: HTMLElement | null = el;
    while (node) {
      if (node.dataset && node.dataset.type === type && node.dataset.id) return node.dataset.id;
      node = node.parentElement;
    }
    return null;
  };

  const pointerMoveHandler = (e: PointerEvent) => {
    if (!isPointerDragRef.current || !dragging) return;
    e.preventDefault();
    const overId = findTargetIdAtPoint(dragging.type, e.clientX, e.clientY);
    if (overId) setDragOverId(overId);
  };

  const pointerUpHandler = async () => {
    if (longPressTimerRef.current) { window.clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (!dragging) { isPointerDragRef.current = false; setDragOverId(null); return; }
    const src = dragging;
    const dst = dragOverId;
    isPointerDragRef.current = false;
    // restore page touch behavior
    try {
      if (document && document.body) {
        if (prevTouchActionRef.current !== undefined) document.body.style.touchAction = prevTouchActionRef.current;
        if (prevOverscrollRef.current !== undefined) (document.body.style as any).overscrollBehavior = prevOverscrollRef.current as any;
        prevTouchActionRef.current = undefined;
        prevOverscrollRef.current = undefined;
      }
    } catch {}
    // cleanup ghost if any
    try { dragCleanupRef.current?.(); } finally { dragCleanupRef.current = null; }
    setDragging(null);
    setDragOverId(null);
    if (!dst || dst === src.id) return;
    // Apply reorder based on type
    if (src.type === 'category') {
      const ordered = reorderByDragOver(categories as any[], String(src.id), String(dst));
      await applyCategoriesOrder(ordered);
    } else if (src.type === 'subcategory') {
      const drag = subcategories.find((s: any) => String(s.id) === String(src.id)) as any;
      const over = subcategories.find((s: any) => String(s.id) === String(dst)) as any;
      if (drag && over && drag.category_id === over.category_id) {
        const same = subcategories.filter((s: any) => s.category_id === drag.category_id);
        const ordered = reorderByDragOver(same as any[], String(src.id), String(dst));
        await applySubcategoriesOrder(drag.category_id, ordered);
      }
    } else if (src.type === 'location') {
      const ordered = reorderByDragOver(locations as any[], String(src.id), String(dst));
      await applyLocationsOrder(ordered);
    }
    window.removeEventListener('pointermove', pointerMoveHandler, { passive: false } as any);
    window.removeEventListener('pointerup', pointerUpHandler);
    window.removeEventListener('pointercancel', pointerUpHandler);
  };

  const onHandlePointerDown = (e: React.PointerEvent, type: 'category'|'subcategory'|'location', id: string, label: string) => {
    try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
    try { e.preventDefault(); } catch {}
    // Start long press timer
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    const activateDrag = () => {
      isPointerDragRef.current = true;
      setDragging({ type, id });
      // create ghost
      const { el, cleanup } = createDragImageEl(label);
      dragCleanupRef.current = cleanup;
      // disable page scroll while dragging
      try {
        if (document && document.body) {
          prevTouchActionRef.current = document.body.style.touchAction;
          prevOverscrollRef.current = (document.body.style as any).overscrollBehavior as any;
          document.body.style.touchAction = 'none';
          (document.body.style as any).overscrollBehavior = 'none';
        }
      } catch {}
    };
    if (isCoarsePointer) {
      // Android: ativar imediatamente ao pressionar
      activateDrag();
    } else {
      const delay = 200;
      longPressTimerRef.current = window.setTimeout(() => {
        activateDrag();
      }, delay);
    }
    window.addEventListener('pointermove', pointerMoveHandler, { passive: false } as any);
    window.addEventListener('pointerup', pointerUpHandler);
    window.addEventListener('pointercancel', pointerUpHandler);
  };

  // Cancel long-press if moved before activation (avoid accidental drags)
  useEffect(() => {
    const preMove = (ev: PointerEvent) => {
      if (isPointerDragRef.current) return; // already dragging
      if (!longPressTimerRef.current || !pointerStartRef.current) return;
      const dx = Math.abs(ev.clientX - pointerStartRef.current.x);
      const dy = Math.abs(ev.clientY - pointerStartRef.current.y);
      if (dx > 6 || dy > 6) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        pointerStartRef.current = null;
      }
    };
    window.addEventListener('pointermove', preMove, { passive: true });
    return () => window.removeEventListener('pointermove', preMove as any);
  }, []);

  // Filtered businesses for home page
  const filteredBusinesses = useMemo(() => {
  const q = normalizeForSearch(searchTerm);
  return publicBusinesses.filter(business => {
    const nameN = normalizeForSearch(business.name);
    const catN = normalizeForSearch(business.category);
    const descN = normalizeForSearch(business.description || '');
    const tagsN = Array.isArray((business as any).tags) ? (business as any).tags.map((t: any) => normalizeForSearch(String(t || ''))) : [];
    const matchesTags = !q ? true : tagsN.some((t: string) => t.includes(q));
    const matchesSearch = !q || nameN.includes(q) || catN.includes(q) || descN.includes(q) || matchesTags;

    const matchesCategory = !homeCategoryId || (business as any).category_id === homeCategoryId;
    const matchesSubcategory = !homeSubcategoryId || (business as any).subcategory_id === homeSubcategoryId;
    const matchesLocation = !homeLocationId || (business as any).location_id === homeLocationId;
    const matchesRating = business.rating >= homeRatingMin;

    return matchesSearch && matchesCategory && matchesSubcategory && matchesLocation && matchesRating;
  });
}, [publicBusinesses, searchTerm, homeCategoryId, homeSubcategoryId, homeLocationId, homeRatingMin]);

  // Businesses in category "Passeios & Atividades" (for Tours page)
  const toursBusinesses = useMemo(() => {
    const target = normalizeForSearch('Passeios & Atividades');
    return publicBusinesses.filter(b => normalizeForSearch(b.category) === target);
  }, [publicBusinesses]);

  // Other businesses for detail page
  const otherBusinesses = useMemo(() => {
    if (!selectedBusiness) return [];
    return publicBusinesses
      .filter(b => b.id !== selectedBusiness.id)
      .slice(0, 4);
  }, [publicBusinesses, selectedBusiness]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        void refreshIsAdmin(data.session.user.id);
      }
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.debug('[auth] state change:', event, !!sess?.user);
      setSession(sess ?? null);

      if (event === 'SIGNED_OUT') {
        if (logoutRequestedRef.current) {
          logoutRequestedRef.current = false;
          setIsAdmin(false);
          if (view === 'admin') setView('login');
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) return;
        }
      }
      
      if (!sess?.user) return;

      if (isAdmin) {
        try {
          const allowed = await checkAdminWithTimeout(sess.user.id);
          if (!allowed) {
            setAdminNotice('Não foi possível confirmar permissões agora. Tentaremos novamente em instantes.');
          }
        } catch {}
        return;
      }

      const allowed = await checkAdminWithTimeout(sess.user.id);
      if (allowed) {
        setIsAdmin(true);
        setAdminNotice(null);
        if (window.location.pathname === '/admin') {
          setView('admin');
        }
      } else {
        setIsAdmin(false);
        setAdminNotice('Seu usuário não tem permissão de administrador.');
      }
    });
    
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (view === 'admin' && isAdmin) void fetchAdminBusinesses();
  }, [view, isAdmin]);

  useEffect(() => {
    void fetchPublicBusinesses();
    void fetchPublicCarouselItems();
    void fetchCategories();
    void fetchSubcategories();
    void fetchLocations();
    void fetchGuideSettings(); // Carrega as configurações do guia ao iniciar o app
  }, []);

  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      if (adminTab === 'carousel') void fetchAdminCarouselItems();
      if (adminTab === 'categories') void fetchAdminTaxonomies();
      if (adminTab === 'phones') void fetchPhones();
      if (adminTab === 'useful') void fetchUsefulInfo();
      if (adminTab === 'history') { void fetchHistoryBody(); void fetchHistoryImages(); }
      if (adminTab === 'photos') void fetchPhotos();
      if (adminTab === 'businesses') void fetchAdminTaxonomies();
      if (adminTab === 'events') void fetchEvents();
      if (adminTab === 'guide') void fetchGuideSettings();
    }
  }, [view, isAdmin, adminTab]);

  useEffect(() => {
    if (view === 'useful') void fetchPublicUsefulInfo();
    if (view === 'phones') {
      void fetchCategories();
      void fetchSubcategories(phonesCatId || undefined);
      void fetchPublicPhones();
    }
    if (view === 'photos') void fetchPublicPhotos();
    if (view === 'historyPage') {
      setHistoryPublicLoading(true);
      setHistoryPublicError(null);
      Promise.all([fetchPublicHistoryBody(), fetchPublicHistoryImages()])
        .finally(() => setHistoryPublicLoading(false));
    }
    if (view === 'events') void fetchPublicEvents();
  }, [view, phonesCatId]);

  return (
    <div className="bg-orange-50 min-h-screen font-sans" style={{ backgroundColor: view === 'none' ? '#ebf7f6ff' : undefined }}>
      <div className="hidden" />
      <main className="pb-24">
        {view === 'login' ? (
          <div className="container mx-auto px-4 mt-8 max-w-md">
            <div className="p-0">
              <h2 className="text-xl font-bold mb-4">Login Administrativo</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full border rounded px-3 py-2" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <input 
                    type="password" 
                    className="w-full border rounded px-3 py-2" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
                {authError && <p className="text-red-600 text-sm">{authError}</p>}
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-cyan-700 text-white py-2 rounded disabled:opacity-50"
                >
                  {authLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        ) : view === 'admin' ? (
          <div className="container mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <h2 className="text-xl font-bold">Painel Administrativo</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Sair
                  </button>
                  <button 
                    onClick={() => setView('none')}
                    className="bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Voltar ao Site
                  </button>
                </div>
              </div>
              {adminNotice && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                  {adminNotice}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {(['businesses','events','phones','useful','history','photos','carousel','categories','comoChegar','guide','plans'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAdminTab(tab)}
                    className={`px-4 py-2 rounded ${
                      adminTab === tab 
                        ? 'bg-cyan-700 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tab === 'businesses' && 'Cadastros'}
                    {tab === 'events' && 'Eventos'}
                    {tab === 'phones' && 'Telefones'}
                    {tab === 'useful' && 'Informações úteis'}
                    {tab === 'history' && 'História'}
                    {tab === 'photos' && 'Fotos'}
                    {tab === 'carousel' && 'Carrossel'}
                    {tab === 'categories' && 'Categorias'}
                    {tab === 'comoChegar' && 'Como Chegar'}
                    {tab === 'plans' && 'Planos'}
                    {tab === 'guide' && 'Dados do Guia'}
                  </button>
                ))}
              </div>
            </div>

            {adminTab === 'businesses' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Cadastros</h3>
                  {adminLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-3">
                      {adminBusinesses.length === 0 && <p className="text-sm text-gray-600">Nenhum cadastro encontrado.</p>}
                      {adminBusinesses.map((b) => (
                        <div key={b.id} className="border rounded p-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{b.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                b.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{b.category}</p>
                            <p className="text-xs text-gray-500">Plano: {!b.plan ? '—' : b.plan === 'anual' ? 'Anual' : b.plan === 'semestral' ? 'Semestral' : String(b.plan)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => approveBusiness(b.id)} 
                              disabled={b.status === 'approved'} 
                              className="bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded"
                            >
                              Aprovar
                            </button>
                            <button 
                              onClick={() => rejectBusiness(b.id)} 
                              disabled={b.status === 'rejected'} 
                              className="bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded"
                            >
                              Reprovar
                            </button>
                            <button
                              onClick={() => moveBusinessToTours(b.id)}
                              className="bg-teal-600 text-white px-3 py-1.5 rounded"
                              title="Marcar como Passeios & Atividades"
                            >
                              Enviar para Passeios
                            </button>
                            <button 
                              onClick={async () => {
                                setEditingId(b.id);
                                setNewBiz({ 
                                  name: b.name, 
                                  category: b.category, 
                                  description: (b as any).description, 
                                  address: (b as any).address, 
                                  phone: (b as any).phone, 
                                  whatsapp: (b as any).whatsapp, 
                                  instagram: (b as any).instagram,
                                  tripadvisor: (b as any).tripadvisor,
                                  website: (b as any).website
                                });
                                setNewBizTags(Array.isArray((b as any).tags) ? (b as any).tags.join(', ') : '');
                                setNewBizFiles([]);
                                setNewBizPreviews(Array.isArray((b as any).images) ? (b as any).images : []);
                                setFormCategoryId(b.category_id || '');
                                await fetchSubcategories(b.category_id || undefined);
                                setFormSubcategoryId(b.subcategory_id || '');
                                setFormLocationId(b.location_id || '');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                await fetchEditReviews(b.id);
                              }} 
                              className="bg-blue-600 text-white px-3 py-1.5 rounded"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={async ()=>{ 
                                if(!confirm('Excluir esta empresa?')) return; 
                                
                                try {
                                  // Primeiro, deletar o telefone correspondente da phone_directory
                                  const { error: phoneError } = await supabase
                                    .from('phone_directory')
                                    .delete()
                                    .eq('name', b.name);
                                  
                                  if (phoneError) {
                                    console.warn('Erro ao deletar telefone:', phoneError.message);
                                  }
                                  
                                  // Depois, deletar a empresa
                                  const { error } = await supabase.from('businesses').delete().eq('id', b.id); 
                                  
                                  if(error){ 
                                    setAdminError(error.message);
                                  } else { 
                                    await fetchAdminBusinesses(); 
                                    await fetchPublicBusinesses(); 
                                  }
                                } catch (err: any) {
                                  setAdminError(err.message || 'Erro ao excluir empresa');
                                }
                              }} 
                              className="bg-gray-100 text-red-700 px-3 py-1.5 rounded"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{editingId ? 'Editar empresa' : 'Cadastrar empresa nova'}</h3>
                  <form onSubmit={editingId ? updateBusiness : createBusiness} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        required 
                        value={newBiz.name || ''} 
                        onChange={(e) => setNewBiz((v) => ({ ...v, name: e.target.value }))} 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-6">
                        <label className="block text-sm font-medium mb-1">Categoria</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={formCategoryId} 
                          onChange={async (e) => { 
                            const id = e.target.value; 
                            setFormCategoryId(id); 
                            setFormSubcategoryId(''); 
                            await fetchSubcategories(id || undefined); 
                          }}
                        >
                          <option value="">Selecione</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-6">
                        <label className="block text-sm font-medium mb-1">Subcategoria</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={formSubcategoryId} 
                          onChange={(e) => setFormSubcategoryId(e.target.value)} 
                          disabled={!formCategoryId}
                        >
                          <option value="">Selecione</option>
                          {subcategories.filter(s => !formCategoryId || s.category_id === formCategoryId).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Local</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={formLocationId} 
                          onChange={(e) => setFormLocationId(e.target.value)}
                        >
                          <option value="">Selecione</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <textarea 
                        className="w-full border rounded px-3 py-2" 
                        rows={3} 
                        value={newBiz.description || ''} 
                        onChange={(e) => setNewBiz((v) => ({ ...v, description: e.target.value }))} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fotos (até 5 imagens, max. {MAX_FILE_MB}MB cada)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={(e) => {
                          const files: File[] = e.target.files ? Array.from(e.target.files as FileList) : [];
                          const accepted: File[] = [];
                          const previews: string[] = [];
                          for (const f of files.slice(0, MAX_FILES)) {
                            if (f.size <= MAX_FILE_MB * 1024 * 1024) {
                              accepted.push(f);
                              previews.push(URL.createObjectURL(f));
                            }
                          }
                          setNewBizFiles(accepted);
                          setNewBizPreviews(previews);
                        }} 
                        className="w-full border rounded px-3 py-2" 
                      />
                      {newBizPreviews.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {newBizPreviews.map((src, idx) => (
                            <div key={idx} className="relative">
                              <img src={src} alt={`preview-${idx}`} className="w-full h-20 object-cover rounded" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Logomarca (1 imagem, max. {MAX_FILE_MB}MB)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= MAX_FILE_MB * 1024 * 1024) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                          } else if (file) {
                            alert(`Arquivo muito grande. Máximo ${MAX_FILE_MB}MB.`);
                          }
                        }} 
                        className="w-full border rounded px-3 py-2" 
                      />
                      {logoPreview && (
                        <div className="mt-2">
                          <div className="w-24 h-24 bg-white rounded-full border-2 border-gray-200 shadow-lg flex items-center justify-center overflow-hidden">
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Endereço</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={newBiz.address || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, address: e.target.value }))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={newBiz.phone || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, phone: e.target.value }))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">WhatsApp</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={newBiz.whatsapp || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, whatsapp: e.target.value }))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instagram</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={newBiz.instagram || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, instagram: e.target.value }))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">TripAdvisor</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          placeholder="URL do TripAdvisor (opcional)" 
                          value={newBiz.tripadvisor || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, tripadvisor: e.target.value }))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Website</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          placeholder="https://exemplo.com" 
                          value={newBiz.website || ''} 
                          onChange={(e) => setNewBiz((v) => ({ ...v, website: e.target.value }))} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Tags (separe por virgula)</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          placeholder="ex.: familiar, pet friendly, música ao vivo" 
                          value={newBizTags} 
                          onChange={(e) => setNewBizTags(e.target.value)} 
                        />
                      </div>
                    </div>
                    {adminError && <p className="text-red-600 text-sm">{adminError}</p>}
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {saving ? (editingId ? 'Atualizando...' : 'Salvando...') : (editingId ? 'Atualizar' : 'Salvar')}
                      </button>
                      {editingId && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setEditingId(null); 
                            setNewBiz({ name: '', category: '', description: '', address: '', phone: '', whatsapp: '', instagram: '', tripadvisor: '', website: '' }); 
                            setNewBizTags('');
                            setNewBizFiles([]); 
                            setNewBizPreviews([]); 
                            setFormCategoryId('');
                            setFormSubcategoryId('');
                            setFormLocationId('');
                            setAdminError(null); 
                          }} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>

                  {editingId && (
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Avaliações deste cadastro</h4>
                        <button
                          onClick={async ()=>{ await fetchEditReviews(editingId); }}
                          className="text-sm bg-white border px-3 py-1.5 rounded"
                        >
                          Recarregar
                        </button>
                      </div>
                      {editReviewsLoading ? (
                        <p>Carregando avaliações...</p>
                      ) : editReviewsError ? (
                        <p className="text-red-600">{editReviewsError}</p>
                      ) : (
                        <div className="space-y-2">
                          {editReviews.length === 0 ? (
                            <p className="text-sm text-gray-600">Sem avaliações.</p>
                          ) : (
                            editReviews.map((r:any) => (
                              <div key={r.id} className="border rounded p-2 flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold">{r.author || 'Anônimo'}</span>
                                    <span className="text-gray-500">• {Number(r.rating || 0).toFixed(1)}★</span>
                                  </div>
                                  {r.comment && <div className="text-gray-700 text-sm whitespace-pre-wrap">{r.comment}</div>}
                                </div>
                                <button onClick={() => deleteEditReview(r.id, editingId)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : adminTab === 'tours' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Passeios & Atividades</h3>
                  {toursAdminLoading ? (
                    <p>Carregando...</p>
                  ) : toursAdminError ? (
                    <p className="text-red-600">{toursAdminError}</p>
                  ) : toursAdmin.length === 0 ? (
                    <p className="text-gray-600 text-sm">Nenhum item cadastrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {toursAdmin.map((it:any) => (
                        <div key={it.id} className="border rounded p-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{it.title}</h4>
                              {!it.visible && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Oculto</span>}
                            </div>
                            {Array.isArray(it.bullets) && it.bullets.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-gray-700">
                                {it.bullets.slice(0,3).map((b:string, idx:number) => <li key={idx} className="truncate">{b}</li>)}
                                {it.bullets.length > 3 && <li className="text-gray-500">...</li>}
                              </ul>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => editTourSection(it)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={() => deleteTourSection(String(it.id))} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{toursEditingId ? 'Editar item' : 'Novo item'}</h3>
                  <form onSubmit={toursEditingId ? updateTourSection : createTourSection} className="space-y-3">
                    <input className="w-full border rounded px-3 py-2" placeholder="Título" value={toursForm.title} onChange={e=>setToursForm(v=>({...v,title:e.target.value}))} required />
                    <textarea className="w-full border rounded px-3 py-2" rows={5} placeholder="Uma linha por bullet" value={toursForm.bullets} onChange={e=>setToursForm(v=>({...v,bullets:e.target.value}))} />
                    <input className="w-full border rounded px-3 py-2" placeholder="URL da imagem (opcional)" value={toursForm.image_url} onChange={e=>setToursForm(v=>({...v,image_url:e.target.value}))} />
                    <div>
                      <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setToursImageFile(f||null); setToursImagePreview(f? URL.createObjectURL(f):''); }} className="w-full border rounded px-3 py-2" />
                      {(toursImagePreview || toursForm.image_url) && (
                        <div className="mt-2">
                          <img src={toursImagePreview || toursForm.image_url} alt="Preview" className="w-full h-32 object-cover rounded" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className="w-full border rounded px-3 py-2" placeholder="Texto do CTA (opcional)" value={toursForm.cta_text} onChange={e=>setToursForm(v=>({...v,cta_text:e.target.value}))} />
                      <input className="w-full border rounded px-3 py-2" placeholder="URL do CTA (opcional)" value={toursForm.cta_url} onChange={e=>setToursForm(v=>({...v,cta_url:e.target.value}))} />
                      <input type="number" className="w-full border rounded px-3 py-2" placeholder="Ordem" value={toursForm.sort_order} onChange={e=>setToursForm(v=>({...v,sort_order:Number(e.target.value)}))} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={toursForm.visible} onChange={e=>setToursForm(v=>({...v,visible:e.target.checked}))} />
                      Visível
                    </label>
                    {toursAdminError && <p className="text-red-600 text-sm">{toursAdminError}</p>}
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded">{toursEditingId ? 'Atualizar' : 'Salvar'}</button>
                      {toursEditingId && (
                        <button type="button" onClick={()=>{ setToursEditingId(null); setToursForm({ title: '', bullets: '', image_url: '', cta_text: '', cta_url: '', visible: true, sort_order: 0 }); setToursImageFile(null); setToursImagePreview(''); setToursAdminError(null); }} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'events' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Eventos</h3>
                  {eventsLoading ? (
                    <p>Carregando...</p>
                  ) : eventsError ? (
                    <p className="text-red-600">{eventsError}</p>
                  ) : events.length === 0 ? (
                    <p className="text-gray-600 text-sm">Nenhum evento cadastrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((e) => (
                        <div key={e.id} className="border rounded p-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{e.title}</h4>
                              <span className="text-xs text-gray-600">{new Date(e.date).toLocaleDateString()} {e.time ? ` • ${e.time}` : ''}</span>
                              {!e.visible && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Oculto</span>}
                            </div>
                            {e.description && <p className="text-sm text-gray-600 line-clamp-2">{e.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editEvent(e)}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded"
                            >Editar</button>
                            <button
                              onClick={() => deleteEvent(String(e.id))}
                              className="bg-red-600 text-white px-3 py-1.5 rounded"
                            >Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{eventEditingId ? 'Editar Evento' : 'Novo Evento'}</h3>
                  <form onSubmit={eventEditingId ? updateEvent : createEvent} className="space-y-3">
                    <input className="w-full border rounded px-3 py-2" placeholder="Título" value={eventForm.title} onChange={e=>setEventForm(v=>({...v,title:e.target.value}))} required />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="w-full border rounded px-3 py-2" value={eventForm.date} onChange={e=>setEventForm(v=>({...v,date:e.target.value}))} required />
                      <input type="time" className="w-full border rounded px-3 py-2" value={eventForm.time} onChange={e=>setEventForm(v=>({...v,time:e.target.value}))} />
                    </div>
                    <select className="w-full border rounded px-3 py-2" value={eventForm.location_id} onChange={e=>setEventForm(v=>({...v,location_id:e.target.value}))}>
                      <option value="">Sem local</option>
                      {locations.map(l=> <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input className="w-full border rounded px-3 py-2" placeholder="Local (texto)" value={eventForm.local_text} onChange={e=>setEventForm(v=>({...v,local_text:e.target.value}))} />
                    <textarea className="w-full border rounded px-3 py-2" placeholder="Descrição" value={eventForm.description} onChange={e=>setEventForm(v=>({...v,description:e.target.value}))} rows={4} />
                    <div>
                      <label className="block text-sm font-medium mb-1">Banner do evento (upload opcional)</label>
                      <input type="file" accept="image/*" className="w-full border rounded px-3 py-2" onChange={(e)=>{ const f=e.target.files?.[0]||null; setEventBannerFile(f); setEventBannerPreview(f ? URL.createObjectURL(f) : ''); }} />
                      {eventBannerPreview && <img src={eventBannerPreview} alt="Preview banner" className="mt-2 w-full h-32 object-cover rounded" />}
                    </div>
                    <input className="w-full border rounded px-3 py-2" placeholder="URL do ingresso (opcional)" value={eventForm.link} onChange={e=>setEventForm(v=>({...v,link:e.target.value}))} />
                    <input className="w-full border rounded px-3 py-2" placeholder="URL do Instagram (opcional)" value={eventForm.instagram_url} onChange={e=>setEventForm(v=>({...v,instagram_url:e.target.value}))} />
                    <input className="w-full border rounded px-3 py-2" placeholder="URL do Facebook (opcional)" value={eventForm.facebook_url} onChange={e=>setEventForm(v=>({...v,facebook_url:e.target.value}))} />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={eventForm.visible} onChange={e=>setEventForm(v=>({...v,visible:e.target.checked}))} />
                          Visível
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={eventForm.is_pinned} onChange={e=>setEventForm(v=>({...v,is_pinned:e.target.checked}))} />
                          Fixar evento
                        </label>
                      </div>
                      <input type="number" className="w-28 border rounded px-3 py-2" placeholder="Ordem" value={eventForm.sort_order} onChange={e=>setEventForm(v=>({...v,sort_order:Number(e.target.value||0)}))} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-cyan-700 text-white px-4 py-2 rounded">{eventEditingId ? 'Salvar' : 'Adicionar'}</button>
                      {eventEditingId && <button type="button" onClick={()=>{ setEventEditingId(null); setEventForm({ title:'', date:'', time:'', location_id:'', description:'', banner_url:'', link:'', visible:true, is_pinned:false, sort_order:0 }); setEventBannerFile(null); setEventBannerPreview(''); }} className="bg-gray-100 px-4 py-2 rounded">Cancelar</button>}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'phones' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Lista Telefônica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select 
                        className="w-full border rounded px-3 py-2" 
                        value={phoneFilterCatId} 
                        onChange={async (e) => { 
                          const id = e.target.value; 
                          setPhoneFilterCatId(id); 
                          setPhoneFilterSubId(''); 
                          await fetchSubcategories(id || undefined); 
                          await fetchPhones(); 
                        }}
                      >
                        <option value="">Todas</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subcategoria</label>
                      <select 
                        className="w-full border rounded px-3 py-2" 
                        value={phoneFilterSubId} 
                        onChange={async (e) => { 
                          setPhoneFilterSubId(e.target.value); 
                          await fetchPhones(); 
                        }} 
                        disabled={!phoneFilterCatId}
                      >
                        <option value="">Todas</option>
                        {subcategories.filter(s => !phoneFilterCatId || s.category_id === phoneFilterCatId).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={async ()=>{ 
                          setPhoneFilterCatId(''); 
                          setPhoneFilterSubId(''); 
                          await fetchSubcategories(); 
                          await fetchPhones(); 
                        }} 
                        className="w-full md:w-auto bg-white border px-3 py-2 rounded hover:bg-gray-50"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  {phoneLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-3">
                      {phones.length === 0 && <p className="text-sm text-gray-600">Nenhum telefone encontrado.</p>}
                      {phones.map((r) => (
                        <div key={r.id} className="border rounded p-3 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{r.name}</h4>
                              {!r.visible && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">oculto</span>}
                            </div>
                            <p className="text-sm text-gray-600">Tel: {r.phone || '-'} • WhatsApp: {r.whatsapp || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => editPhone(r)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={() => togglePhoneVisible(r)} className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded">{r.visible?'Ocultar':'Mostrar'}</button>
                            <button onClick={() => deletePhone(r.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {phoneError && <p className="text-red-600 mt-4">{phoneError}</p>}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{phoneEditingId ? 'Editar telefone' : 'Novo telefone'}</h3>
                  <form onSubmit={savePhone} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        required 
                        value={phoneForm.name} 
                        onChange={(e)=>setPhoneForm(v=>({...v, name: e.target.value}))} 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={phoneForm.phone} 
                          onChange={(e)=>setPhoneForm(v=>({...v, phone: e.target.value}))} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">WhatsApp</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={phoneForm.whatsapp} 
                          onChange={(e)=>setPhoneForm(v=>({...v, whatsapp: e.target.value}))} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Categoria</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={phoneForm.category_id} 
                          onChange={async (e)=>{ 
                            const id = e.target.value; 
                            setPhoneForm(v=>({...v, category_id: id, subcategory_id: ''})); 
                            await fetchSubcategories(id || undefined); 
                          }}
                        >
                          <option value="">Nenhuma</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subcategoria</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={phoneForm.subcategory_id} 
                          onChange={(e)=>setPhoneForm(v=>({...v, subcategory_id: e.target.value}))} 
                          disabled={!phoneForm.category_id}
                        >
                          <option value="">Nenhuma</option>
                          {subcategories.filter(s => !phoneForm.category_id || s.category_id === phoneForm.category_id).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        id="phoneVisible" 
                        type="checkbox" 
                        checked={phoneForm.visible} 
                        onChange={(e)=>setPhoneForm(v=>({...v, visible: e.target.checked}))} 
                      />
                      <label htmlFor="phoneVisible" className="text-sm">Visível</label>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={phoneLoading} 
                        className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {phoneLoading ? (phoneEditingId ? 'Atualizando...' : 'Salvando...') : (phoneEditingId ? 'Atualizar' : 'Salvar')}
                      </button>
                      {phoneEditingId && (
                        <button 
                          type="button" 
                          onClick={resetPhoneForm} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'useful' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Informações úteis</h3>
                  {usefulLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-3">
                      {usefulRows.length === 0 && <p className="text-sm text-gray-600">Nenhum item.</p>}
                      {usefulRows.map((r)=> (
                        <div key={r.id} className="border rounded p-3 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{r.title}</h4>
                              {!r.visible && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">oculto</span>}
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.body}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={()=>editUseful(r)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={()=>toggleUsefulVisible(r)} className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded">{r.visible?'Ocultar':'Mostrar'}</button>
                            <button onClick={()=>deleteUseful(r.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {usefulError && <p className="text-red-600 mt-4">{usefulError}</p>}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{usefulEditingId ? 'Editar' : 'Novo'} item</h3>
                  <form onSubmit={saveUseful} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Título</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        required 
                        value={usefulForm.title} 
                        onChange={(e)=>setUsefulForm(v=>({...v, title: e.target.value}))} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Texto</label>
                      <textarea 
                        className="w-full border rounded px-3 py-2" 
                        rows={4} 
                        value={usefulForm.body} 
                        onChange={(e)=>setUsefulForm(v=>({...v, body: e.target.value}))} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ordem</label>
                        <input 
                          type="number" 
                          className="w-full border rounded px-3 py-2" 
                          value={usefulForm.sort_order} 
                          onChange={(e)=>setUsefulForm(v=>({...v, sort_order: Number(e.target.value||0)}))} 
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input 
                          id="usefulVisible" 
                          type="checkbox" 
                          checked={usefulForm.visible} 
                          onChange={(e)=>setUsefulForm(v=>({...v, visible: e.target.checked}))} 
                        />
                        <label htmlFor="usefulVisible" className="text-sm">Visível</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={usefulLoading} 
                        className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {usefulLoading ? (usefulEditingId ? 'Atualizando...' : 'Salvando...') : (usefulEditingId ? 'Atualizar' : 'Salvar')}
                      </button>
                      {usefulEditingId && (
                        <button 
                          type="button" 
                          onClick={resetUseful} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'history' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Texto da História</h3>
                  <form onSubmit={saveHistoryBody} className="space-y-3">
                    <div>
                      <textarea 
                        className="w-full border rounded px-3 py-2" 
                        rows={8} 
                        value={historyBody} 
                        onChange={(e)=>setHistoryBody(e.target.value)} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={historyLoading} 
                      className="bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                    >
                      {historyLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </form>
                  {historyError && <p className="text-red-600 mt-4">{historyError}</p>}
                </div>
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Galeria da História</h3>
                  <form onSubmit={historyEditingId ? saveHistoryImageMeta : uploadHistoryImage} className="space-y-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Legenda</label>
                        <input 
                          className="w-full border rounded px-3 py-2" 
                          value={historyCaption} 
                          onChange={(e)=>setHistoryCaption(e.target.value)} 
                        />
                      </div>
                      {!historyEditingId && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Imagem</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e)=>setHistoryFile(e.target.files?.[0] || null)} 
                            className="w-full border rounded px-3 py-2" 
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={historyLoading} 
                        className="bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {historyEditingId ? (historyLoading ? 'Atualizando...' : 'Atualizar') : (historyLoading ? 'Enviando...' : 'Enviar')}
                      </button>
                      {historyEditingId && (
                        <button 
                          type="button" 
                          onClick={()=>{ setHistoryEditingId(null); setHistoryCaption(''); }} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {historyImages.map((it)=> (
                      <div key={it.id} className="border rounded p-3 flex items-start gap-3">
                        <img src={it.image_url} alt="História" className="w-24 h-24 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{it.caption || '-'}</p>
                          <div className="mt-2 flex gap-2">
                            <button onClick={()=>startEditHistoryImage(it)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={()=>toggleHistoryImageVisible(it)} className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded">{it.visible?'Ocultar':'Mostrar'}</button>
                            <button onClick={()=>deleteHistoryImage(it.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : adminTab === 'photos' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Galeria de Fotos</h3>
                  {photoLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {photos.length === 0 && <p className="text-sm text-gray-600">Nenhuma foto.</p>}
                      {photos.map((p)=> (
                        <div key={p.id} className="border rounded p-3 flex items-start gap-3">
                          <img src={p.image_url} alt="Galeria" className="w-24 h-24 object-cover rounded" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{p.caption || '-'}</p>
                            <div className="mt-2 flex gap-2">
                              <button onClick={()=>startEditPhoto(p)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                              <button onClick={()=>togglePhotoVisible(p)} className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded">{p.visible?'Ocultar':'Mostrar'}</button>
                              <button onClick={()=>deletePhoto(p.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoError && <p className="text-red-600 mt-4">{photoError}</p>}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{photoEditingId ? 'Editar' : 'Nova'} foto</h3>
                  <form onSubmit={photoEditingId ? savePhotoMeta : uploadPhoto} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Legenda</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={photoCaption} 
                        onChange={(e)=>setPhotoCaption(e.target.value)} 
                      />
                    </div>
                    {!photoEditingId && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Imagem</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e)=>setPhotoFile(e.target.files?.[0] || null)} 
                          className="w-full border rounded px-3 py-2" 
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={photoLoading} 
                        className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {photoEditingId ? (photoLoading ? 'Atualizando...' : 'Atualizar') : (photoLoading ? 'Enviando...' : 'Enviar')}
                      </button>
                      {photoEditingId && (
                        <button 
                          type="button" 
                          onClick={()=>{ setPhotoEditingId(null); setPhotoCaption(''); }} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'carousel' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Itens do carrossel</h3>
                  {carouselLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-3">
                      {carouselAdminItems.length === 0 && <p className="text-sm text-gray-600">Nenhum item encontrado.</p>}
                      {carouselAdminItems.map((it) => (
                        <div key={it.id} className="border rounded p-3 flex items-center justify-between gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <img src={it.image_url} alt="Carrossel" className="w-20 h-12 object-cover rounded" />
                            <div>
                              <p className="font-medium">Ordem: {it.sort_order} {it.active ? '' : '(inativo)'}</p>
                              {it.is_ad && <p className="text-xs text-cyan-700">Anúncio • {it.cta_text || 'CTA'}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => editCarousel(it)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={() => deleteCarousel(it.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {carouselError && <p className="text-red-600 mt-4">{carouselError}</p>}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{carouselEditingId ? 'Editar banner' : 'Novo banner'}</h3>
                  <form onSubmit={createOrUpdateCarouselItem} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Imagem</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f && f.size <= MAX_FILE_MB * 1024 * 1024) {
                            setCarouselFile(f);
                            setCarouselPreview(URL.createObjectURL(f));
                          }
                        }} 
                        className="w-full border rounded px-3 py-2" 
                      />
                      {carouselPreview && (
                        <div className="mt-2"><img src={carouselPreview} alt="Preview" className="w-full h-32 object-cover rounded" /></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        id="isAd" 
                        type="checkbox" 
                        checked={carouselForm.is_ad} 
                        onChange={(e) => setCarouselForm((v) => ({ ...v, is_ad: e.target.checked }))} 
                      />
                      <label htmlFor="isAd" className="text-sm">Transformar em anúncio (com botão)</label>
                    </div>
                    {carouselForm.is_ad && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Texto do botão</label>
                          <input 
                            className="w-full border rounded px-3 py-2" 
                            value={carouselForm.cta_text ?? ''} 
                            onChange={(e) => setCarouselForm((v) => ({ ...v, cta_text: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">URL do botão</label>
                          <input 
                            className="w-full border rounded px-3 py-2" 
                            value={carouselForm.cta_url ?? ''} 
                            onChange={(e) => setCarouselForm((v) => ({ ...v, cta_url: e.target.value }))} 
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ordem</label>
                        <input 
                          type="number" 
                          className="w-full border rounded px-3 py-2" 
                          value={carouselForm.sort_order ?? ''} 
                          onChange={(e) => { 
                            const val = e.target.value; 
                            setCarouselForm((v) => ({ ...v, sort_order: val === '' ? 0 : Number(val) })); 
                          }} 
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input 
                          id="active" 
                          type="checkbox" 
                          checked={carouselForm.active} 
                          onChange={(e) => setCarouselForm((v) => ({ ...v, active: e.target.checked }))} 
                        />
                        <label htmlFor="active" className="text-sm">Ativo</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={carouselLoading} 
                        className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50"
                      >
                        {carouselLoading ? (carouselEditingId ? 'Atualizando...' : 'Salvando...') : (carouselEditingId ? 'Atualizar' : 'Salvar')}
                      </button>
                      {carouselEditingId && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setCarouselEditingId(null); 
                            setCarouselForm({ is_ad: false, cta_text: '', cta_url: '', sort_order: 0, active: true }); 
                            setCarouselFile(null); 
                            setCarouselPreview(''); 
                            setCarouselError(null); 
                          }} 
                          className="px-3 py-2 rounded bg-gray-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : adminTab === 'guide' ? (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4">Dados do Guia</h3>
      {guideError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{guideError}</div>}
      <form onSubmit={saveGuideSettings} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome do App</label>
          <input className="w-full border rounded px-3 py-2" value={guide.app_name} onChange={e=>setGuide(g=>({ ...g, app_name: e.target.value }))} />
          <p className="mt-1 text-xs text-gray-500">Ex.: Guia Boipeba. Ao salvar, o título do site é atualizado.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp (somente números, com DDI)</label>
          <input className="w-full border rounded px-3 py-2" value={guide.whatsapp} onChange={e=>setGuide(g=>({ ...g, whatsapp: e.target.value }))} placeholder="5574999988348" />
          <p className="mt-1 text-xs text-gray-500">Usado no Anuncie (banner) e no CTA “Saiba Mais” do BusinessDetail.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Favicon</label>
          <input type="file" accept="image/png,image/x-icon" onChange={e=>setFaviconFile(e.target.files?.[0] || null)} />
          <p className="mt-1 text-xs text-gray-500">PNG 32x32 ou 48x48.</p>
          {guide.favicon_url && <img src={guide.favicon_url} className="mt-2 w-8 h-8 rounded border" />}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Imagem de abertura (splash)</label>
          <input type="file" accept="image/png,image/jpeg" onChange={e=>setSplashFile(e.target.files?.[0] || null)} />
          <p className="mt-1 text-xs text-gray-500">PNG/JPG. Sugestão: 1242x2688 (iPhone X/11) ou 2048x2732 (iPad).</p>
          {guide.splash_url && <img src={guide.splash_url} className="mt-2 w-24 h-24 object-cover rounded border" />}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ícone do App</label>
          <input type="file" accept="image/png" onChange={e=>setIconFile(e.target.files?.[0] || null)} />
          <p className="mt-1 text-xs text-gray-500">PNG 512x512 com fundo transparente.</p>
          {guide.app_icon_url && <img src={guide.app_icon_url} className="mt-2 w-16 h-16 object-cover rounded border" />}
        </div>
        <div className="flex gap-2">
          <button disabled={guideLoading} className="bg-cyan-700 text-white px-4 py-2 rounded disabled:opacity-60">Salvar</button>
        </div>
      </form>
    </div>
  </div>
            
            
            ) : adminTab === 'comoChegar' ? (
              <AdminComoChegar />
            ) : adminTab === 'plans' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Planos</h3>
                  <div className="mb-3">
                    <button onClick={fetchPlans} className="bg-gray-100 px-3 py-1.5 rounded">Atualizar</button>
                  </div>
                  {plansLoading ? (
                    <p>Carregando...</p>
                  ) : (
                    <div className="space-y-3">
                      {plans.length === 0 && <p className="text-sm text-gray-600">Nenhum plano encontrado.</p>}
                      {plans.map((p) => (
                        <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{p.name} {p.active ? '' : '(inativo)'}</p>
                            <p className="text-xs text-gray-600">{p.months} meses • slug: {p.slug} {p.price ? `• R$ ${p.price.toFixed(2)}` : ''}</p>
                            {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => editPlan(p)} className="bg-blue-600 text-white px-3 py-1.5 rounded">Editar</button>
                            <button onClick={() => deletePlan(p.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {plansError && <p className="text-red-600 mt-4">{plansError}</p>}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">{planEditingId ? 'Editar plano' : 'Novo plano'}</h3>
                  <form onSubmit={createOrUpdatePlan} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome</label>
                      <input className="w-full border rounded px-3 py-2" value={planForm.name} onChange={(e)=>setPlanForm(v=>({ ...v, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <input className="w-full border rounded px-3 py-2" value={planForm.slug} onChange={(e)=>setPlanForm(v=>({ ...v, slug: e.target.value }))} placeholder="ex.: semestral, anual" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Meses</label>
                        <input type="number" className="w-full border rounded px-3 py-2" value={planForm.months} onChange={(e)=>setPlanForm(v=>({ ...v, months: Number(e.target.value || 0) }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                        <input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={planForm.price ?? ''} onChange={(e)=>setPlanForm(v=>({ ...v, price: e.target.value === '' ? null : Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <textarea className="w-full border rounded px-3 py-2" rows={3} value={planForm.description ?? ''} onChange={(e)=>setPlanForm(v=>({ ...v, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 mt-1">
                        <input id="plActive" type="checkbox" checked={planForm.active} onChange={(e)=>setPlanForm(v=>({ ...v, active: e.target.checked }))} />
                        <label htmlFor="plActive" className="text-sm">Ativo</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ordem</label>
                        <input type="number" className="w-full border rounded px-3 py-2" value={planForm.sort_order ?? 0} onChange={(e)=>setPlanForm(v=>({ ...v, sort_order: Number(e.target.value || 0) }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={plansLoading} className="flex-1 bg-cyan-700 text-white px-3 py-2 rounded disabled:opacity-50">
                        {plansLoading ? (planEditingId ? 'Atualizando...' : 'Salvando...') : (planEditingId ? 'Atualizar' : 'Salvar')}
                      </button>
                      {planEditingId && (
                        <button type="button" onClick={()=>{ setPlanEditingId(null); setPlanForm({ name: '', slug: '', months: 6, price: null, active: true, sort_order: 0, description: '' }); }} className="px-3 py-2 rounded border">Cancelar</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Categorias, Subcategorias e Locais</h3>
                  {catLoading ? <p>Carregando...</p> : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Categorias</h4>
                        <div className="space-y-2">
                          {categories.map((c, idx) => (
                            <div
                              key={c.id}
                              data-type="category"
                              data-id={String(c.id)}
                              className={`flex items-center justify-between gap-2 px-2 py-1 rounded border transition-all duration-150 ${dragging?.type==='category' && String(c.id)===dragging.id ? 'opacity-60 scale-[0.98]' : ''} ${dragOverId===String(c.id) ? 'ring-2 ring-cyan-400' : ''}`}
                              onDragOver={onCategoryDragOver}
                              onDragEnter={()=>setDragOverId(String(c.id))}
                              onDrop={()=>onCategoryDrop(String(c.id))}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`cursor-grab touch-none select-none px-1 ${selectedMove?.type==='category' && selectedMove.id===String(c.id) ? 'bg-cyan-100 text-cyan-700 rounded' : 'text-gray-400'}`}
                                  title="Arraste para reordenar"
                                  draggable={!isCoarsePointer}
                                  {...(!isCoarsePointer ? { onDragStart: (e:any)=>onCategoryDragStart(e, String(c.id), c.name), onDragEnd: ()=>{ dragCleanupRef.current?.(); dragCleanupRef.current=null; setDragOverId(null); setDragging(null); } } : {})}
                                  onClick={()=>handleCategoryHandleTap(String(c.id))}
                                  {...(isCoarsePointer ? { onPointerDown: (e:any)=>onHandlePointerDown(e, 'category', String(c.id), c.name), onPointerMove: (e:any)=>{ if(isPointerDragRef.current && dragging){ e.preventDefault(); const overId = findTargetIdAtPoint('category', e.clientX, e.clientY); if(overId) setDragOverId(overId);} }, onPointerUp: ()=>pointerUpHandler(), onPointerCancel: ()=>pointerUpHandler() } : {})}
                                >
                                  ≡
                                </span>
                                <span className="text-xs text-gray-400 w-6 text-right">{(c.sort_order ?? idx) + 1}</span>
                                {editingCatId === c.id ? (
                                  <input 
                                    className="border rounded px-2 py-1 text-sm" 
                                    value={editingCatName} 
                                    onChange={(e)=>setEditingCatName(e.target.value)} 
                                  />
                                ) : (
                                  <span className="text-sm">{c.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs flex items-center gap-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!c.hidden} 
                                    onChange={async (e)=>{ 
                                      const { error } = await supabase.from('categories').update({ hidden: e.target.checked }).eq('id', c.id); 
                                      if(error){ setCatError(error.message);} else { await fetchCategories(); } 
                                    }} 
                                  /> Ocultar
                                </label>
                                {editingCatId === c.id ? (
                                  <>
                                    <button onClick={()=>updateCategoryName(c.id, editingCatName)} className="text-white bg-green-600 px-2 py-1 rounded text-xs">Salvar</button>
                                    <button onClick={()=>{setEditingCatId(''); setEditingCatName('');}} className="text-gray-700 bg-gray-200 px-2 py-1 rounded text-xs">Cancelar</button>
                                  </>
                                ) : (
                                  <button onClick={()=>{setEditingCatId(c.id); setEditingCatName(c.name);}} className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">Editar</button>
                                )}
                                <button onClick={()=>moveCategoryToTop(c.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Topo</button>
                                <button onClick={()=>swapCategoryOrder(c.id, -1)} className="px-2 py-1 rounded text-xs bg-gray-100">▲</button>
                                <button onClick={()=>swapCategoryOrder(c.id, 1)} className="px-2 py-1 rounded text-xs bg-gray-100">▼</button>
                                <button onClick={()=>moveCategoryToBottom(c.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Fim</button>
                                <button onClick={async ()=>{ if(!confirm('Excluir categoria? Isso pode falhar se houver subcategorias/empresas vinculadas.')) return; const { error } = await supabase.from('categories').delete().eq('id', c.id); if(error){ setCatError(error.message);} else { await fetchAdminTaxonomies(); } }} className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Excluir</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Subcategorias</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            className="px-2 py-1 rounded text-xs bg-gray-100"
                            onClick={()=>{
                              const m: Record<string, boolean> = {};
                              categories.forEach((c:any)=>{ const has = subcategories.some((s:any)=> s.category_id===c.id); if(has) m[String(c.id)] = false; });
                              setCollapsedSubGroups(m);
                            }}
                          >
                            Expandir tudo
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded text-xs bg-gray-100"
                            onClick={()=>{
                              const m: Record<string, boolean> = {};
                              categories.forEach((c:any)=>{ const has = subcategories.some((s:any)=> s.category_id===c.id); if(has) m[String(c.id)] = true; });
                              setCollapsedSubGroups(m);
                            }}
                          >
                            Recolher tudo
                          </button>
                        </div>
                        <div className="space-y-4">
                          {categories.map((cat) => {
                            const list = subcategories.filter((s:any)=> s.category_id === cat.id);
                            if (!list.length) return null;
                            return (
                              <div key={cat.id}>
                                <button type="button" className="w-full text-left text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between" onClick={()=>setCollapsedSubGroups(prev=>({ ...prev, [String(cat.id)]: !prev[String(cat.id)] }))}>
                                  <span>{cat.name}</span>
                                  <span className="text-gray-400">{list.length}</span>
                                </button>
                                <div className={`space-y-2 transition-all duration-200 ${collapsedSubGroups[String(cat.id)] ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100'}`}>
                                  {list.map((s:any, idx:number) => (
                                    <div
                                      key={s.id}
                                      data-type="subcategory"
                                      data-id={String(s.id)}
                                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded border transition-all duration-150 ${dragging?.type==='subcategory' && String(s.id)===dragging.id ? 'opacity-60 scale-[0.98]' : ''} ${dragOverId===String(s.id) ? 'ring-2 ring-cyan-400' : ''}`}
                                      onDragOver={onSubcategoryDragOver}
                                      onDragEnter={()=>setDragOverId(String(s.id))}
                                      onDrop={()=>onSubcategoryDrop(String(s.id))}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`cursor-grab touch-none select-none px-1 ${selectedMove?.type==='subcategory' && selectedMove.id===String(s.id) ? 'bg-cyan-100 text-cyan-700 rounded' : 'text-gray-400'}`}
                                          title="Arraste para reordenar"
                                          draggable={!isCoarsePointer}
                                          {...(!isCoarsePointer ? { onDragStart: (e:any)=>onSubcategoryDragStart(e, String(s.id), s.name), onDragEnd: ()=>{ dragCleanupRef.current?.(); dragCleanupRef.current=null; setDragOverId(null); setDragging(null); } } : {})}
                                          onClick={()=>handleSubcategoryHandleTap(String(s.id))}
                                          {...(isCoarsePointer ? { onPointerDown: (e:any)=>onHandlePointerDown(e, 'subcategory', String(s.id), s.name), onPointerMove: (e:any)=>{ if(isPointerDragRef.current && dragging){ e.preventDefault(); const overId = findTargetIdAtPoint('subcategory', e.clientX, e.clientY); if(overId) setDragOverId(overId);} }, onPointerUp: ()=>pointerUpHandler(), onPointerCancel: ()=>pointerUpHandler() } : {})}
                                        >
                                          ≡
                                        </span>
                                        <span className="text-xs text-gray-400 w-6 text-right">{(s.sort_order ?? idx) + 1}</span>
                                        <span className="text-[11px] text-gray-400">{categories.find(c=>c.id===s.category_id)?.name}</span>
                                        {editingSubId === s.id ? (
                                          <input 
                                            className="border rounded px-2 py-1 text-sm" 
                                            value={editingSubName} 
                                            onChange={(e)=>setEditingSubName(e.target.value)} 
                                          />
                                        ) : (
                                          <span className="text-sm">{s.name}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <label className="text-xs flex items-center gap-1">
                                          <input 
                                            type="checkbox" 
                                            checked={!!s.hidden} 
                                            onChange={async (e)=>{ 
                                              const { error } = await supabase.from('subcategories').update({ hidden: e.target.checked }).eq('id', s.id); 
                                              if(error){ setCatError(error.message);} else { await fetchSubcategories(s.category_id); } 
                                            }} 
                                          /> Ocultar
                                        </label>
                                        {editingSubId === s.id ? (
                                          <>
                                            <button onClick={()=>updateSubcategoryName(s.id, editingSubName)} className="text-white bg-green-600 px-2 py-1 rounded text-xs">Salvar</button>
                                            <button onClick={()=>{setEditingSubId(''); setEditingSubName('');}} className="text-gray-700 bg-gray-200 px-2 py-1 rounded text-xs">Cancelar</button>
                                          </>
                                        ) : (
                                          <button onClick={()=>{setEditingSubId(s.id); setEditingSubName(s.name);}} className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">Editar</button>
                                        )}
                                        <button onClick={()=>moveSubcategoryToTop(s.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Topo</button>
                                        <button onClick={()=>swapSubcategoryOrder(s.id, -1)} className="px-2 py-1 rounded text-xs bg-gray-100">▲</button>
                                        <button onClick={()=>swapSubcategoryOrder(s.id, 1)} className="px-2 py-1 rounded text-xs bg-gray-100">▼</button>
                                        <button onClick={()=>moveSubcategoryToBottom(s.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Fim</button>
                                        <button onClick={async ()=>{ if(!confirm('Excluir subcategoria? Isso pode falhar se houver empresas vinculadas.')) return; const { error } = await supabase.from('subcategories').delete().eq('id', s.id); if(error){ setCatError(error.message);} else { await fetchAdminTaxonomies(); } }} className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Excluir</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Locais</h4>
                        <div className="space-y-2">
                          {locations.map((l, idx) => (
                            <div
                              key={l.id}
                              data-type="location"
                              data-id={String(l.id)}
                              className={`flex items-center justify-between gap-2 px-2 py-1 rounded border transition-all duration-150 ${dragging?.type==='location' && String(l.id)===dragging.id ? 'opacity-60 scale-[0.98]' : ''} ${dragOverId===String(l.id) ? 'ring-2 ring-cyan-400' : ''}`}
                              onDragOver={onLocationDragOver}
                              onDragEnter={()=>setDragOverId(String(l.id))}
                              onDrop={()=>onLocationDrop(String(l.id))}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`cursor-grab touch-none select-none px-1 ${selectedMove?.type==='location' && selectedMove.id===String(l.id) ? 'bg-cyan-100 text-cyan-700 rounded' : 'text-gray-400'}`}
                                  title="Arraste para reordenar"
                                  draggable={!isCoarsePointer}
                                  {...(!isCoarsePointer ? { onDragStart: (e:any)=>onLocationDragStart(e, String(l.id), l.name), onDragEnd: ()=>{ dragCleanupRef.current?.(); dragCleanupRef.current=null; setDragOverId(null); setDragging(null); } } : {})}
                                  onClick={()=>handleLocationHandleTap(String(l.id))}
                                  {...(isCoarsePointer ? { onPointerDown: (e:any)=>onHandlePointerDown(e, 'location', String(l.id), l.name), onPointerMove: (e:any)=>{ if(isPointerDragRef.current && dragging){ e.preventDefault(); const overId = findTargetIdAtPoint('location', e.clientX, e.clientY); if(overId) setDragOverId(overId);} }, onPointerUp: ()=>pointerUpHandler(), onPointerCancel: ()=>pointerUpHandler() } : {})}
                                >
                                  ≡
                                </span>
                                <span className="text-xs text-gray-400 w-6 text-right">{(l.sort_order ?? idx) + 1}</span>
                                {editingLocId === l.id ? (
                                  <input 
                                    className="border rounded px-2 py-1 text-sm" 
                                    value={editingLocName} 
                                    onChange={(e)=>setEditingLocName(e.target.value)} 
                                  />
                                ) : (
                                  <span className="text-sm">{l.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs flex items-center gap-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!l.hidden} 
                                    onChange={async (e)=>{ 
                                      const { error } = await supabase.from('locations').update({ hidden: e.target.checked }).eq('id', l.id); 
                                      if(error){ setCatError(error.message);} else { await fetchLocations(); } 
                                    }} 
                                  /> Ocultar
                                </label>
                                {editingLocId === l.id ? (
                                  <>
                                    <button onClick={()=>updateLocationName(l.id, editingLocName)} className="text-white bg-green-600 px-2 py-1 rounded text-xs">Salvar</button>
                                    <button onClick={()=>{setEditingLocId(''); setEditingLocName('');}} className="text-gray-700 bg-gray-200 px-2 py-1 rounded text-xs">Cancelar</button>
                                  </>
                                ) : (
                                  <button onClick={()=>{setEditingLocId(l.id); setEditingLocName(l.name);}} className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs">Editar</button>
                                )}
                                <button onClick={()=>moveLocationToTop(l.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Topo</button>
                                <button onClick={()=>swapLocationOrder(l.id, -1)} className="px-2 py-1 rounded text-xs bg-gray-100">▲</button>
                                <button onClick={()=>swapLocationOrder(l.id, 1)} className="px-2 py-1 rounded text-xs bg-gray-100">▼</button>
                                <button onClick={()=>moveLocationToBottom(l.id)} className="px-2 py-1 rounded text-xs bg-gray-100">Fim</button>
                                <button onClick={async ()=>{ if(!confirm('Excluir local? Isso pode falhar se houver empresas vinculadas.')) return; const { error } = await supabase.from('locations').delete().eq('id', l.id); if(error){ setCatError(error.message);} else { await fetchAdminTaxonomies(); } }} className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Excluir</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {catError && <p className="text-red-600">{catError}</p>}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Gerenciar</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nova categoria</label>
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 border rounded px-3 py-2" 
                          value={newCategoryName} 
                          onChange={(e)=>setNewCategoryName(e.target.value)} 
                        />
                        <button 
                          className="bg-cyan-700 text-white px-3 py-2 rounded" 
                          onClick={async()=>{ 
                            if(!newCategoryName.trim()) return; 
                            const nextOrder = Math.max(0, ...categories.map((c:any)=> (c.sort_order ?? 0))) + 1;
                            const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim(), sort_order: nextOrder }); 
                            if(!error){ 
                              setNewCategoryName(''); 
                              await fetchAdminTaxonomies(); 
                            } else { 
                              setCatError(error.message); 
                            } 
                          }}
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nova subcategoria</label>
                      <div className="flex gap-2">
                        <select 
                          className="border rounded px-3 py-2" 
                          value={newSubcategoryCatId} 
                          onChange={(e)=>setNewSubcategoryCatId(e.target.value)}
                        >
                          <option value="">Categoria</option>
                          {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input 
                          className="flex-1 border rounded px-3 py-2" 
                          value={newSubcategoryName} 
                          onChange={(e)=>setNewSubcategoryName(e.target.value)} 
                          placeholder="Nome da subcategoria" 
                        />
                        <button 
                          className="bg-cyan-700 text-white px-3 py-2 rounded" 
                          onClick={async()=>{ 
                            if(!newSubcategoryName.trim()||!newSubcategoryCatId) return; 
                            const nextOrder = Math.max(0, ...subcategories.filter(s=> s.category_id === newSubcategoryCatId).map((s:any)=> (s.sort_order ?? 0))) + 1;
                            const { error } = await supabase.from('subcategories').insert({ name: newSubcategoryName.trim(), category_id: newSubcategoryCatId, sort_order: nextOrder }); 
                            if(!error){ 
                              setNewSubcategoryName(''); 
                              await fetchAdminTaxonomies(); 
                            } else { 
                              setCatError(error.message); 
                            } 
                          }}
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Novo local</label>
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 border rounded px-3 py-2" 
                          value={newLocationName} 
                          onChange={(e)=>setNewLocationName(e.target.value)} 
                        />
                        <button 
                          className="bg-cyan-700 text-white px-3 py-2 rounded" 
                          onClick={async()=>{ 
                            if(!newLocationName.trim()) return; 
                            const nextOrder = Math.max(0, ...locations.map((l:any)=> (l.sort_order ?? 0))) + 1;
                            const { error } = await supabase.from('locations').insert({ name: newLocationName.trim(), sort_order: nextOrder }); 
                            if(!error){ 
                              setNewLocationName(''); 
                              await fetchAdminTaxonomies(); 
                            } else { 
                              setCatError(error.message); 
                            } 
                          }}
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : view === 'comoChegar' ? (
          <ComoChegar 
            onBack={() => setView('none')} 
            onNext={() => setView('events')} 
            onGoToComoChegar={openComoChegar}
            onGoToEvents={openEvents}
            onGoToHistory={openHistoryPublic}
            onGoToTours={openTours}
          />
        ) : view === 'anuncie' ? (
          <Anuncie
            categories={categories}
            subcategories={subcategories}
            locations={locations}
            onBack={() => setView('none')}
            whatsappContact={whatsappDigits}
          />
        ) : view === 'useful' ? (
          <div className="container mx-auto px-4 mt-8 max-w-2xl">
            <div className="">
              <h2 className="text-xl font-bold mb-4">Informações Úteis</h2>
              {usefulPublicLoading ? (
                <p>Carregando...</p>
              ) : usefulPublicError ? (
                <p className="text-red-600">{usefulPublicError}</p>
              ) : usefulPublic.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhuma informação disponível.</p>
              ) : (
                <div className="space-y-4">
                  {usefulPublic.map((row: any) => (
                    <div key={row.id} className="border rounded p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-1">{row.title}</h3>
                      {row.body && <p className="text-gray-700 whitespace-pre-wrap">{row.body}</p>}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <button onClick={() => setView('none')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
              </div>
            </div>
          </div>
        ) : view === 'events' ? (
          <div className="container mx-auto px-4 pt-0 max-w-3xl">
            <div className="w-screen relative left-0 right-0 -ml-[50vw] -mr-[50vw] bg-white sticky top-0 z-40">
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="flex items-center justify-between py-3">
                  <button onClick={() => setView('none')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
                  <h2 className="text-2xl font-bold text-[#003B63]">Festas & Eventos</h2>
                  <button onClick={() => setView('historyPage')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Próximo</button>
                </div>
              </div>
            </div>
            <div>
              {publicEventsLoading ? (
                <p>Carregando...</p>
              ) : publicEventsError ? (
                <p className="text-red-600">{publicEventsError}</p>
              ) : publicEvents.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhum evento encontrado.</p>
              ) : (
                <div className="space-y-4">
                  {publicEvents.map((ev) => {
                    const d = new Date(ev.date);
                    const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const weekdayRaw = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
                    const locationName = locations.find(l => l.id === (ev as any).location_id)?.name;
                    const share = async () => {
                      try {
                        const url = (ev as any).link || window.location.href;
                        const text = `${ev.title} - ${day} - ${weekday}${locationName ? `\nLocal: ${locationName}` : ''}`;
                        if ((navigator as any).share) {
                          await (navigator as any).share({ title: ev.title, text, url });
                        } else if (navigator.clipboard) {
                          await navigator.clipboard.writeText(`${ev.title}\nData: ${day} - ${weekday}${locationName ? `\nLocal: ${locationName}` : ''}\n${url}`);
                          alert('Link copiado para a Ã¡rea de transferÃªncia.');
                        }
                      } catch {}
                    };
                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl bg-blue-50 p-3 cursor-pointer hover:bg-blue-100 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                        onClick={() => { setSelectedEvent(ev); setView('eventDetail'); }}
                      >
                        {ev.banner_url && (
                          <div className="rounded-xl overflow-hidden mb-3">
                            <img src={ev.banner_url} alt={ev.title} className="w-full h-56 object-cover" />
                          </div>
                        )}
                        <div className="px-1">
                          <h3 className="font-extrabold text-slate-800 text-lg mb-1">{ev.title}</h3>
                          <p className="text-sm text-gray-700"><span className="font-semibold">Data:</span> {day} - {weekday}{ev.time ? ` • ${ev.time}` : ''}</p>
                          {locationName && (
                            <p className="text-sm text-gray-700"><span className="font-semibold">Local:</span> {locationName}</p>
                          )}
                        </div>
                        <button onClick={()=>{ setSelectedEvent(ev); setView('eventDetail'); }} className="mt-3 w-full py-2 rounded bg-[#003B63]/90 hover:bg-[#003B63]/90 text-white font-semibold">Saiba mais</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : view === 'eventDetail' ? (
          <div className="container mx-auto px-4 pt-0 max-w-3xl">
            <div className="w-screen relative left-0 right-0 -ml-[50vw] -mr-[50vw] bg-white sticky top-0 z-40">
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="flex items-center justify-between py-3">
                  <button onClick={() => setView('events')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
                  <h2 className="text-2xl font-bold text-[#003B63]">Detalhes do Evento</h2>
                  <button onClick={() => setView('historyPage')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Próximo</button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              {!selectedEvent ? (
                <p className="text-gray-600">Evento nÃ£o encontrado.</p>
              ) : (
                <div>
                  {selectedEvent.banner_url && (
                    <div className="rounded-xl overflow-hidden mb-4">
                      <img src={selectedEvent.banner_url} alt={selectedEvent.title} className="w-full h-64 object-cover" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedEvent.title}</h3>
                  {(() => {
                    const d = new Date(selectedEvent.date);
                    const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const weekdayRaw = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
                    return (
                      <>
                        <p className="text-base text-gray-700 mb-1"><span className="font-semibold">Data:</span> {day} - {weekday}</p>
                        {selectedEvent.time && (
                          <p className="text-base text-gray-700 mb-1"><span className="font-semibold">Hora:</span> {selectedEvent.time}</p>
                        )}
                      </>
                    );
                  })()}
                  <p className="text-base text-gray-700 mb-1"><span className="font-semibold">Local:</span> {(selectedEvent as any).local_text ? (selectedEvent as any).local_text : '-'}</p>
                  {(() => { const addr = locations.find(l => l.id === (selectedEvent as any).location_id)?.name; return (<p className="text-base text-gray-700 mb-2"><span className="font-semibold">Endereço:</span> {addr || '-'}</p>); })()}
                  {selectedEvent.description && (
                    <div className="text-gray-800 whitespace-pre-wrap mt-3 mb-2">{selectedEvent.description}</div>
                  )}
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="flex items-center justify-center gap-3">
                      {(selectedEvent as any).instagram_url && (
                        <a
                          href={(selectedEvent as any).instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Instagram"
                          title="Instagram"
                          className="w-11 h-11 rounded-full bg-pink-600 hover:bg-pink-700 text-white inline-flex items-center justify-center shadow"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.67 0 3 1.33 3 3v10c0 1.67-1.33 3-3 3H7c-1.67 0-3-1.33-3-3V7c0-1.67 1.33-3 3-3zm11 2a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
                        </svg>
                      </a>
                      )}
                      {(selectedEvent as any).facebook_url && (
                        <a
                          href={(selectedEvent as any).facebook_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Facebook"
                          title="Facebook"
                          className="w-11 h-11 rounded-full bg-blue-700 hover:bg-blue-800 text-white inline-flex items-center justify-center shadow"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.08 5.66 21.2 10.44 22v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56v1.88h2.76l-.44 2.91h-2.32V22C18.34 21.2 22 17.08 22 12.06z"/>
                        </svg>
                      </a>
                      )}
                      <button
                        aria-label="Compartilhar"
                        title="Compartilhar"
                        onClick={async()=>{
                          try{
                            const url = (selectedEvent as any).link || window.location.href;
                            const d = new Date(selectedEvent.date);
                            const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                            const weekdayRaw = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                            const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
                            const loc = (locations.find(l => l.id === (selectedEvent as any).location_id)?.name) || '';
                            const text = `${selectedEvent.title} - ${day} - ${weekday}${loc ? `\nLocal: ${loc}` : ''}`;
                            if ((navigator as any).share) {
                              await (navigator as any).share({ title: selectedEvent.title, text, url });
                            } else if (navigator.clipboard) {
                              await navigator.clipboard.writeText(`${selectedEvent.title}\nData: ${day} - ${weekday}${loc ? `\nLocal: ${loc}` : ''}\n${url}`);
                              alert('Link copiado para a Ã¡rea de transferÃªncia.');
                            }
                          }catch{}
                        }}
                        className="w-11 h-11 rounded-full bg-gray-700 hover:bg-gray-800 text-white inline-flex items-center justify-center shadow"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M18 8a3 3 0 10-2.83-4H15a3 3 0 103 3zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6zM8.59 15.17l6.83 3.41-.9 1.8-6.83-3.41.9-1.8zm6.83-9.55l.9 1.8-6.83 3.41-.9-1.8 6.83-3.41z"/>
                        </svg>
                      </button>
                    </div>
                    {selectedEvent.link && (
                      <a
                        href={selectedEvent.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-cyan-700 hover:bg-cyan-800 text-white font-semibold px-6 py-3 shadow w-full sm:w-auto"
                        style={{ minWidth: 220 }}
                      >
                        COMPRAR INGRESSOS
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : view === 'phones' ? (
          <div className="container mx-auto px-4 mt-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Telefones Úteis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={phonesCatId}
                    onChange={async (e)=>{ const id=e.target.value; setPhonesCatId(id); setPhonesSubId(''); await fetchSubcategories(id||undefined); await fetchPublicPhones(); }}
                  >
                    <option value="">Todas</option>
                    {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoria</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={phonesSubId}
                    onChange={async (e)=>{ setPhonesSubId(e.target.value); await fetchPublicPhones(); }}
                    disabled={!phonesCatId}
                  >
                    <option value="">Todas</option>
                    {subcategories.filter(s=> !phonesCatId || s.category_id===phonesCatId).map(s=> (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async ()=>{ setPhonesCatId(''); setPhonesSubId(''); await fetchSubcategories(); await fetchPublicPhones(); }}
                    className="w-full md:w-auto bg-white border px-3 py-2 rounded hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {publicPhonesLoading ? (
                <p>Carregando...</p>
              ) : publicPhonesError ? (
                <p className="text-red-600">{publicPhonesError}</p>
              ) : publicPhones.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhum telefone encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {publicPhones.map((r:any) => (
                    <div key={r.id} className="border rounded p-3 flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center">
                        <h4 className="font-medium m-0">{r.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.phone && (
                          <a href={`tel:${r.phone}`} className="bg-white border px-3 py-1.5 rounded">Ligar</a>
                        )}
                        {r.whatsapp && (
                          <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-3 py-1.5 rounded">WhatsApp</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <button onClick={() => setView('none')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
              </div>
            </div>
          </div>
        ) : view === 'photos' ? (
          <div className="container mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Galeria de Fotos</h2>
              {publicPhotosLoading ? (
                <p>Carregando...</p>
              ) : publicPhotosError ? (
                <p className="text-red-600">{publicPhotosError}</p>
              ) : publicPhotos.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhuma foto disponÃ­vel.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {publicPhotos.map((p:any)=> (
                    <div key={p.id} className="rounded overflow-hidden border bg-gray-50">
                      <img src={p.image_url} alt={p.caption || 'Foto'} className="w-full h-40 object-cover" />
                      {p.caption && <div className="px-2 py-1 text-xs text-gray-700">{p.caption}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <button onClick={() => setView('none')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
              </div>
            </div>
          </div>
        ) : view === 'tours' ? (
          <div className="container mx-auto px-4 pt-0 max-w-4xl">
            <div className="w-screen relative left-0 right-0 -ml-[50vw] -mr-[50vw] bg-white sticky top-0 z-40">
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid grid-cols-3 items-center py-3">
                  <button onClick={() => setView('none')} className="justify-self-start px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
                  <h2 className="col-start-2 text-center text-2xl font-bold text-[#003B63]">Passeios</h2>
                </div>
              </div>
            </div>
            <div className="">
              {toursLoading ? (
                <p>Carregando...</p>
              ) : toursSections.length === 0 ? (
                null
              ) : (
                <div className="space-y-6">
                  {toursSections.map((sec) => (
                    <div key={sec.id} className="w-full text-left bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                      <div className="relative">
                        {sec.image_url && (
                          <img className="h-56 w-full object-cover" src={sec.image_url} alt={sec.title} />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{sec.title}</h3>
                        {Array.isArray(sec.bullets) && sec.bullets.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {sec.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                        {(sec.cta_text && sec.cta_url) && (
                          <div className="mt-3">
                            <a href={sec.cta_url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-cyan-700 text-white rounded">
                              {sec.cta_text}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Empresas relacionadas Ã  categoria "Passeios & Atividades" */}
            {toursBusinesses.length > 0 && (
              <div className="mt-10">
                <BusinessList 
                  businesses={toursBusinesses} 
                  onBusinessSelect={(b) => { setSelectedBusiness(b); setView('none'); }}
                  hideTitle
                />
              </div>
            )}
          </div>
        ) : view === 'historyPage' ? (
          <div className="container mx-auto px-4 pt-0 max-w-3xl">
            <div className="w-screen relative left-0 right-0 -ml-[50vw] -mr-[50vw] bg-white sticky top-0 z-40">
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="flex items-center justify-between py-3">
                  <button onClick={() => setView('none')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Voltar</button>
                  <h2 className="text-2xl font-bold text-[#003B63]">Nossa História</h2>
                  <button onClick={() => setView('tours')} className="px-4 py-1.5 rounded-full bg-gray-300 text-gray-800 text-sm font-semibold">Próximo</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              {historyPublicLoading ? (
                <p>Carregando...</p>
              ) : historyPublicError ? (
                <p className="text-red-600">{historyPublicError}</p>
              ) : (
                <>
                  <div className="rounded-lg overflow-hidden border bg-gray-50 mb-6">
                    <img
                      src={(historyPublicImages[0]?.image_url) || '/actions/nossa-historia.png'}
                      alt={historyPublicImages[0]?.caption || 'História'}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                    {historyPublicImages[0]?.caption && (
                      <div className="px-3 py-2 text-xs text-gray-700">{historyPublicImages[0]?.caption}</div>
                    )}
                  </div>

                  {historyPublicBody && (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 text-justify">{historyPublicBody}</div>
                  )}

                  {!historyPublicBody && historyPublicImages.length === 0 && (
                    <p className="text-gray-600 text-sm">Nenhum conteÃºdo disponÃ­vel.</p>
                  )}
                </>
              )}
            </div>
          </div>
        ) : selectedBusiness ? (
          <BusinessDetail 
            business={selectedBusiness} 
            onBack={handleBack}
            otherBusinesses={otherBusinesses}
            onSelectBusiness={handleSelectBusiness}
            onAfterReview={fetchPublicBusinesses}
            appName={guide.app_name}
            whatsappForCTA={whatsappDigits}
          />
        ) : (
          <>
            <Carousel 
              items={carouselPublicItems.length ? carouselPublicItems.map(it => ({ 
                image_url: it.image_url, 
                is_ad: it.is_ad, 
                cta_text: it.cta_text || undefined, 
                cta_url: it.cta_url || undefined 
              })) : undefined} 
              images={carouselPublicItems.length ? undefined : CAROUSEL_IMAGES} 
            />
            <div className="-mt-3">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
            <div className="container mx-auto px-4 mt-8">
              <ActionButtons onGoToComoChegar={openComoChegar} onGoToHistory={openHistoryPublic} onGoToPhotos={openPhotos} onGoToEvents={openEvents} onGoToTours={openTours} />
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-4 text-center">Explore por Categoria</h2>
                {/* NÃ­vel 1: Categorias */}
                {!homeCategoryId && (
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={async () => { setHomeCategoryId(''); setHomeSubcategoryId(''); setHomeLocationId(''); await fetchSubcategories(); }}
                      className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center text-white bg-slate-800`}
                    >
                      Todas as Categorias
                    </button>
                    {visibleCategories.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={async () => { setHomeCategoryId(c.id); setHomeSubcategoryId(''); setHomeLocationId(''); await fetchSubcategories(c.id); }}
                        className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center transition text-white ${['bg-orange-500','bg-yellow-400 text-slate-900','bg-cyan-500','bg-teal-500'][idx % 4]}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* NÃ­vel 2: Subcategorias */}
                {homeCategoryId && !homeSubcategoryId && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <span className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center ${['bg-orange-500 text-white','bg-yellow-400 text-slate-900','bg-cyan-500 text-white','bg-teal-500 text-white'][Math.max(0, categories.findIndex(c=>c.id===homeCategoryId)) % 4]}`}>{categories.find(c=>c.id===homeCategoryId)?.name}</span>
                      <button
                        onClick={async () => { setHomeCategoryId(''); setHomeSubcategoryId(''); setHomeLocationId(''); await fetchSubcategories(); }}
                        className="h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center bg-white text-gray-700 border hover:bg-gray-50"
                      >
                        Voltar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {visibleSubcategories.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => { setHomeSubcategoryId(s.id); setHomeLocationId(''); }}
                          className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center transition ${['bg-orange-500 text-white','bg-yellow-400 text-slate-900','bg-cyan-500 text-white','bg-teal-500 text-white'][Math.max(0, categories.findIndex(c=>c.id===homeCategoryId)) % 4]}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {homeCategoryId && homeSubcategoryId && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <span className={`h-12 px-6 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-orange-500 text-white','bg-yellow-400 text-slate-900','bg-cyan-500 text-white','bg-teal-500 text-white'][Math.max(0, categories.findIndex(c=>c.id===homeCategoryId)) % 4]}`}>{categories.find(c=>c.id===homeCategoryId)?.name}</span>
                      <span className={`h-12 px-6 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-orange-500 text-white','bg-yellow-400 text-slate-900','bg-cyan-500 text-white','bg-teal-500 text-white'][Math.max(0, categories.findIndex(c=>c.id===homeCategoryId)) % 4]}`}>{subcategories.find(s=>s.id===homeSubcategoryId)?.name}</span>
                      <button
                        onClick={() => { setHomeSubcategoryId(''); setHomeLocationId(''); }}
                        className="h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center bg-white text-gray-700 border hover:bg-gray-50"
                      >
                        Voltar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => { setHomeLocationId(''); }}
                        className={`h-12 px-6 rounded-full text-base font-semibold inline-flex items-center justify-center ${!homeLocationId ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700 border'}`}
                      >
                        Todos os Locais
                      </button>
                      {visibleLocations.map((l, idx) => (
                        <button
                          key={l.id}
                          onClick={() => setHomeLocationId(l.id)}
                          className={`h-12 px-4 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-green-100 text-green-700','bg-orange-100 text-orange-700','bg-teal-100 text-teal-700'][idx % 5]} hover:brightness-95`}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rating filter: single interactive 5-star row */}
              <div className="mb-6">
                <h3 className="text-2xl font-extrabold mb-3 text-slate-800 text-center">Filtrar por avaliações</h3>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2" role="radiogroup" aria-label="Filtro por avaliações">
                    {[1,2,3,4,5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setHomeRatingMin(n)}
                        role="radio"
                        aria-checked={homeRatingMin === n}
                        aria-label={`${n}+ estrelas`}
                        title={`${n}+ estrelas`}
                        className="p-1.5 hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 drop-shadow-sm ${homeRatingMin >= n ? 'text-slate-700' : 'text-slate-300'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" stroke="#003B63" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                  {homeRatingMin > 0 && (
                    <button onClick={() => setHomeRatingMin(0)} className="text-sm text-gray-600 underline">Limpar</button>
                  )}
                </div>
              </div>

              <BusinessList 
                businesses={filteredBusinesses} 
                onBusinessSelect={handleSelectBusiness} 
              />
            </div>
          </>
        )}
      </main>
      <Footer onGuide={handleHomeClick} onAnuncie={openAnuncie} onUseful={openUseful} onPhones={openPhones} />
    </div>
  );
};

export default App;
