import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPublicPosts, getPublicCategories, getPublicTags, BlogPost, BlogCategory, BlogTag } from '../../api/blog.api';
import SEO from '../../components/SEO';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Category slug
  const [selectedTag, setSelectedTag] = useState<string>(''); // Tag slug

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCategoriesAndTags();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, debouncedSearchTerm, selectedCategory, selectedTag]);



  const loadCategoriesAndTags = async () => {
    try {
      const catsRes = await getPublicCategories();
      setCategories(catsRes.data);

      const tagsRes = await getPublicTags();
      setTags(tagsRes.data);
    } catch (e) {
      console.error('Failed to load initial categories/tags', e);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await getPublicPosts({
        page,
        limit: 9,
        search: debouncedSearchTerm,
        categorySlug: selectedCategory,
        tagSlug: selectedTag,
      });
      setPosts(res.data.posts);
      setTotalPages(res.data.pagination.pages);
    } catch (error: any) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedTag(''); // reset tag filter when category changes
    setPage(1);
  };

  const handleTagSelect = (slug: string) => {
    setSelectedTag(slug);
    setSelectedCategory(''); // reset category filter when tag changes
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#23313A] font-sans">
      <SEO 
        title="Manas360 Blog | Mental Health & Mindfulness Tips"
        description="Explore insights, guides, and professional advice on mental wellness, therapy, mindfulness, and healthy living on the Manas360 Blog."
        url="https://manas360.com/blog"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Manas360 Blog | Mental Health & Mindfulness Tips",
          "description": "Explore insights, guides, and professional advice on mental wellness, therapy, mindfulness, and healthy living on the Manas360 Blog.",
          "url": "https://manas360.com/blog",
          "publisher": {
            "@type": "Organization",
            "name": "MANAS360",
            "logo": "https://manas360.com/AppIcon.jpeg"
          }
        }}
      />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F4FAF6] py-6 lg:py-10 border-b border-[#D8EAE1]">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-[#EBF6F0] px-3 py-0 text-[9px] font-bold uppercase tracking-widest text-[#2F7A5F] leading-none">
            Insights & Guides
          </span>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-[#172736] sm:text-5xl lg:text-6xl">
            The Manas360 Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#4E5D6A] sm:text-lg">
            Empowering your wellness journey with professional perspectives, research-backed mindfulness exercises, and therapy advice.
          </p>

          {/* SEARCH BAR */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="group relative flex items-center rounded-full border border-[#D8EAE1] bg-white p-1.5 shadow-sm transition-all focus-within:border-[#2F7A5F] focus-within:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-focus-within:bg-[#EBF6F0] group-focus-within:text-[#2F7A5F] ml-1">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search articles, guides, and tips..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border-none bg-transparent px-4 py-2 text-sm text-[#23313A] outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-0"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & POSTS GRID */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">

          {/* SIDEBAR FILTERS */}
          <aside className="space-y-8 lg:col-span-1">
            {/* Categories */}
            <div className="rounded-2xl border border-[#E8ECE9] bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-extrabold text-[#172736] mb-4">Categories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${!selectedCategory ? 'bg-[#EBF6F0] text-[#2F7A5F]' : 'text-[#4E5D6A] hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${selectedCategory === cat.slug ? 'bg-[#EBF6F0] text-[#2F7A5F]' : 'text-[#4E5D6A] hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="rounded-2xl border border-[#E8ECE9] bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-extrabold text-[#172736] mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.slug)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${selectedTag === tag.slug ? 'border-[#2F7A5F] bg-[#EBF6F0] text-[#2F7A5F]' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || selectedTag || searchTerm) && (
              <button
                onClick={handleClearFilters}
                className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-center text-xs font-bold text-gray-500 hover:border-red-500 hover:text-red-500 transition"
              >
                Clear All Filters
              </button>
            )}
          </aside>

          {/* BLOG POSTS GRID */}
          <section className="lg:col-span-3">
            {loading ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#2F7A5F]"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-24 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="font-display text-lg font-bold text-[#172736]">No articles found</h3>
                <p className="text-sm text-gray-500 mt-1">Try relaxing your search terms or filters.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Posts Cards Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {posts.map(post => (
                    <article
                      key={post.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8ECE9] bg-white transition hover:-translate-y-1 hover:shadow-md"
                    >
                      {/* Cover Image */}
                      <Link to={`/blogs/${post.slug}`} className="relative block aspect-video overflow-hidden bg-gray-150">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#F4FAF6] text-[#2F7A5F]">
                            <ImageIcon className="h-10 w-10 opacity-40" />
                          </div>
                        )}
                        {post.category && (
                          <span className="absolute left-4 top-4 rounded bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F7A5F] shadow-sm">
                            {post.category.name}
                          </span>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center gap-4 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Manas360 Admin'}
                          </span>
                        </div>

                        <h3 className="mt-3 font-display text-lg font-extrabold text-[#172736] group-hover:text-[#2F7A5F] transition-colors line-clamp-2">
                          <Link to={`/blogs/${post.slug}`}>{post.title}</Link>
                        </h3>

                        <p className="mt-2 text-xs text-[#4E5D6A] line-clamp-3">
                          {post.excerpt || 'Read this article to get detailed insights on your journey to mental wellness and self-care.'}
                        </p>

                        <div className="mt-auto pt-5 flex items-center justify-between border-t border-[#F4FAF6]">
                          <div className="flex flex-wrap gap-1">
                            {post.tags?.slice(0, 2).map(t => (
                              <span key={t.tag.id} className="text-[10px] text-gray-400 font-semibold">
                                #{t.tag.name}
                              </span>
                            ))}
                          </div>

                          <Link
                            to={`/blogs/${post.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#2F7A5F] hover:text-[#235d48]"
                          >
                            Read More
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* PAGINATION FOOTER */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-6">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
