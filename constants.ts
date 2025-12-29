import { Business } from './types';

export const CAROUSEL_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501973801540-537f08ccae7b?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1920&auto=format&fit=crop',
];

export const CATEGORIES: string[] = ['Todos', 'Restaurantes', 'Pousadas', 'Passeios', 'Lojas', 'Pizzarias', 'Cafeterias', 'Livrarias'];

export const BUSINESSES: Business[] = [
  {
    id: 1,
    name: 'Pizzaria Forno a Lenha',
    category: 'Pizzarias',
    tags: ['Restaurantes e Cafés', 'Pizzarias', 'Centro'],
    isPremium: true,
    rating: 5.0,
    reviewCount: 2,
    description: 'Sinta o sabor da Itália em cada fatia! Nossa pizzaria utiliza ingredientes frescos e importados para criar pizzas autênticas e deliciosas. A massa de fermentação lenta e o cozimento em forno a lenha garantem uma borda crocante e um sabor inigualável. Ambiente familiar e perfeito para qualquer ocasião.',
    address: 'Praça da Matriz, 50, Centro',
    phone: '(11) 94444-5678',
    whatsapp: '11944445678',
    instagram: 'pizzariafornoalenha',
    images: [
      'https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=1928&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528137871618-6ca50365e492?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=2070&auto=format&fit=crop'
    ],
    reviews: [
      { id: 1, author: 'Juliana Almeida', date: '20/07/2024', rating: 5, comment: 'A pizza de quatro queijos é sensacional. O atendimento também foi ótimo.' },
      { id: 2, author: 'Lucas Pereira', date: '22/07/2024', rating: 5, comment: 'Melhor pizza da cidade, sem dúvidas!' },
    ]
  },
  {
    id: 2,
    name: 'Pousada Paraíso',
    category: 'Pousadas',
    tags: ['Pousadas', 'Praia'],
    isPremium: false,
    rating: 4.8,
    reviewCount: 45,
    description: 'Conforto e tranquilidade a poucos passos da Segunda Praia. Café da manhã incluso.',
    address: 'Rua da Segunda Praia, 100',
    phone: '(75) 98877-6655',
    whatsapp: '75988776655',
    instagram: 'pousadaparaiso',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'],
    reviews: []
  },
  {
    id: 3,
    name: 'Passeio Volta à Ilha',
    category: 'Passeios',
    tags: ['Passeios', 'Aventura'],
    isPremium: true,
    rating: 4.9,
    reviewCount: 120,
    description: 'Explore as belezas de Tinharé e Boipeba em um passeio de lancha inesquecível.',
    address: 'Cais do Porto, s/n',
    phone: '(75) 99988-7766',
    whatsapp: '75999887766',
    instagram: 'voltailhamorro',
    images: ['https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1974&auto=format&fit=crop'],
    reviews: []
  },
  {
    id: 4,
    name: 'Café Grão Dourado',
    category: 'Cafeterias',
    tags: ['Cafeterias', 'Centro'],
    isPremium: true,
    rating: 4.7,
    reviewCount: 33,
    description: 'Cafés especiais e comidinhas deliciosas em um ambiente aconchegante.',
    address: 'Rua Caminho da Praia, 12',
    phone: '(75) 98811-2233',
    whatsapp: '75988112233',
    instagram: 'cafegraodourado',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop'],
    reviews: [],
  },
  {
    id: 5,
    name: 'Livraria Saber & Cia',
    category: 'Livrarias',
    tags: ['Lojas', 'Cultura'],
    isPremium: false,
    rating: 4.9,
    reviewCount: 15,
    description: 'Um refúgio para amantes da leitura com um acervo selecionado.',
    address: 'Vila, 35',
    phone: '(75) 98844-5566',
    whatsapp: '75988445566',
    instagram: 'livrariasaber',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1974&auto=format&fit=crop'],
    reviews: [],
  },
];
