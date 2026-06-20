'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search, BookOpen, Clock } from 'lucide-react';

const ALL_ARTICLES = [
  {
    category: 'Climate Action',
    title: 'Global Climate Action: Bridging the Emissions Gap',
    excerpt: 'UNEP\'s annual Emissions Gap Report highlights the urgent need for countries to deliver stronger climate commitments to limit warming to 1.5C.',
    source: 'UN Environment Programme',
    url: 'https://www.unep.org/resources/emissions-gap-report-2024',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    readTime: '6 min read',
    date: 'Jun 18, 2026'
  },
  {
    category: 'Net Zero Strategies',
    title: 'IPCC Sixth Assessment Report: Climate Change 2023',
    excerpt: 'The IPCC\'s comprehensive synthesis report outlines the physical science baseline, impact vulnerabilities, and mitigation strategies for global policy makers.',
    source: 'IPCC',
    url: 'https://www.ipcc.ch/report/ar6/syr/',
    image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800',
    readTime: '9 min read',
    date: 'Jun 12, 2026'
  },
  {
    category: 'Climate Action',
    title: 'Natural Climate Solutions to Reduce Global Emissions',
    excerpt: 'How forest restoration, agricultural practices, and wetland protection can provide up to a third of the mitigation needed by 2030.',
    source: 'The Nature Conservancy',
    url: 'https://www.nature.org/en-us/what-we-do/our-priorities/tackle-climate-change/',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    readTime: '5 min read',
    date: 'Jun 05, 2026'
  },
  {
    category: 'Renewable Energy',
    title: 'Vital Signs of the Planet: Global Temperature Tracking',
    excerpt: 'NASA\'s Earth Science division provides real-time satellite data tracking ice sheets, sea levels, global temperatures, and atmospheric carbon.',
    source: 'NASA Climate',
    url: 'https://climate.nasa.gov/',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=800',
    readTime: '4 min read',
    date: 'May 28, 2026'
  },
  {
    category: 'Carbon Reduction',
    title: 'Systems Change for Net-Zero: Sector Emissions Pathways',
    excerpt: 'WRI maps the transformations needed in energy, transport, cities, and agriculture to establish rapid global greenhouse gas reductions.',
    source: 'World Resources Institute',
    url: 'https://www.wri.org/climate',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=800',
    readTime: '7 min read',
    date: 'May 20, 2026'
  }
];

const CATEGORIES = ['All', 'Climate Action', 'Renewable Energy', 'Sustainable Cities', 'Carbon Reduction', 'Net Zero Strategies'];

export default function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter logic
  const filtered = ALL_ARTICLES.filter((art) => {
    const matchesSearch = 
      art.title.toLowerCase().includes(search.toLowerCase()) || 
      art.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || art.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1); // Reset page
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1); // Reset page
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col pt-16 font-sans text-[#111827]">
      
      {/* HEADER SECTION */}
      <section className="bg-[#F5F7FA] border-b border-gray-150 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0F172A] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 animate-pulse" />
            Climate Knowledge Hub
          </div>
          <h1 className="text-page text-[#0F172A] mt-1 max-w-3xl mx-auto leading-tight">
            Science-Backed Sustainability Insights
          </h1>
          <p className="text-body text-[#4B5563] max-w-2xl mx-auto">
            Read verified climate research, carbon offset methodologies, and policy breakdowns inspired by global environment programs.
          </p>

          {/* SEARCH INPUT */}
          <div className="max-w-md mx-auto relative pt-4">
            <Search className="absolute left-3.5 top-[28px] h-4.5 w-4.5 text-[#4B5563]" />
            <Input 
              type="text" 
              placeholder="Search articles by title or topic..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11 border-gray-200 focus:border-blue-600 rounded-xl bg-white shadow-sm text-[#111827] font-medium"
            />
          </div>
        </div>
      </section>

      {/* FILTER BUTTONS */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-wrap gap-2 justify-center border-b border-gray-100 pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs py-2.5 px-5 rounded-full font-bold transition-all cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-[#0F172A] text-white shadow-sm border border-[#0F172A]' 
                  : 'bg-white border border-gray-200 text-[#4B5563] hover:text-[#111827] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ARTICLES GRID */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
        {currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentItems.map((art, idx) => (
              <Card key={idx} className="shadow-sm border border-gray-150 rounded-2xl overflow-hidden bg-white flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
                <div>
                  <div className="h-48 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                    <span className="absolute top-4 left-4 bg-[#0F172A] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">{art.category}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-[#4B5563]">
                      <span>{art.date}</span>
                      <span className="font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded">{art.source}</span>
                    </div>
                    <h3 className="text-card text-[#111827] line-clamp-2 hover:text-[#0F172A] transition-colors leading-snug">{art.title}</h3>
                    <p className="text-small text-[#4B5563] leading-relaxed font-medium line-clamp-3">{art.excerpt}</p>
                  </div>
                </div>
                <CardContent className="p-6 pt-0 flex justify-between items-center border-t border-gray-100 mt-4 bg-gray-50/50 py-4">
                  <span className="text-xs font-bold text-[#4B5563] uppercase flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {art.readTime}
                  </span>
                  <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:text-[#0F172A] font-bold text-xs flex items-center gap-0.5 cursor-pointer">
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[#4B5563]">
            <p className="text-sm font-semibold">No articles found matching your criteria.</p>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="text-xs rounded-xl h-9 cursor-pointer"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-[#4B5563]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="text-xs rounded-xl h-9 cursor-pointer"
            >
              Next
            </Button>
          </div>
        )}
      </section>

    </div>
  );
}


