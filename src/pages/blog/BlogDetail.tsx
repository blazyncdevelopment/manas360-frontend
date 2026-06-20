import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Copy, MessageSquare, Twitter, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPublicPostBySlug, getPublicPosts, BlogPost } from '../../api/blog.api';
import SEO from '../../components/SEO';

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPostAndRelated();
    }
  }, [slug]);



  const loadPostAndRelated = async () => {
    setLoading(true);
    try {
      const postRes = await getPublicPostBySlug(slug!);
      const blog = postRes.data;
      setPost(blog);

      // Load related posts from same category
      if (blog.category) {
        const relatedRes = await getPublicPosts({
          limit: 3,
          categorySlug: blog.category.slug,
        });
        // Filter out current post
        const filtered = (relatedRes.data.posts || []).filter(p => p.id !== blog.id);
        setRelatedPosts(filtered);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast.error('Article not found');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    if (!post) return;
    const text = encodeURIComponent(`Check out this article: "${post.title}" on Manas360: `);
    window.open(`https://api.whatsapp.com/send?text=${text}${window.location.href}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!post) return;
    const text = encodeURIComponent(`Check out "${post.title}" on @manas360: `);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${window.location.href}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFB]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#2F7A5F]"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#23313A] pb-20 font-sans">
      <SEO 
        title={`${post.metaTitle || post.title} | Manas360 Blog`}
        description={post.metaDescription || post.excerpt || ''}
        keywords={post.metaKeywords || ''}
        image={post.coverImage || ''}
        url={window.location.href}
        schema={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "image": post.coverImage || "https://manas360.com/AppIcon.jpeg",
          "author": {
            "@type": "Person",
            "name": post.author ? `${post.author.firstName} ${post.author.lastName}` : "Manas360 Expert"
          },
          "publisher": {
            "@type": "Organization",
            "name": "MANAS360",
            "logo": {
              "@type": "ImageObject",
              "url": "https://manas360.com/AppIcon.jpeg"
            }
          },
          "datePublished": post.publishedAt || new Date().toISOString()
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* BACK TO BLOGS BUTTON */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2F7A5F] hover:text-[#235d48] mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>

        {/* POST HEADER */}
        <header className="mb-8">
          {post.category && (
            <span className="inline-block rounded bg-[#EBF6F0] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#2F7A5F] mb-4">
              {post.category.name}
            </span>
          )}
          <h1 className="font-display text-3xl font-black tracking-tight text-[#172736] sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-500 border-y border-[#E8ECE9] py-4">
            <div className="flex items-center gap-2">
              {post.author?.profileImageUrl ? (
                <img src={post.author.profileImageUrl} alt="Author" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF6F0] text-[#2F7A5F]">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="font-bold text-gray-700">
                {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Manas360 Expert'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : ''}
              </span>
            </div>
            
            {/* Share Widget */}
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={handleCopyLink} 
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Copy Link"
              >
                <Copy className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={handleShareWhatsApp} 
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Share on WhatsApp"
              >
                <MessageSquare className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={handleShareTwitter} 
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Share on Twitter"
              >
                <Twitter className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* HERO IMAGE */}
        {post.coverImage ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-[#E8ECE9] shadow-sm">
            <img src={post.coverImage} alt={post.title} className="w-full aspect-[21/9] object-cover" />
          </div>
        ) : null}

        {/* MAIN BODY CONTENT */}
        <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-extrabold prose-p:text-base prose-p:leading-relaxed text-gray-700">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            className="space-y-6"
          />
        </article>

        {/* TAGS BOTTOM LIST */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-[#E8ECE9]">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              <ImageIcon className="h-3.5 w-3.5" /> Post Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(t => (
                <Link 
                  key={t.tag.id} 
                  to={`/blog?tagSlug=${t.tag.slug}`}
                  className="rounded-full bg-[#EBF6F0] px-3.5 py-1 text-xs font-semibold text-[#2F7A5F] hover:bg-[#2F7A5F] hover:text-white transition"
                >
                  #{t.tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA COMPONENT */}
        <section className="mt-16 rounded-2xl bg-[#F4FAF6] border border-[#D8EAE1] p-8 text-center">
          <h3 className="font-display text-xl font-extrabold text-[#172736]">Need Support on Your Journey?</h3>
          <p className="text-sm text-[#4E5D6A] mt-2 max-w-xl mx-auto">
            Our network of certified clinical therapists, psychologists, and wellness guides is ready to support you.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link 
              to="/find-spark" 
              className="rounded-xl bg-[#2F7A5F] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#235d48] transition"
            >
              Consult a Therapist
            </Link>
            <Link 
              to="/assessment" 
              className="rounded-xl bg-white border border-[#D8EAE1] px-5 py-2.5 text-sm font-semibold text-[#2F7A5F] hover:bg-gray-50 transition"
            >
              Take Wellness Assessment
            </Link>
          </div>
        </section>

        {/* RELATED POSTS */}
        {relatedPosts.length > 0 && (
          <footer className="mt-16 border-t border-[#E8ECE9] pt-12">
            <h3 className="font-display text-lg font-black text-[#172736] mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map(related => (
                <article key={related.id} className="group flex flex-col overflow-hidden rounded-xl border border-[#E8ECE9] bg-white transition hover:-translate-y-1 hover:shadow-sm">
                  <Link to={`/blog/${related.slug}`} className="block aspect-video overflow-hidden bg-gray-150 relative">
                    {related.coverImage ? (
                      <img src={related.coverImage} alt={related.title} className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F4FAF6] text-[#2F7A5F]">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4 flex flex-1 flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      {related.category?.name || 'Wellness'}
                    </span>
                    <h4 className="mt-1 font-display text-sm font-bold text-[#172736] group-hover:text-[#2F7A5F] transition-colors line-clamp-2">
                      <Link to={`/blog/${related.slug}`}>{related.title}</Link>
                    </h4>
                  </div>
                </article>
              ))}
            </div>
          </footer>
        )}

      </div>
    </div>
  );
}
