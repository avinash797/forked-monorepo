-- ============================================================
-- Blog Schema Migration
-- Creates blog_authors, blog_categories, blog_posts,
-- blog_tags, and blog_post_tags tables with RLS, indexes,
-- and updated_at triggers.
-- ============================================================

-- =====================
-- 1. blog_authors
-- =====================
CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_blog_authors_updated_at
  BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for blog_authors"
  ON public.blog_authors FOR SELECT
  USING (true);

-- =====================
-- 2. blog_categories
-- =====================
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for blog_categories"
  ON public.blog_categories FOR SELECT
  USING (true);

-- =====================
-- 3. blog_posts
-- =====================
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES public.blog_authors(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE RESTRICT,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  dish_type_id UUID REFERENCES public.dish_types(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for published blog_posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= now());

-- Indexes
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_city_dish
  ON public.blog_posts(city_id, dish_type_id)
  WHERE city_id IS NOT NULL AND dish_type_id IS NOT NULL;

-- =====================
-- 4. blog_tags
-- =====================
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for blog_tags"
  ON public.blog_tags FOR SELECT
  USING (true);

-- =====================
-- 5. blog_post_tags (junction)
-- =====================
CREATE TABLE public.blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  blog_tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, blog_tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for blog_post_tags"
  ON public.blog_post_tags FOR SELECT
  USING (true);
