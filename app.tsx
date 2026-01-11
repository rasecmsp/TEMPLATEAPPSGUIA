import React, { useState, useMemo, useEffect, useRef } from 'react';
import Carousel from './components/Carousel';
import SearchBar from './components/SearchBar';
import ActionButtons from './components/ActionButtons';
import BusinessList from './components/BusinessList';
import BusinessDetail from './components/BusinessDetail';
import Footer from './components/Footer';
import { Business, GuideSettings } from './types';
import { BUSINESSES, CAROUSEL_IMAGES } from './constants';
import { createClient, Session } from '@supabase/supabase-js';
import Anuncie from './components/anuncie';
import ComoChegar from './components/ComoChegar';
import { useAuth } from './contexts/AuthContext';
import { useGuide } from './contexts/GuideContext';
import { supabase } from './lib/supabase';




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
  const [view, setView] = useState<'none' | 'anuncie' | 'comoChegar' | 'tours' | 'useful' | 'phones' | 'photos' | 'historyPage' | 'events' | 'eventDetail'>('none');

  const [publicBusinesses, setPublicBusinesses] = useState<Business[]>([]);
  const [publicBusinessesRaw, setPublicBusinessesRaw] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  const { session } = useAuth();
  const { guide: contextGuide, updateGuideSettings: contextUpdateGuide, loading: guideLoading, error: guideError, refreshGuide } = useGuide();
  const [guide, setGuide] = useState<GuideSettings>(contextGuide);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [splashFile, setSplashFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  useEffect(() => {
    if (contextGuide) setGuide(contextGuide);
  }, [contextGuide]);



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
      let { favicon_url, splash_url, app_icon_url } = guide;

      if (faviconFile) favicon_url = await uploadBrandFile(faviconFile, 'favicon');
      if (splashFile) splash_url = await uploadBrandFile(splashFile, 'splash');
      if (iconFile) app_icon_url = await uploadBrandFile(iconFile, 'icon');

      const payload: any = {
        app_name: guide.app_name,
        whatsapp: guide.whatsapp,
        favicon_url,
        splash_url,
        app_icon_url
      };

      await contextUpdateGuide(payload);

      alert('Dados do Guia salvos com sucesso.');
      setFaviconFile(null); setSplashFile(null); setIconFile(null);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar Dados do Guia');
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
    return { el, cleanup: () => { try { document.body.removeChild(el); } catch { } } };
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




  const handleHomeClick = () => {
    window.history.pushState(null, '', '/');
    setSelectedBusiness(null);
    setView('none');
    setHomeCategoryId('');
    setHomeSubcategoryId('');
    setHomeLocationId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setEventForm({ title: '', date: '', time: '', location_id: '', local_text: '', description: '', banner_url: '', link: '', instagram_url: '', facebook_url: '', visible: true, is_pinned: false, sort_order: 0 });
      setEventBannerFile(null);
      setEventBannerPreview('');
      await fetchEvents();
    } catch (err: any) {
      setEventsError(err.message);
    }
  };

  const editEvent = (row: EventDB) => {
    setEventEditingId(String(row.id));
    setEventForm({ title: row.title || '', date: row.date ? row.date.slice(0, 10) : '', time: row.time || '', location_id: row.location_id || '', local_text: (row as any).local_text || '', description: row.description || '', banner_url: row.banner_url || '', link: row.link || '', instagram_url: (row as any).instagram_url || '', facebook_url: (row as any).facebook_url || '', visible: !!row.visible, is_pinned: !!row.is_pinned, sort_order: Number(row.sort_order || 0) });
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
      setEventForm({ title: '', date: '', time: '', location_id: '', local_text: '', description: '', banner_url: '', link: '', instagram_url: '', facebook_url: '', visible: true, is_pinned: false, sort_order: 0 });
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

  // Auth listener removed in favor of AuthContext

  useEffect(() => {
    void fetchPublicBusinesses();
    void fetchPublicCarouselItems();
    void fetchCategories();
    void fetchSubcategories();
    void fetchLocations();
    // void fetchGuideSettings(); removed
  }, []);



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
        {view === 'comoChegar' ? (
          <ComoChegar
            onBack={() => setView('none')}
            onNext={() => setView('events')}
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
                      } catch { }
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
                        <button onClick={() => { setSelectedEvent(ev); setView('eventDetail'); }} className="mt-3 w-full py-2 rounded bg-[#003B63]/90 hover:bg-[#003B63]/90 text-white font-semibold">Saiba mais</button>
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
                            <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.67 0 3 1.33 3 3v10c0 1.67-1.33 3-3 3H7c-1.67 0-3-1.33-3-3V7c0-1.67 1.33-3 3-3zm11 2a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
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
                            <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.08 5.66 21.2 10.44 22v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56v1.88h2.76l-.44 2.91h-2.32V22C18.34 21.2 22 17.08 22 12.06z" />
                          </svg>
                        </a>
                      )}
                      <button
                        aria-label="Compartilhar"
                        title="Compartilhar"
                        onClick={async () => {
                          try {
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
                          } catch { }
                        }}
                        className="w-11 h-11 rounded-full bg-gray-700 hover:bg-gray-800 text-white inline-flex items-center justify-center shadow"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M18 8a3 3 0 10-2.83-4H15a3 3 0 103 3zM6 14a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6zM8.59 15.17l6.83 3.41-.9 1.8-6.83-3.41.9-1.8zm6.83-9.55l.9 1.8-6.83 3.41-.9-1.8 6.83-3.41z" />
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
                    onChange={async (e) => { const id = e.target.value; setPhonesCatId(id); setPhonesSubId(''); await fetchSubcategories(id || undefined); await fetchPublicPhones(); }}
                  >
                    <option value="">Todas</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategoria</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={phonesSubId}
                    onChange={async (e) => { setPhonesSubId(e.target.value); await fetchPublicPhones(); }}
                    disabled={!phonesCatId}
                  >
                    <option value="">Todas</option>
                    {subcategories.filter(s => !phonesCatId || s.category_id === phonesCatId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async () => { setPhonesCatId(''); setPhonesSubId(''); await fetchSubcategories(); await fetchPublicPhones(); }}
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
                  {publicPhones.map((r: any) => (
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
                  {publicPhotos.map((p: any) => (
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
                        className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center transition text-white ${['bg-orange-500', 'bg-yellow-400 text-slate-900', 'bg-cyan-500', 'bg-teal-500'][idx % 4]}`}
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
                      <span className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center ${['bg-orange-500 text-white', 'bg-yellow-400 text-slate-900', 'bg-cyan-500 text-white', 'bg-teal-500 text-white'][Math.max(0, categories.findIndex(c => c.id === homeCategoryId)) % 4]}`}>{categories.find(c => c.id === homeCategoryId)?.name}</span>
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
                          className={`h-12 px-6 rounded-full font-bold text-base shadow-md inline-flex items-center justify-center transition ${['bg-orange-500 text-white', 'bg-yellow-400 text-slate-900', 'bg-cyan-500 text-white', 'bg-teal-500 text-white'][Math.max(0, categories.findIndex(c => c.id === homeCategoryId)) % 4]}`}
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
                      <span className={`h-12 px-6 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-orange-500 text-white', 'bg-yellow-400 text-slate-900', 'bg-cyan-500 text-white', 'bg-teal-500 text-white'][Math.max(0, categories.findIndex(c => c.id === homeCategoryId)) % 4]}`}>{categories.find(c => c.id === homeCategoryId)?.name}</span>
                      <span className={`h-12 px-6 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-orange-500 text-white', 'bg-yellow-400 text-slate-900', 'bg-cyan-500 text-white', 'bg-teal-500 text-white'][Math.max(0, categories.findIndex(c => c.id === homeCategoryId)) % 4]}`}>{subcategories.find(s => s.id === homeSubcategoryId)?.name}</span>
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
                          className={`h-12 px-4 rounded-full text-base font-semibold inline-flex items-center justify-center ${['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700'][idx % 5]} hover:brightness-95`}
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
                    {[1, 2, 3, 4, 5].map((n) => (
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
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" stroke="#003B63" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
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
