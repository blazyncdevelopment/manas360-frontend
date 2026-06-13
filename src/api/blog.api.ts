import { http } from '../lib/http';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: string;
  authorId?: string;
  categoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
  category?: BlogCategory;
  tags?: Array<{ tag: BlogTag }>;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profileImageUrl?: string;
  };
}

export interface PaginatedBlogsResponse {
  posts: BlogPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// --- PUBLIC APIS ---

export const getPublicPosts = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  tagSlug?: string;
}) => {
  const response = await http.get<{ data: PaginatedBlogsResponse }>('/shared/blogs', { params });
  return response.data;
};

export const getPublicPostBySlug = async (slug: string) => {
  const response = await http.get<{ data: BlogPost }>(`/shared/blogs/${slug}`);
  return response.data;
};

export const getPublicCategories = async () => {
  const response = await http.get<{ data: BlogCategory[] }>('/shared/blog-categories');
  return response.data;
};

export const getPublicTags = async () => {
  const response = await http.get<{ data: BlogTag[] }>('/shared/blog-tags');
  return response.data;
};

// --- ADMIN APIS ---

export const getAdminPosts = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'published' | 'draft' | 'all';
}) => {
  const response = await http.get<{ data: PaginatedBlogsResponse }>('/admin/blogs', { params });
  return response.data;
};

export const getAdminPostById = async (id: string) => {
  const response = await http.get<{ data: BlogPost }>(`/admin/blogs/${id}`);
  return response.data;
};

export const createAdminPost = async (payload: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  tags?: string[]; // array of names or IDs
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  published?: boolean;
  slug?: string;
}) => {
  const response = await http.post<{ data: BlogPost }>('/admin/blogs', payload);
  return response.data;
};

export const updateAdminPost = async (
  id: string,
  payload: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    categoryId?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    published?: boolean;
    slug?: string;
  }
) => {
  const response = await http.put<{ data: BlogPost }>(`/admin/blogs/${id}`, payload);
  return response.data;
};

export const deleteAdminPost = async (id: string) => {
  const response = await http.delete(`/admin/blogs/${id}`);
  return response.data;
};

export const uploadBlogCoverImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await http.post<{ data: { objectKey: string; objectUrl: string } }>(
    '/admin/blogs/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Categories Admin CRUD
export const createAdminCategory = async (name: string, description?: string) => {
  const response = await http.post<{ data: BlogCategory }>('/admin/blog-categories', {
    name,
    description,
  });
  return response.data;
};

export const updateAdminCategory = async (id: string, name: string, description?: string) => {
  const response = await http.put<{ data: BlogCategory }>(`/admin/blog-categories/${id}`, {
    name,
    description,
  });
  return response.data;
};

export const deleteAdminCategory = async (id: string) => {
  const response = await http.delete(`/admin/blog-categories/${id}`);
  return response.data;
};

// Tags Admin CRUD
export const createAdminTag = async (name: string) => {
  const response = await http.post<{ data: BlogTag }>('/admin/blog-tags', { name });
  return response.data;
};

export const deleteAdminTag = async (id: string) => {
  const response = await http.delete(`/admin/blog-tags/${id}`);
  return response.data;
};
