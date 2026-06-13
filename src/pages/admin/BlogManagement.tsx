import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Edit2, Trash2, Tag as TagIcon, FolderOpen, 
  Search, Globe, FileEdit, X, ArrowLeft, Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getAdminPosts, createAdminPost, updateAdminPost, deleteAdminPost, uploadBlogCoverImage,
  getPublicCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  getPublicTags, createAdminTag, deleteAdminTag,
  BlogPost, BlogCategory, BlogTag 
} from '../../api/blog.api';

type ActiveTab = 'posts' | 'categories' | 'tags';

export default function BlogManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
  
  // Category / Tag Form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);

  const [tagName, setTagName] = useState('');

  // S3 upload states
  const [uploadingImage, setUploadingImage] = useState(false);

  // Selected tags for the post
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [activeTab, page, searchTerm, statusFilter, categoryFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const postsRes = await getAdminPosts({
          page,
          limit: 10,
          search: searchTerm,
          categoryId: categoryFilter,
          status: statusFilter,
        });
        setPosts(postsRes.data.posts);
        setTotalPages(postsRes.data.pagination.pages);
      }
      
      const catsRes = await getPublicCategories();
      setCategories(catsRes.data);

      const tagsRes = await getPublicTags();
      setTags(tagsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  // --- POST OPERATIONS ---
  const handleCreatePostClick = () => {
    setCurrentPost({
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      categoryId: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      published: false,
      slug: '',
    });
    setSelectedTags([]);
    setIsEditing(true);
  };

  const handleEditPostClick = async (post: BlogPost) => {
    setCurrentPost(post);
    setSelectedTags(post.tags?.map(t => t.tag.name) || []);
    setIsEditing(true);
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await deleteAdminPost(id);
      toast.success('Post deleted successfully');
      loadInitialData();
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadRes = await uploadBlogCoverImage(file);
      setCurrentPost(prev => prev ? { ...prev, coverImage: uploadRes.data.objectUrl } : null);
      toast.success('Cover image uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload cover image to S3');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost?.title || !currentPost?.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const payload = {
        title: currentPost.title,
        content: currentPost.content,
        excerpt: currentPost.excerpt,
        coverImage: currentPost.coverImage,
        categoryId: currentPost.categoryId,
        tags: selectedTags,
        metaTitle: currentPost.metaTitle,
        metaDescription: currentPost.metaDescription,
        metaKeywords: currentPost.metaKeywords,
        published: currentPost.published,
        slug: currentPost.slug,
      };

      if (currentPost.id) {
        await updateAdminPost(currentPost.id, payload);
        toast.success('Post updated successfully');
      } else {
        await createAdminPost(payload);
        toast.success('Post created successfully');
      }
      setIsEditing(false);
      loadInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  // --- CATEGORY OPERATIONS ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCat) {
        await updateAdminCategory(editingCat.id, catName, catDesc);
        toast.success('Category updated successfully');
      } else {
        await createAdminCategory(catName, catDesc);
        toast.success('Category created successfully');
      }
      setCatName('');
      setCatDesc('');
      setEditingCat(null);
      loadInitialData();
    } catch (error: any) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteAdminCategory(id);
      toast.success('Category deleted');
      loadInitialData();
    } catch (error: any) {
      toast.error('Failed to delete category');
    }
  };

  // --- TAG OPERATIONS ---
  const handleAddTagAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    try {
      await createAdminTag(tagName);
      toast.success('Tag created successfully');
      setTagName('');
      loadInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleDeleteTagAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    try {
      await deleteAdminTag(id);
      toast.success('Tag deleted');
      loadInitialData();
    } catch (error: any) {
      toast.error('Failed to delete tag');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink-100 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">Blog Management</h2>
          <p className="text-sm text-ink-500">Create, edit and optimize advanced blog posts with categories, tags, and SEO tags.</p>
        </div>
        {!isEditing && activeTab === 'posts' && (
          <button
            onClick={handleCreatePostClick}
            className="flex items-center gap-2 rounded-xl bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-500"
          >
            <Plus className="h-4.5 w-4.5" />
            New Post
          </button>
        )}
      </div>

      {isEditing ? (
        // --- POST EDITOR PAGE ---
        <div className="rounded-2xl border border-ink-150 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(false)} 
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-ink-900">
              {currentPost?.id ? 'Edit Post' : 'Create New Post'}
            </h3>
          </div>

          <form onSubmit={handleSavePost} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              
              {/* Main Content Area */}
              <div className="space-y-5 lg:col-span-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Post Title</label>
                  <input
                    type="text"
                    required
                    value={currentPost?.title || ''}
                    onChange={e => setCurrentPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Enter an engaging post title..."
                    className="mt-1 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Custom URL Slug (Optional)</label>
                  <input
                    type="text"
                    value={currentPost?.slug || ''}
                    onChange={e => setCurrentPost(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    placeholder="e.g. mindfulness-tips-for-anxiety"
                    className="mt-1 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-sage-500"
                  />
                  <p className="mt-1 text-[11px] text-ink-400">Leave empty to auto-generate from title. Use lower case letters, numbers, and hyphens only.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Excerpt / Short Description</label>
                  <textarea
                    rows={3}
                    value={currentPost?.excerpt || ''}
                    onChange={e => setCurrentPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                    placeholder="Provide a quick summary shown on list pages..."
                    className="mt-1 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Post Content</label>
                  <textarea
                    rows={15}
                    required
                    value={currentPost?.content || ''}
                    onChange={e => setCurrentPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Write your post content here (supports raw HTML markup)..."
                    className="mt-1 w-full rounded-xl border border-ink-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-sage-500"
                  />
                </div>
              </div>

              {/* Sidebar Settings Area */}
              <div className="space-y-6">
                
                {/* Publish & Category */}
                <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Publish Configuration</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-700">Publish Post?</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input 
                        type="checkbox" 
                        checked={currentPost?.published || false}
                        onChange={e => setCurrentPost(prev => prev ? { ...prev, published: e.target.checked } : null)}
                        className="peer sr-only" 
                      />
                      <div className="peer h-6 w-11 rounded-full bg-ink-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sage-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Category</label>
                    <select
                      value={currentPost?.categoryId || ''}
                      onChange={e => setCurrentPost(prev => prev ? { ...prev, categoryId: e.target.value } : null)}
                      className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* S3 Cover Image Upload */}
                <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Cover Image</h4>
                  
                  {currentPost?.coverImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-ink-150 aspect-video">
                      <img src={currentPost.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setCurrentPost(prev => prev ? { ...prev, coverImage: '' } : null)}
                          className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-ink-200 rounded-xl py-6 cursor-pointer hover:border-sage-400 bg-white transition">
                      {uploadingImage ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-sage-600"></div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-ink-400 mb-2" />
                          <span className="text-xs font-semibold text-ink-600">Click to Upload Cover Image</span>
                          <span className="text-[10px] text-ink-400 mt-1">Supports PNG, JPG, JPEG</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>

                {/* Tags Section */}
                <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Tags</h4>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag name"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      className="w-full rounded-lg border border-ink-200 px-3 py-1.5 text-xs outline-none focus:border-sage-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="rounded-lg bg-ink-800 px-3 text-xs font-bold text-white hover:bg-ink-700"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 rounded bg-white border border-ink-150 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-ink-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SEO Accordion */}
                <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">SEO Meta Tags</h4>
                  
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Meta Title ({currentPost?.metaTitle?.length || 0}/60 chars)
                    </label>
                    <input
                      type="text"
                      value={currentPost?.metaTitle || ''}
                      onChange={e => setCurrentPost(prev => prev ? { ...prev, metaTitle: e.target.value } : null)}
                      placeholder="Search engines show title up to 60 chars"
                      className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none focus:border-sage-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Meta Description ({currentPost?.metaDescription?.length || 0}/160 chars)
                    </label>
                    <textarea
                      rows={3}
                      value={currentPost?.metaDescription || ''}
                      onChange={e => setCurrentPost(prev => prev ? { ...prev, metaDescription: e.target.value } : null)}
                      placeholder="Summary snippet shown in google search"
                      className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none focus:border-sage-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Keywords (Comma separated)</label>
                    <input
                      type="text"
                      value={currentPost?.metaKeywords || ''}
                      onChange={e => setCurrentPost(prev => prev ? { ...prev, metaKeywords: e.target.value } : null)}
                      placeholder="e.g. anxiety, mental health, therapy"
                      className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none focus:border-sage-500"
                    />
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-ink-100 pt-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-sage-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sage-500"
              >
                {currentPost?.id ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // --- ADMIN TABS VIEW ---
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-ink-100">
            <button
              onClick={() => { setActiveTab('posts'); setPage(1); }}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === 'posts' ? 'border-sage-600 text-sage-600' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
            >
              <FileText className="h-4.5 w-4.5" />
              Blog Posts
            </button>
            <button
              onClick={() => { setActiveTab('categories'); setPage(1); }}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === 'categories' ? 'border-sage-600 text-sage-600' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
            >
              <FolderOpen className="h-4.5 w-4.5" />
              Categories
            </button>
            <button
              onClick={() => { setActiveTab('tags'); setPage(1); }}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === 'tags' ? 'border-sage-600 text-sage-600' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
            >
              <TagIcon className="h-4.5 w-4.5" />
              Tags
            </button>
          </div>

          {/* Filtering Area (only for Posts tab) */}
          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-ink-100 bg-white p-4 shadow-sm md:grid-cols-4">
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-ink-200 bg-ink-50/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-sage-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* TABLE VIEWS */}
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-sage-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="overflow-hidden rounded-2xl border border-ink-150 bg-white shadow-sm">
                  {posts.length === 0 ? (
                    <div className="py-16 text-center">
                      <FileText className="mx-auto h-12 w-12 text-ink-300 mb-3" />
                      <p className="text-sm font-semibold text-ink-700">No blog posts found</p>
                      <p className="text-xs text-ink-400 mt-1">Get started by creating your first post.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-ink-100 bg-ink-50/50 text-xs font-bold uppercase tracking-wider text-ink-500">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                          {posts.map(post => (
                            <tr key={post.id} className="hover:bg-ink-50/40 transition">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-ink-800 line-clamp-1">{post.title}</div>
                                <div className="text-[11px] text-ink-400 line-clamp-1 mt-0.5">/{post.slug}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="rounded bg-sage-50 px-2 py-0.5 text-xs font-semibold text-sage-700 border border-sage-100">
                                  {post.category?.name || 'Uncategorized'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {post.published ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-100">
                                    <Globe className="h-3 w-3" /> Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink-600 border border-ink-150">
                                    <FileEdit className="h-3 w-3" /> Draft
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-ink-500">
                                {new Date(post.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditPostClick(post)}
                                    className="rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="rounded p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-ink-100 bg-white px-6 py-4">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-medium text-ink-500">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Category List */}
                  <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-ink-150 bg-white shadow-sm">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-ink-100 bg-ink-50/50 text-xs font-bold uppercase tracking-wider text-ink-500">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {categories.map(cat => (
                          <tr key={cat.id} className="hover:bg-ink-50/40 transition">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-ink-800">{cat.name}</div>
                              <div className="text-[11px] text-ink-400">/{cat.slug}</div>
                            </td>
                            <td className="px-6 py-4 text-ink-500">{cat.description || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatDesc(cat.description || ''); }}
                                  className="rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="rounded p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add/Edit Category Form */}
                  <div className="rounded-2xl border border-ink-150 bg-white p-5 shadow-sm h-fit">
                    <h3 className="font-display text-sm font-bold text-ink-900 mb-4">
                      {editingCat ? 'Edit Category' : 'Create Category'}
                    </h3>
                    <form onSubmit={handleSaveCategory} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Category Name</label>
                        <input
                          type="text"
                          required
                          value={catName}
                          onChange={e => setCatName(e.target.value)}
                          placeholder="e.g. Mental Well-being"
                          className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sage-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Description</label>
                        <textarea
                          rows={3}
                          value={catDesc}
                          onChange={e => setCatDesc(e.target.value)}
                          placeholder="Brief description of category topics..."
                          className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sage-500"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        {editingCat && (
                          <button
                            type="button"
                            onClick={() => { setEditingCat(null); setCatName(''); setCatDesc(''); }}
                            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="rounded-lg bg-sage-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sage-500"
                        >
                          {editingCat ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'tags' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Tags list */}
                  <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-ink-150 bg-white shadow-sm p-6">
                    <div className="flex flex-wrap gap-2">
                      {tags.length === 0 ? (
                        <p className="text-xs text-ink-400">No tags configured yet.</p>
                      ) : (
                        tags.map(tag => (
                          <span 
                            key={tag.id} 
                            className="flex items-center gap-1.5 rounded-xl border border-ink-150 bg-ink-50/20 px-3 py-1 text-xs font-semibold text-ink-700"
                          >
                            #{tag.name}
                            <button 
                              onClick={() => handleDeleteTagAdmin(tag.id)} 
                              className="text-ink-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Tag Form */}
                  <div className="rounded-2xl border border-ink-150 bg-white p-5 shadow-sm h-fit">
                    <h3 className="font-display text-sm font-bold text-ink-900 mb-4">Create Tag</h3>
                    <form onSubmit={handleAddTagAdmin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Tag Name</label>
                        <input
                          type="text"
                          required
                          value={tagName}
                          onChange={e => setTagName(e.target.value)}
                          placeholder="e.g. anxiety-relief"
                          className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sage-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="rounded-lg bg-sage-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sage-500"
                        >
                          Create Tag
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
